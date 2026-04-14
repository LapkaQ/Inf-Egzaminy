import uuid
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import Optional, List

from models.user import User, UserRole
from models.booking import Booking, BookingStatus
from models.session import Session as MeetingSession, SessionStatus
from models.tutor import TutorProfile, TutorSubject
from schemas.admin import (
    AdminBookingItem,
    AdminBookingUpdate,
    AdminSessionInfo,
    AdminSessionUpdate,
    AdminUserItem,
    AdminUserUpdate,
    AdminOverview,
)
from schemas.tutor import TutorProfileUpdate


def get_overview(db: Session) -> AdminOverview:
    active_students = db.query(User).filter(User.role == UserRole.student).count()
    tutors_count = db.query(User).filter(User.role == UserRole.tutor).count()

    total_sessions = db.query(MeetingSession).count()
    completed_sessions = (
        db.query(MeetingSession)
        .filter(MeetingSession.status == SessionStatus.completed)
        .count()
    )
    pass_rate = (
        round((completed_sessions / total_sessions) * 100, 1) if total_sessions > 0 else 0.0
    )

    avg_rating = db.query(func.avg(TutorProfile.rating_avg)).scalar()
    avg_rating = round(float(avg_rating), 2) if avg_rating is not None else 0.0

    bookings_total = db.query(Booking).count()
    bookings_active = (
        db.query(Booking).filter(Booking.status != BookingStatus.cancelled).count()
    )
    sessions_scheduled = (
        db.query(MeetingSession)
        .filter(MeetingSession.status == SessionStatus.scheduled)
        .count()
    )

    return AdminOverview(
        active_students=active_students,
        tutors_count=tutors_count,
        pass_rate_percent=pass_rate,
        avg_tutor_rating=avg_rating,
        bookings_total=bookings_total,
        bookings_active=bookings_active,
        sessions_scheduled=sessions_scheduled,
    )


def _booking_to_admin_item(booking: Booking) -> AdminBookingItem:
    student = booking.student
    tutor = booking.tutor
    sess = booking.session
    session_info = None
    if sess:
        session_info = AdminSessionInfo(
            id=sess.id,
            meeting_url=sess.meeting_url,
            status=sess.status,
        )
    return AdminBookingItem(
        id=booking.id,
        student_id=booking.student_id,
        tutor_id=booking.tutor_id,
        student_name=student.name if student else "?",
        tutor_name=tutor.name if tutor else "?",
        start_time=booking.start_time,
        end_time=booking.end_time,
        status=booking.status,
        session=session_info,
    )


def list_bookings(
    db: Session, status_filter: Optional[BookingStatus] = None
) -> List[AdminBookingItem]:
    q = (
        db.query(Booking)
        .options(
            joinedload(Booking.student),
            joinedload(Booking.tutor),
            joinedload(Booking.session),
        )
        .order_by(Booking.start_time.desc())
    )
    if status_filter is not None:
        q = q.filter(Booking.status == status_filter)
    rows = q.all()
    return [_booking_to_admin_item(b) for b in rows]


def _check_tutor_overlap(
    db: Session,
    tutor_id: int,
    exclude_booking_id: int,
    start,
    end,
):
    overlap = (
        db.query(Booking)
        .filter(
            Booking.tutor_id == tutor_id,
            Booking.id != exclude_booking_id,
            Booking.status != BookingStatus.cancelled,
            Booking.start_time < end,
            Booking.end_time > start,
        )
        .first()
    )
    if overlap:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nowy termin koliduje z inną rezerwacją tego korepetytora.",
        )


def update_booking(
    db: Session, booking_id: int, data: AdminBookingUpdate
) -> AdminBookingItem:
    booking = (
        db.query(Booking)
        .options(
            joinedload(Booking.student),
            joinedload(Booking.tutor),
            joinedload(Booking.session),
        )
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rezerwacja nie znaleziona")

    payload = data.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Podaj przynajmniej jedno pole do aktualizacji",
        )

    new_start = data.start_time if data.start_time is not None else booking.start_time
    new_end = data.end_time if data.end_time is not None else booking.end_time
    if new_start >= new_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Czas zakończenia musi być późniejszy niż początek",
        )

    new_status = data.status if data.status is not None else booking.status

    # Anulowanie — usuń sesję (jak w cancel_booking)
    if new_status == BookingStatus.cancelled and booking.status != BookingStatus.cancelled:
        booking.status = BookingStatus.cancelled
        if booking.session:
            db.delete(booking.session)
        db.commit()
        db.refresh(booking)
        booking = (
            db.query(Booking)
            .options(
                joinedload(Booking.student),
                joinedload(Booking.tutor),
                joinedload(Booking.session),
            )
            .filter(Booking.id == booking_id)
            .first()
        )
        return _booking_to_admin_item(booking)

    # Ponowna aktywacja po anulowaniu
    if booking.status == BookingStatus.cancelled and new_status != BookingStatus.cancelled:
        booking.status = new_status
        if not booking.session:
            fake_hash = str(uuid.uuid4())[:8]
            url = f"https://korki-app.com/meet/{booking.id}-{fake_hash}"
            db.add(
                MeetingSession(
                    booking_id=booking.id,
                    meeting_url=url,
                    status=SessionStatus.scheduled,
                )
            )
    else:
        if data.status is not None:
            booking.status = data.status

    # Zmiana terminu — tylko dla nieanulowanych
    if booking.status != BookingStatus.cancelled:
        if data.start_time is not None or data.end_time is not None:
            _check_tutor_overlap(db, booking.tutor_id, booking.id, new_start, new_end)
            booking.start_time = new_start
            booking.end_time = new_end

    db.commit()
    db.refresh(booking)
    booking = (
        db.query(Booking)
        .options(
            joinedload(Booking.student),
            joinedload(Booking.tutor),
            joinedload(Booking.session),
        )
        .filter(Booking.id == booking_id)
        .first()
    )
    return _booking_to_admin_item(booking)


def update_session(db: Session, session_id: int, data: AdminSessionUpdate) -> MeetingSession:
    sess = db.query(MeetingSession).filter(MeetingSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesja nie znaleziona")

    payload = data.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Podaj przynajmniej jedno pole",
        )

    booking = db.query(Booking).filter(Booking.id == sess.booking_id).first()
    if booking and booking.status == BookingStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nie można edytować sesji dla anulowanej rezerwacji",
        )

    if data.meeting_url is not None:
        sess.meeting_url = data.meeting_url
    if data.status is not None:
        sess.status = data.status

    db.commit()
    db.refresh(sess)
    return sess


def list_users(db: Session, role: Optional[UserRole] = None) -> List[AdminUserItem]:
    q = db.query(User).options(joinedload(User.tutor_profile)).order_by(User.id)
    if role is not None:
        q = q.filter(User.role == role)
    users = q.all()
    out: List[AdminUserItem] = []
    for u in users:
        tid = u.tutor_profile.id if u.tutor_profile else None
        out.append(
            AdminUserItem(
                id=u.id,
                email=u.email,
                name=u.name,
                role=u.role.value if hasattr(u.role, "value") else str(u.role),
                is_verified=u.is_verified,
                created_at=u.created_at,
                tutor_profile_id=tid,
            )
        )
    return out


def update_user(db: Session, user_id: int, data: AdminUserUpdate) -> AdminUserItem:
    user = (
        db.query(User)
        .options(joinedload(User.tutor_profile))
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie znaleziony")

    payload = data.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Podaj przynajmniej jedno pole",
        )

    if data.email is not None:
        other = db.query(User).filter(User.email == str(data.email), User.id != user_id).first()
        if other:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ten adres e-mail jest już zajęty",
            )
        user.email = str(data.email)
    if data.name is not None:
        user.name = data.name

    db.commit()
    db.refresh(user)
    tid = user.tutor_profile.id if user.tutor_profile else None
    return AdminUserItem(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        is_verified=user.is_verified,
        created_at=user.created_at,
        tutor_profile_id=tid,
    )


def admin_update_tutor_profile(
    db: Session, target_user_id: int, profile_data: TutorProfileUpdate
) -> TutorProfile:
    user = db.query(User).filter(User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie znaleziony")
    if user.role != UserRole.tutor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wskazany użytkownik nie jest korepetytorem",
        )

    tutor_profile = (
        db.query(TutorProfile).filter(TutorProfile.user_id == target_user_id).first()
    )
    if tutor_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil korepetytora nie istnieje",
        )

    update_data = profile_data.model_dump(exclude_unset=True)

    if "subjects" in update_data:
        new_subjects = []
        for subject_name in update_data["subjects"]:
            subj = TutorSubject(name=subject_name.value)
            new_subjects.append(subj)
        tutor_profile.subjects = new_subjects
        del update_data["subjects"]

    for key, value in update_data.items():
        setattr(tutor_profile, key, value)

    db.commit()
    db.refresh(tutor_profile)
    return tutor_profile
