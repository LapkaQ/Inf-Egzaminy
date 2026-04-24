from typing import Optional

from fastapi import APIRouter, Depends, Query, BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from db.base import get_db
from core.security import get_current_admin
from models.user import User
from models.contact_message import ContactMessage, MessageStatus
from schemas.contact import (
    ContactMessageCreate,
    ContactMessageResponse,
    ContactMessageItem,
    ContactMessageReply,
    ContactMessageReplyResponse,
)
from services.mail_service import send_email, render_template
from core.config import settings

router = APIRouter(prefix="/contact", tags=["Contact"])


# ─── Public endpoint: submit contact form ────────────────────────────────────


@router.post("/", response_model=ContactMessageResponse)
def submit_contact_message(
    body: ContactMessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Submit a contact form message. Sends auto-confirmation email."""
    msg = ContactMessage(
        name=body.name,
        email=body.email,
        subject=body.subject,
        message=body.message,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Send auto-confirmation email to the user
    confirmation_body = render_template(
        "contact_confirmation_mail.html",
        {
            "name": body.name,
            "subject": body.subject,
            "app_name": settings.APP_NAME,
        },
    )
    background_tasks.add_task(
        send_email,
        body.email,
        f"Otrzymaliśmy Twoją wiadomość – {settings.APP_NAME}",
        confirmation_body,
    )

    return ContactMessageResponse(
        message="Wiadomość została wysłana. Potwierdzenie zostało wysłane na podany adres e-mail."
    )


# ─── Admin endpoints ─────────────────────────────────────────────────────────


@router.get("/messages", response_model=list[ContactMessageItem])
def admin_list_messages(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """List all contact messages (admin only)."""
    q = db.query(ContactMessage)
    if status_filter:
        try:
            s = MessageStatus(status_filter)
            q = q.filter(ContactMessage.status == s)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nieprawidłowy status: {status_filter}. Dozwolone: new, read, replied.",
            )
    return q.order_by(ContactMessage.created_at.desc()).all()


@router.patch("/messages/{message_id}/read", response_model=ContactMessageItem)
def admin_mark_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Mark a contact message as read (admin only)."""
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wiadomość nie znaleziona.",
        )
    if msg.status == MessageStatus.new:
        msg.status = MessageStatus.read
        db.commit()
        db.refresh(msg)
    return msg


@router.post("/messages/{message_id}/reply", response_model=ContactMessageReplyResponse)
def admin_reply_to_message(
    message_id: int,
    body: ContactMessageReply,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Reply to a contact message by email (admin only)."""
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wiadomość nie znaleziona.",
        )

    # Update message status
    msg.status = MessageStatus.replied
    msg.admin_reply = body.reply_message
    msg.replied_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)

    # Send reply email
    reply_body = render_template(
        "contact_reply_mail.html",
        {
            "name": msg.name,
            "original_subject": msg.subject,
            "original_message": msg.message,
            "reply": body.reply_message,
            "app_name": settings.APP_NAME,
        },
    )
    background_tasks.add_task(
        send_email,
        msg.email,
        f"Re: {msg.subject} – {settings.APP_NAME}",
        reply_body,
    )

    return ContactMessageReplyResponse(
        message="Odpowiedź została wysłana na adres e-mail nadawcy."
    )
