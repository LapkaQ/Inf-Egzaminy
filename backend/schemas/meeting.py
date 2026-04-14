from pydantic import BaseModel
from typing import Optional


class MeetingResponse(BaseModel):
    """Odpowiedź z danymi spotkania (GET)."""
    id: int
    booking_id: int
    meeting_url: str
    zoom_meeting_id: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class MeetingCreateResponse(BaseModel):
    """Odpowiedź po utworzeniu spotkania Zoom (POST)."""
    id: int
    booking_id: int
    meeting_url: str
    zoom_meeting_id: str
    password: str

    class Config:
        from_attributes = True
