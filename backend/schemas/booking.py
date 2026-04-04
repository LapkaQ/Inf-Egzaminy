from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.booking import BookingStatus

class BookingCreate(BaseModel):
    availability_slot_id: int

class SessionResponse(BaseModel):
    id: int
    meeting_url: str

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
    
    class Config:
        from_attributes = True
