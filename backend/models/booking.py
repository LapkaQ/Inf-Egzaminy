from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from db.base import Base
import enum

from datetime import datetime


class BookingStatus(enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tutor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    status = Column(Enum(BookingStatus), default=BookingStatus.pending)

    created_at = Column(DateTime, default=datetime.utcnow)

    # relacje
    student = relationship(
        "User", foreign_keys=[student_id], back_populates="bookings_as_student"
    )
    tutor = relationship(
        "User", foreign_keys=[tutor_id], back_populates="bookings_as_tutor"
    )
    session = relationship("Session", back_populates="booking", uselist=False)
