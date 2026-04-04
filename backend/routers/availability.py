from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from models.user import User
from schemas.availability import AvailabilitySlotCreate, AvailabilitySlotResponse
from db.base import get_db
from core.security import get_current_user
from services.availability_service import (
    add_availability_slot,
    get_tutor_availability,
    get_my_availability,
    delete_availability_slot,
    search_availability
)

router = APIRouter(prefix="/availability", tags=["Availability"])

@router.get("/search/slots", response_model=List[AvailabilitySlotResponse], status_code=status.HTTP_200_OK)
def search_availability_endpoint(
    tutor_profile_id: Optional[int] = None,
    subject: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Pozwala na wyszukiwanie wolnych terminów z opcjonalnym filtrowaniem po ID tutora oraz tagu przedmiotu.
    """
    return search_availability(db, tutor_profile_id, subject)

@router.post("/", response_model=AvailabilitySlotResponse, status_code=status.HTTP_201_CREATED)
def add_slot_endpoint(
    slot_data: AvailabilitySlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return add_availability_slot(db, current_user, slot_data)

@router.get("/me", response_model=List[AvailabilitySlotResponse], status_code=status.HTTP_200_OK)
def get_my_slots_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_my_availability(db, current_user)

@router.get("/{tutor_profile_id}", response_model=List[AvailabilitySlotResponse], status_code=status.HTTP_200_OK)
def get_tutor_slots_endpoint(
    tutor_profile_id: int,
    db: Session = Depends(get_db)
):
    return get_tutor_availability(db, tutor_profile_id)

@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_slot_endpoint(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    delete_availability_slot(db, current_user, slot_id)
    return None