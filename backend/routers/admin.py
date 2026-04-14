from typing import Optional, List

from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session

from models.user import User, UserRole
from models.booking import BookingStatus
from db.base import get_db
from core.security import get_current_admin
from schemas.admin import (
    AdminOverview,
    AdminBookingItem,
    AdminBookingUpdate,
    AdminSessionUpdate,
    AdminSessionMutationResponse,
    AdminUserItem,
    AdminUserUpdate,
    AdminSendEmailToUser,
    AdminSendEmailToSelected,
    AdminSendEmailToAll,
    AdminEmailResponse,
)
from schemas.tutor import TutorProfileResponse, TutorProfileUpdate
from services.admin_service import (
    get_overview,
    list_bookings,
    update_booking,
    update_session,
    list_users,
    update_user,
    admin_update_tutor_profile as update_tutor_profile_by_admin,
)
from services.mail_service import send_custom_email

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/overview", response_model=AdminOverview)
def admin_overview(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return get_overview(db)


@router.get("/bookings", response_model=list[AdminBookingItem])
def admin_list_bookings(
    status_filter: Optional[BookingStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return list_bookings(db, status_filter)


@router.patch("/bookings/{booking_id}", response_model=AdminBookingItem)
def admin_update_booking(
    booking_id: int,
    body: AdminBookingUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return update_booking(db, booking_id, body)


@router.patch("/sessions/{session_id}", response_model=AdminSessionMutationResponse)
def admin_update_session(
    session_id: int,
    body: AdminSessionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return update_session(db, session_id, body)


@router.get("/users", response_model=list[AdminUserItem])
def admin_list_users(
    role: Optional[UserRole] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return list_users(db, role)


@router.patch("/users/{user_id}", response_model=AdminUserItem)
def admin_update_user(
    user_id: int,
    body: AdminUserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return update_user(db, user_id, body)


@router.patch("/tutors/user/{user_id}", response_model=TutorProfileResponse)
def admin_patch_tutor_profile(
    user_id: int,
    body: TutorProfileUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return update_tutor_profile_by_admin(db, user_id, body)


# ─── Admin email endpoints ───────────────────────────────────────────────────


@router.post("/email/user", response_model=AdminEmailResponse)
def admin_send_email_to_user(
    body: AdminSendEmailToUser,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Send an email to a single user by ID."""
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Użytkownik nie znaleziony.",
        )
    background_tasks.add_task(
        send_custom_email, user.email, body.subject, body.message, user.name
    )
    return AdminEmailResponse(message="Email zostanie wysłany.", recipients_count=1)


@router.post("/email/selected", response_model=AdminEmailResponse)
def admin_send_email_to_selected(
    body: AdminSendEmailToSelected,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Send an email to selected users by their IDs."""
    users = db.query(User).filter(User.id.in_(body.user_ids)).all()
    if not users:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nie znaleziono żadnych użytkowników.",
        )
    for user in users:
        background_tasks.add_task(
            send_custom_email, user.email, body.subject, body.message, user.name
        )
    return AdminEmailResponse(
        message=f"Email zostanie wysłany do {len(users)} użytkowników.",
        recipients_count=len(users),
    )


@router.post("/email/all", response_model=AdminEmailResponse)
def admin_send_email_to_all(
    body: AdminSendEmailToAll,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Send an email to all users, optionally filtered by role."""
    q = db.query(User)
    if body.role_filter:
        try:
            role = UserRole(body.role_filter)
            q = q.filter(User.role == role)
        except ValueError:
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nieprawidłowa rola: {body.role_filter}. Dozwolone: student, tutor, admin.",
            )
    users = q.all()
    for user in users:
        background_tasks.add_task(
            send_custom_email, user.email, body.subject, body.message, user.name
        )
    return AdminEmailResponse(
        message=f"Email zostanie wysłany do {len(users)} użytkowników.",
        recipients_count=len(users),
    )
