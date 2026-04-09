from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db.base import Base


class TutorSubject(Base):
    __tablename__ = "tutor_subjects"

    id = Column(Integer, primary_key=True, index=True)
    tutor_profile_id = Column(Integer, ForeignKey("tutor_profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)

    # relacja zwrotna
    tutor = relationship("TutorProfile", back_populates="subjects")


class TutorProfile(Base):
    __tablename__ = "tutor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    bio = Column(String(255), nullable=True)
    price_per_hour = Column(Integer, nullable=False)
    rating_avg = Column(Integer, default=0)

    # relacje
    user = relationship("User", back_populates="tutor_profile")
    availability_slots = relationship("AvailabilitySlot", back_populates="tutor")
    subjects = relationship("TutorSubject", back_populates="tutor", cascade="all, delete-orphan")
    weekly_schedules = relationship("WeeklySchedule", back_populates="tutor", cascade="all, delete-orphan")
