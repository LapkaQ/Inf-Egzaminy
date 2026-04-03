from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from db.base import Base
import enum

from datetime import datetime


class SessionStatus(enum.Enum):
    scheduled = "scheduled"
    completed = "completed"


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)

    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)

    meeting_url = Column(String(255), nullable=False)

    status = Column(Enum(SessionStatus), default=SessionStatus.scheduled)

    created_at = Column(DateTime, default=datetime.utcnow)

    # relacje
    booking = relationship("Booking", back_populates="session")
