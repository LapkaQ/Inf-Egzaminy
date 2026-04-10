from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

from models.booking import BookingStatus
from models.session import SessionStatus


class AdminSessionInfo(BaseModel):
    id: int
    meeting_url: str
    status: SessionStatus

    class Config:
        from_attributes = True


class AdminBookingItem(BaseModel):
    id: int
    student_id: int
    tutor_id: int
    student_name: str
    tutor_name: str
    start_time: datetime
    end_time: datetime
    status: BookingStatus
    session: Optional[AdminSessionInfo] = None


class AdminBookingUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[BookingStatus] = None


class AdminSessionUpdate(BaseModel):
    meeting_url: Optional[str] = Field(None, min_length=8, max_length=500)
    status: Optional[SessionStatus] = None


class AdminUserItem(BaseModel):
    id: int
    email: str
    name: str
    role: str
    created_at: datetime
    tutor_profile_id: Optional[int] = None


class AdminUserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None


class AdminOverview(BaseModel):
    active_students: int
    tutors_count: int
    pass_rate_percent: float
    avg_tutor_rating: float
    bookings_total: int
    bookings_active: int
    sessions_scheduled: int


class AdminSessionMutationResponse(BaseModel):
    id: int
    booking_id: int
    meeting_url: str
    status: SessionStatus

    class Config:
        from_attributes = True
