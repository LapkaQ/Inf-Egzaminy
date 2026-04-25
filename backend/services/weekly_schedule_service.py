from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta, time, date

from models.weekly_schedule import WeeklySchedule
from models.availability import AvailabilitySlot
from models.booking import Booking, BookingStatus
from models.tutor import TutorProfile
from models.user import User, UserRole
from schemas.weekly_schedule import WeeklyScheduleSet, DayScheduleResponse, TimeSlotResponse, WeeklyScheduleResponse

# How many weeks ahead to generate concrete availability slots
GENERATE_WEEKS_AHEAD = 4


def _get_tutor_profile_or_403(db: Session, user: User) -> TutorProfile:
    if user.role != UserRole.tutor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized. Must be a tutor."
        )
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutor profile not found. Create a profile first."
        )
    return profile


def set_weekly_schedule(db: Session, current_user: User, schedule_data: WeeklyScheduleSet):
    """
    Replace the tutor's entire weekly schedule and regenerate availability slots.
    """
    profile = _get_tutor_profile_or_403(db, current_user)

    # 1. Delete old weekly schedule rows for this tutor
    db.query(WeeklySchedule).filter(WeeklySchedule.tutor_id == profile.id).delete()

    # 2. Insert new weekly schedule rows
    for day in schedule_data.days:
        for slot in day.slots:
            db.add(WeeklySchedule(
                tutor_id=profile.id,
                day_of_week=day.day_of_week,
                start_time=slot.start_time,
                end_time=slot.end_time,
            ))

    # 3. Regenerate concrete availability slots
    _regenerate_slots(db, profile)

    db.commit()
    return get_weekly_schedule(db, current_user)


def get_weekly_schedule(db: Session, current_user: User) -> WeeklyScheduleResponse:
    """Return tutor's weekly schedule grouped by day."""
    profile = _get_tutor_profile_or_403(db, current_user)
    return _build_schedule_response(db, profile.id)


def get_weekly_schedule_public(db: Session, tutor_profile_id: int) -> WeeklyScheduleResponse:
    """Public endpoint: get a tutor's weekly pattern."""
    profile = db.query(TutorProfile).filter(TutorProfile.id == tutor_profile_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor not found")
    return _build_schedule_response(db, profile.id)


def _build_schedule_response(db: Session, tutor_profile_id: int) -> WeeklyScheduleResponse:
    rows = db.query(WeeklySchedule).filter(
        WeeklySchedule.tutor_id == tutor_profile_id
    ).order_by(WeeklySchedule.day_of_week, WeeklySchedule.start_time).all()

    days_map: dict[int, list] = {}
    for row in rows:
        days_map.setdefault(row.day_of_week, []).append(
            TimeSlotResponse(start_time=row.start_time, end_time=row.end_time)
        )

    days = [
        DayScheduleResponse(day_of_week=dow, slots=slots)
        for dow, slots in sorted(days_map.items())
    ]
    return WeeklyScheduleResponse(days=days)


def _regenerate_slots(db: Session, profile: TutorProfile):
    """
    Delete future availability slots (that don't have a confirmed/pending booking)
    and recreate them from the weekly schedule pattern.
    """
    now = datetime.utcnow()

    # Get IDs of slots that already have an active booking (don't delete those)
    booked_slots = db.query(AvailabilitySlot.id).join(
        Booking,
        (Booking.tutor_id == profile.user_id) &
        (Booking.start_time == AvailabilitySlot.start_time) &
        (Booking.end_time == AvailabilitySlot.end_time) &
        (Booking.status != BookingStatus.cancelled)
    ).filter(
        AvailabilitySlot.tutor_id == profile.id,
        AvailabilitySlot.start_time > now
    ).all()
    booked_ids = {row[0] for row in booked_slots}

    # Delete unbooked future slots
    future_slots = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.tutor_id == profile.id,
        AvailabilitySlot.start_time > now,
    ).all()

    for slot in future_slots:
        if slot.id not in booked_ids:
            db.delete(slot)

    db.flush()

    # Get the new weekly patterns
    patterns = db.query(WeeklySchedule).filter(
        WeeklySchedule.tutor_id == profile.id
    ).all()

    if not patterns:
        return

    # Generate slots for the next GENERATE_WEEKS_AHEAD weeks
    today = date.today()
    end_date = today + timedelta(weeks=GENERATE_WEEKS_AHEAD)

    # Collect existing slot times to avoid duplicates
    existing = set()
    remaining_slots = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.tutor_id == profile.id,
        AvailabilitySlot.start_time > now,
    ).all()
    for s in remaining_slots:
        existing.add((s.start_time, s.end_time))

    current_date = today
    while current_date <= end_date:
        dow = current_date.weekday()  # 0=Monday
        for pattern in patterns:
            if pattern.day_of_week == dow:
                # Split the pattern range into individual 1-hour slots
                pattern_start = datetime.combine(current_date, pattern.start_time)
                pattern_end = datetime.combine(current_date, pattern.end_time)

                slot_start = pattern_start
                while slot_start < pattern_end:
                    slot_end = slot_start + timedelta(hours=1)
                    # Don't exceed the pattern end time
                    if slot_end > pattern_end:
                        slot_end = pattern_end

                    # Skip if in the past
                    if slot_start <= now:
                        slot_start = slot_end
                        continue

                    # Skip if already exists
                    if (slot_start, slot_end) in existing:
                        slot_start = slot_end
                        continue

                    db.add(AvailabilitySlot(
                        tutor_id=profile.id,
                        start_time=slot_start,
                        end_time=slot_end,
                    ))
                    existing.add((slot_start, slot_end))

                    slot_start = slot_end

        current_date += timedelta(days=1)


def regenerate_slots_for_tutor(db: Session, current_user: User):
    """Manually trigger slot regeneration (e.g. to extend further into the future)."""
    profile = _get_tutor_profile_or_403(db, current_user)
    _regenerate_slots(db, profile)
    db.commit()
    return {"detail": "Slots regenerated successfully"}
