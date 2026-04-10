from typing import Optional

from fastapi import APIRouter, Depends, Query
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
