from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from models.user import User
from schemas.weekly_schedule import WeeklyScheduleSet, WeeklyScheduleResponse
from db.base import get_db
from core.security import get_current_user
from services.weekly_schedule_service import (
    set_weekly_schedule,
    get_weekly_schedule,
    get_weekly_schedule_public,
    regenerate_slots_for_tutor,
)

router = APIRouter(prefix="/schedule", tags=["Weekly Schedule"])


@router.put("/weekly", response_model=WeeklyScheduleResponse, status_code=status.HTTP_200_OK)
def set_weekly_schedule_endpoint(
    schedule_data: WeeklyScheduleSet,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ustaw tygodniowy harmonogram dostępności korepetytora.
    Zastępuje cały istniejący harmonogram i automatycznie generuje
    konkretne sloty na najbliższe 4 tygodnie.
    """
    return set_weekly_schedule(db, current_user, schedule_data)


@router.get("/weekly", response_model=WeeklyScheduleResponse, status_code=status.HTTP_200_OK)
def get_my_weekly_schedule_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Pobierz swój tygodniowy harmonogram."""
    return get_weekly_schedule(db, current_user)


@router.get("/weekly/{tutor_profile_id}", response_model=WeeklyScheduleResponse, status_code=status.HTTP_200_OK)
def get_tutor_weekly_schedule_endpoint(
    tutor_profile_id: int,
    db: Session = Depends(get_db),
):
    """Publiczny endpoint — zobacz harmonogram konkretnego korepetytora."""
    return get_weekly_schedule_public(db, tutor_profile_id)


@router.post("/regenerate", status_code=status.HTTP_200_OK)
def regenerate_slots_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ręcznie odśwież sloty (np. żeby wygenerować dalej w przyszłość)."""
    return regenerate_slots_for_tutor(db, current_user)
