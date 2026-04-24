from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from core.security import get_current_user
from db.base import get_db
from models.user import User

from schemas.payment import PaymentResponse, PaymentInitiateResponse, PaymentStatusResponse
from services.payment_service import (
    initiate_payment,
    emulate_payment,
    get_payment_status,
    get_my_payments,
    hotpay_callback,
)
from typing import List

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/{booking_id}/initiate", response_model=PaymentInitiateResponse, status_code=status.HTTP_200_OK)
def initiate_payment_endpoint(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Inicjuje płatność za rezerwację.
    Zwraca URL do strony płatności (emulacja lub HotPay w przyszłości).
    """
    return initiate_payment(db, booking_id, current_user.id)


@router.post("/{booking_id}/emulate-pay", response_model=PaymentResponse, status_code=status.HTTP_200_OK)
def emulate_payment_endpoint(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Emulacja płatności — jedno kliknięcie, symuluje udaną płatność.
    W przyszłości ten endpoint zostanie wyłączony, a płatności będą obsługiwane przez callback HotPay.
    """
    return emulate_payment(db, booking_id, current_user.id)


@router.get("/{booking_id}/status", response_model=PaymentStatusResponse, status_code=status.HTTP_200_OK)
def get_payment_status_endpoint(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Sprawdza status płatności za daną rezerwację.
    """
    return get_payment_status(db, booking_id, current_user.id)


@router.get("/me", response_model=List[PaymentResponse], status_code=status.HTTP_200_OK)
def get_my_payments_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Zwraca wszystkie płatności aktualnie zalogowanego użytkownika.
    """
    return get_my_payments(db, current_user.id)


@router.post("/hotpay/callback", status_code=status.HTTP_200_OK)
async def hotpay_callback_endpoint(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Webhook dla HotPay — w przyszłości odbiera powiadomienia o płatnościach.
    Na razie placeholder.
    """
    data = await request.json()
    return hotpay_callback(db, data)
