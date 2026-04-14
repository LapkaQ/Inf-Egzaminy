from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from db.base import Base
import enum

from datetime import datetime


class UserRole(enum.Enum):
    student = "student"
    tutor = "tutor"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.student)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    tutor_profile = relationship("TutorProfile", back_populates="user", uselist=False)
    bookings_as_student = relationship(
        "Booking", back_populates="student", foreign_keys="Booking.student_id"
    )
    bookings_as_tutor = relationship(
        "Booking", back_populates="tutor", foreign_keys="Booking.tutor_id"
    )
