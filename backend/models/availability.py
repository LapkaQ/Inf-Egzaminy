from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from db.base import Base
import enum

from datetime import datetime


class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"

    id = Column(Integer, primary_key=True, index=True)
    tutor_id = Column(Integer, ForeignKey("tutor_profiles.id"), nullable=False)

    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    # relacje
    tutor = relationship("TutorProfile", back_populates="availability_slots")
