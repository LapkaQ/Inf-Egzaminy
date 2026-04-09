from sqlalchemy import Column, Integer, String, Time, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from db.base import Base


class WeeklySchedule(Base):
    """
    Represents a tutor's recurring weekly availability pattern.
    E.g. "Every Monday from 14:00 to 18:00"
    day_of_week: 0=Monday, 1=Tuesday, ..., 6=Sunday
    """
    __tablename__ = "weekly_schedules"

    id = Column(Integer, primary_key=True, index=True)
    tutor_id = Column(Integer, ForeignKey("tutor_profiles.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Mon .. 6=Sun
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    tutor = relationship("TutorProfile", back_populates="weekly_schedules")

    __table_args__ = (
        UniqueConstraint('tutor_id', 'day_of_week', 'start_time', 'end_time', name='uq_weekly_slot'),
    )
