from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from core.security import get_current_user
from db.base import get_db
from models.user import User

from schemas.booking import BookingCreate, BookingResponse
from services.booking_service import create_booking, get_my_bookings, cancel_booking
from typing import List

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.get("/me", response_model=List[BookingResponse], status_code=status.HTTP_200_OK)
def get_my_bookings_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Zwraca listę zaplanowanych lekcji zalogowanego użytkownika (widok połączony - jako student lub jako tutor).
    """
    return get_my_bookings(db, current_user)

@router.patch("/{booking_id}/cancel", response_model=BookingResponse, status_code=status.HTTP_200_OK)
def cancel_booking_endpoint(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Anuluje wybraną rezerwację lekcji. Po wykonaniu tej czynności termin dla tego nauczyciela na nowo staje się dostępny w grafiku!
    Wymaga uprawnień do danej rezerwacji (byleś w niej wpisany).
    """
    return cancel_booking(db, current_user, booking_id)

@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking_endpoint(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tworzy rezerwację lekcji na podstawie ID wolnego slotu.
    Gwarantuje brak nakładania się dzięki mechanizmowi blokowania wierszy na poziomie bazy (with_for_update).
    """
    return create_booking(db, current_user, booking_data)
