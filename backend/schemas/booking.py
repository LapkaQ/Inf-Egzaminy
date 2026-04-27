from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.booking import BookingStatus
from models.payment import PaymentStatus
from schemas.user import UserResponse

class BookingCreate(BaseModel):
    availability_slot_id: int

class SessionResponse(BaseModel):
    id: int
    meeting_url: str
    zoom_meeting_id: Optional[str] = None

    class Config:
        from_attributes = True

class PaymentBriefResponse(BaseModel):
    id: int
    amount: int
    status: PaymentStatus
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BookingResponse(BaseModel):
    id: int
    student_id: int
    tutor_id: int
    start_time: datetime
    end_time: datetime
    status: BookingStatus
    session: Optional[SessionResponse] = None
    payment: Optional[PaymentBriefResponse] = None
    requires_immediate_payment: Optional[bool] = None
    payment_url: Optional[str] = None
    tutor: Optional[UserResponse] = None
    student: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True
