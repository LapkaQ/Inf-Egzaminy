from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from db.base import Base
import enum

from datetime import datetime


class PaymentStatus(enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)

    amount = Column(Integer, nullable=False)  # kwota w PLN (grosze → Integer np. 150 = 150 zł)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    payment_method = Column(String(50), default="emulation")  # "hotpay" | "emulation"
    transaction_id = Column(String(128), nullable=True, unique=True)  # UUID w emulacji, HotPay ID w produkcji

    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    # relacje
    booking = relationship("Booking", back_populates="payment")
