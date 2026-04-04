from pydantic import BaseModel, Field, model_validator, field_validator
from datetime import datetime, timezone
from typing import List, Optional


class AvailabilitySlotBase(BaseModel):
    start_time: datetime
    end_time: datetime

    @field_validator('start_time', 'end_time', mode='after')
    @classmethod
    def ensure_utc(cls, value: datetime) -> datetime:
        """Konwertuje wejściowy datetime na strefę UTC (jeśli podano inną) i robi go naiwnym."""
        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)
        return value

    @model_validator(mode='after')
    def check_time_order(self):
        if self.start_time >= self.end_time:
            raise ValueError("end_time must be after start_time")
        return self


class AvailabilitySlotCreate(AvailabilitySlotBase):
    pass


class AvailabilitySlotResponse(AvailabilitySlotBase):
    id: int
    tutor_id: int

    class Config:
        from_attributes = True
