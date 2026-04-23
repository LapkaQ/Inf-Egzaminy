from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class ContactMessageCreate(BaseModel):
    """Public contact form submission."""
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    subject: str = Field(min_length=3, max_length=500)
    message: str = Field(min_length=10, max_length=5000)


class ContactMessageResponse(BaseModel):
    """Response after submitting a contact message."""
    message: str


class ContactMessageItem(BaseModel):
    """Admin view of a contact message."""
    id: int
    name: str
    email: str
    subject: str
    message: str
    status: str
    admin_reply: Optional[str] = None
    replied_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ContactMessageReply(BaseModel):
    """Admin reply to a contact message."""
    reply_message: str = Field(min_length=1, max_length=5000)


class ContactMessageReplyResponse(BaseModel):
    message: str
