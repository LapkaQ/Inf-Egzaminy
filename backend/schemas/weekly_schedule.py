from pydantic import BaseModel, field_validator, model_validator
from typing import List
from datetime import time


class TimeSlot(BaseModel):
    """Single time range within a day, e.g. 14:00 – 18:00"""
    start_time: time
    end_time: time

    @model_validator(mode='after')
    def check_order(self):
        if self.start_time >= self.end_time:
            raise ValueError("end_time must be after start_time")
        return self


class DaySchedule(BaseModel):
    """Schedule for a single day of the week"""
    day_of_week: int  # 0=Mon .. 6=Sun
    slots: List[TimeSlot]

    @field_validator('day_of_week')
    @classmethod
    def validate_day(cls, v):
        if v < 0 or v > 6:
            raise ValueError("day_of_week must be 0-6 (Mon-Sun)")
        return v


class WeeklyScheduleSet(BaseModel):
    """
    Full weekly schedule sent by tutor.
    Contains list of day schedules.
    Replaces existing weekly schedule entirely (PUT semantics).
    """
    days: List[DaySchedule]

    @field_validator('days')
    @classmethod
    def validate_unique_days(cls, v):
        seen = set()
        for d in v:
            if d.day_of_week in seen:
                raise ValueError(f"Duplicate day_of_week: {d.day_of_week}")
            seen.add(d.day_of_week)
        return v


class TimeSlotResponse(BaseModel):
    start_time: time
    end_time: time

    class Config:
        from_attributes = True


class DayScheduleResponse(BaseModel):
    day_of_week: int
    slots: List[TimeSlotResponse]


class WeeklyScheduleResponse(BaseModel):
    """Returned to frontend: grouped by day"""
    days: List[DayScheduleResponse]
