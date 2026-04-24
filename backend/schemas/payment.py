from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.payment import PaymentStatus


class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    amount: int
    status: PaymentStatus
    payment_method: str
    transaction_id: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaymentInitiateResponse(BaseModel):
    payment_id: int
    booking_id: int
    amount: int
    payment_url: str  # URL do strony płatności (emulacja lub HotPay)
    requires_immediate_payment: bool  # True jeśli lekcja < 24h


class PaymentStatusResponse(BaseModel):
    booking_id: int
    payment_status: PaymentStatus
    amount: int
    paid_at: Optional[datetime] = None
