"""
Router do zarządzania spotkaniami Zoom.
Umożliwia ręczne generowanie/regenerowanie linku do spotkania.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.security import get_current_user
from db.base import get_db
from models.user import User, UserRole
from models.booking import Booking, BookingStatus
from models.session import Session as MeetingSession, SessionStatus
from schemas.meeting import MeetingResponse, MeetingCreateResponse
from services.meeting_service import create_zoom_meeting, delete_zoom_meeting
from core.config import settings

router = APIRouter(prefix="/meetings", tags=["Meetings (Zoom)"])


def _require_zoom():
    """Sprawdza czy Zoom jest skonfigurowany – jeśli nie, 503."""
    if not (settings.ZOOM_ACCOUNT_ID and settings.ZOOM_CLIENT_ID and settings.ZOOM_CLIENT_SECRET):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Zoom API nie jest skonfigurowane na serwerze.",
        )


@router.post(
    "/{booking_id}",
    response_model=MeetingCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_meeting_for_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ręcznie generuje (lub regeneruje) link Zoom do istniejącej rezerwacji.
    Może być użyty gdy automatyczne generowanie nie zadziałało,
    lub gdy tutor chce odświeżyć link.
    """
    _require_zoom()

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rezerwacja nie istnieje.")

    # Autoryzacja – tylko uczeń, tutor lub admin
    if current_user.id not in [booking.student_id, booking.tutor_id] and current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień.")

    if booking.status == BookingStatus.cancelled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nie można wygenerować spotkania dla anulowanej rezerwacji.")

    # Jeśli jest stara sesja ze starym Zoom meetingiem – usuń ją
    existing_session = db.query(MeetingSession).filter(MeetingSession.booking_id == booking.id).first()
    if existing_session:
        if existing_session.zoom_meeting_id:
            delete_zoom_meeting(existing_session.zoom_meeting_id)
        db.delete(existing_session)
        db.flush()

    # Utwórz nowe spotkanie na Zoom
    duration = int((booking.end_time - booking.start_time).total_seconds() / 60)
    topic = f"Korepetycje – lekcja #{booking.id}"

    try:
        zoom_data = create_zoom_meeting(
            topic=topic,
            start_time=booking.start_time,
            duration_minutes=duration,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Zoom API zwróciło błąd: {str(e)}",
        )

    new_session = MeetingSession(
        booking_id=booking.id,
        meeting_url=zoom_data["join_url"],
        zoom_meeting_id=zoom_data["meeting_id"],
        status=SessionStatus.scheduled,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return MeetingCreateResponse(
        id=new_session.id,
        booking_id=booking.id,
        meeting_url=zoom_data["join_url"],
        zoom_meeting_id=zoom_data["meeting_id"],
        password=zoom_data["password"],
    )


@router.get(
    "/{booking_id}",
    response_model=MeetingResponse,
)
def get_meeting_for_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Pobiera informacje o spotkaniu powiązanym z daną rezerwacją.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rezerwacja nie istnieje.")

    if current_user.id not in [booking.student_id, booking.tutor_id] and current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień.")

    session = db.query(MeetingSession).filter(MeetingSession.booking_id == booking_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brak spotkania dla tej rezerwacji.")

    return MeetingResponse(
        id=session.id,
        booking_id=booking.id,
        meeting_url=session.meeting_url,
        zoom_meeting_id=session.zoom_meeting_id,
        status=session.status.value,
    )


@router.delete(
    "/{booking_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_meeting_for_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Usuwa spotkanie Zoom powiązane z rezerwacją (np. przy zmianie formy lekcji).
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rezerwacja nie istnieje.")

    if current_user.id not in [booking.student_id, booking.tutor_id] and current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień.")

    session = db.query(MeetingSession).filter(MeetingSession.booking_id == booking_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brak spotkania do usunięcia.")

    if session.zoom_meeting_id:
        delete_zoom_meeting(session.zoom_meeting_id)

    db.delete(session)
    db.commit()
    return None
