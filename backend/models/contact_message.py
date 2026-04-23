from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum
from db.base import Base
from datetime import datetime
import enum


class MessageStatus(enum.Enum):
    new = "new"
    read = "read"
    replied = "replied"


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    subject = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(Enum(MessageStatus), default=MessageStatus.new, nullable=False)
    admin_reply = Column(Text, nullable=True)
    replied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
