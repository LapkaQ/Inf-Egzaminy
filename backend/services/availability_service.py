from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, exists
from fastapi import HTTPException, status
from datetime import datetime

from models.availability import AvailabilitySlot
from models.booking import Booking, BookingStatus
from models.tutor import TutorProfile, TutorSubject
from models.user import User, UserRole
from schemas.availability import AvailabilitySlotCreate
from typing import Optional


def _get_tutor_profile_or_403(db: Session, user: User) -> TutorProfile:
    if user.role != UserRole.tutor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to perform this action. Must be a tutor."
        )
    tutor_profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if not tutor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutor profile not found. Please create a profile first."
        )
    return tutor_profile


def _not_booked_filter(tutor_profile_id: int):
    """
    Returns a filter condition that excludes slots which already have 
    an active (non-cancelled) booking for the given tutor.
    """
    profile = TutorProfile.__table__.alias()
    return ~exists(
        Booking.__table__.select().where(
            (Booking.start_time == AvailabilitySlot.start_time) &
            (Booking.end_time == AvailabilitySlot.end_time) &
            (Booking.status != BookingStatus.cancelled)
        ).correlate(AvailabilitySlot)
    )


def add_availability_slot(db: Session, current_user: User, slot_data: AvailabilitySlotCreate) -> AvailabilitySlot:
    tutor_profile = _get_tutor_profile_or_403(db, current_user)

    # Check for overlapping slots
    overlapping_slot = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.tutor_id == tutor_profile.id,
        AvailabilitySlot.end_time > slot_data.start_time,
        AvailabilitySlot.start_time < slot_data.end_time
    ).first()

    if overlapping_slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This slot overlaps with an existing slot (from {overlapping_slot.start_time} to {overlapping_slot.end_time})"
        )

    new_slot = AvailabilitySlot(
        tutor_id=tutor_profile.id,
        start_time=slot_data.start_time,
        end_time=slot_data.end_time
    )
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    return new_slot


def get_tutor_availability(db: Session, tutor_profile_id: int):
    """Public endpoint for students — returns only UNBOOKED future slots."""
    now_utc = datetime.utcnow()
    
    # Get tutor's user_id for booking check
    profile = db.query(TutorProfile).filter(TutorProfile.id == tutor_profile_id).first()
    if not profile:
        return []
    
    # Subquery: IDs of slots that have an active booking
    booked_slot_ids = db.query(AvailabilitySlot.id).join(
        Booking,
        (Booking.tutor_id == profile.user_id) &
        (Booking.start_time == AvailabilitySlot.start_time) &
        (Booking.end_time == AvailabilitySlot.end_time) &
        (Booking.status != BookingStatus.cancelled)
    ).filter(
        AvailabilitySlot.tutor_id == tutor_profile_id
    ).subquery()
    
    slots = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.tutor_id == tutor_profile_id,
        AvailabilitySlot.end_time >= now_utc,
        ~AvailabilitySlot.id.in_(booked_slot_ids)
    ).order_by(AvailabilitySlot.start_time).all()
    return slots


def search_availability(
    db: Session, 
    tutor_profile_id: Optional[int] = None, 
    subject: Optional[str] = None
):
    """Search available (unbooked) slots."""
    now_utc = datetime.utcnow()
    
    query = db.query(AvailabilitySlot).filter(AvailabilitySlot.end_time >= now_utc)
    
    if tutor_profile_id is not None:
        query = query.filter(AvailabilitySlot.tutor_id == tutor_profile_id)
        
    if subject is not None:
        query = query.join(TutorProfile, AvailabilitySlot.tutor_id == TutorProfile.id)
        query = query.join(TutorSubject, TutorSubject.tutor_profile_id == TutorProfile.id)
        query = query.filter(TutorSubject.name == subject)
    
    # Exclude slots with active bookings (join via tutor user_id + time match)
    query = query.outerjoin(
        Booking,
        (Booking.start_time == AvailabilitySlot.start_time) &
        (Booking.end_time == AvailabilitySlot.end_time) &
        (Booking.status != BookingStatus.cancelled)
    ).filter(Booking.id == None)
        
    return query.order_by(AvailabilitySlot.start_time).all()


def get_my_availability(db: Session, current_user: User):
    tutor_profile = _get_tutor_profile_or_403(db, current_user)
    slots = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.tutor_id == tutor_profile.id
    ).order_by(AvailabilitySlot.start_time).all()
    return slots


def delete_availability_slot(db: Session, current_user: User, slot_id: int):
    tutor_profile = _get_tutor_profile_or_403(db, current_user)
    
    slot = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.id == slot_id,
        AvailabilitySlot.tutor_id == tutor_profile.id
    ).first()
    
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slot not found or you don't have permission to delete it"
        )
        
    db.delete(slot)
    db.commit()
    return {"detail": "Slot deleted successfully"}
