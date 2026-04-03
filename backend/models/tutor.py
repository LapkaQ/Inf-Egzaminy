from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from db.base import Base
import enum


class TutorProfile(Base):
    __tablename__ = "tutor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    bio = Column(String(255), nullable=True)
    price_per_hour = Column(Integer, nullable=False)
    subjects = Column(String(255), nullable=False)  # np. "INF03,INF04"
    rating_avg = Column(Integer, default=0)

    # relacje
    user = relationship("User", back_populates="tutor_profile")
    availability_slots = relationship("AvailabilitySlot", back_populates="tutor")
