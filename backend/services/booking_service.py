from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from fastapi import HTTPException, status
import uuid
import logging
from models.booking import Booking, BookingStatus
from models.availability import AvailabilitySlot
from models.user import User, UserRole
from models.tutor import TutorProfile
from models.session import Session as MeetingSession, SessionStatus
from schemas.booking import BookingCreate
from services.meeting_service import create_zoom_meeting, delete_zoom_meeting
from core.config import settings

logger = logging.getLogger(__name__)


def _zoom_is_configured() -> bool:
    """Sprawdza czy dane Zoom API zostały podane w .env"""
    return bool(settings.ZOOM_ACCOUNT_ID and settings.ZOOM_CLIENT_ID and settings.ZOOM_CLIENT_SECRET)


def create_booking(db: Session, current_user: User, booking_data: BookingCreate) -> Booking:
    # Lock the availability slot for this transaction!
    # SELECT ... FOR UPDATE chroni przed sytuacją gdy 2 użytkowników klika w tym samym ułamku sekundy
    slot = db.query(AvailabilitySlot).filter(AvailabilitySlot.id == booking_data.availability_slot_id).with_for_update().first()
    
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot does not exist")
        
    tutor_profile = db.query(TutorProfile).filter(TutorProfile.id == slot.tutor_id).first()
    if not tutor_profile:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor profile not found")
         
    # Check if a booking already exactly overlaps this specific time for this tutor
    # If the first guy commits, the second guy (waiting for the lock) will unfreeze, execute this query, see the first guy's booking, and hit 400!
    overlap = db.query(Booking).filter(
        Booking.tutor_id == tutor_profile.user_id,
        Booking.status != BookingStatus.cancelled,
        Booking.start_time < slot.end_time,
        Booking.end_time > slot.start_time
    ).first()
    
    if overlap:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Slot is already booked. Somebody secured it right before you!"
        )
        
    new_booking = Booking(
        student_id=current_user.id,
        tutor_id=tutor_profile.user_id,
        start_time=slot.start_time,
        end_time=slot.end_time,
        status=BookingStatus.confirmed
    )
    db.add(new_booking)
    db.flush() # pobieramy new_booking.id zanim zrobimy pełen commit

    # ── Generowanie linku spotkania ──
    meeting_url = ""
    zoom_meeting_id = None

    if _zoom_is_configured():
        try:
            duration = int((slot.end_time - slot.start_time).total_seconds() / 60)
            topic = f"Korepetycje – lekcja #{new_booking.id}"

            zoom_data = create_zoom_meeting(
                topic=topic,
                start_time=slot.start_time,
                duration_minutes=duration,
            )
            meeting_url = zoom_data["join_url"]
            zoom_meeting_id = zoom_data["meeting_id"]
            logger.info("Zoom meeting created for booking %s: %s", new_booking.id, meeting_url)
        except Exception as e:
            logger.error("Zoom meeting creation failed for booking %s: %s", new_booking.id, e)
            # Fallback do linku zastępczego gdy Zoom API nie odpowiada
            fake_hash = str(uuid.uuid4())[:8]
            meeting_url = f"https://korki-app.com/meet/{new_booking.id}-{fake_hash}"
    else:
        # Brak konfiguracji Zoom – generujemy placeholder
        fake_hash = str(uuid.uuid4())[:8]
        meeting_url = f"https://korki-app.com/meet/{new_booking.id}-{fake_hash}"

    new_session = MeetingSession(
        booking_id=new_booking.id,
        meeting_url=meeting_url,
        zoom_meeting_id=zoom_meeting_id,
        status=SessionStatus.scheduled
    )
    db.add(new_session)
    
    db.commit()
    db.refresh(new_booking)
    return new_booking


def get_my_bookings(db: Session, current_user: User):
    """Pobiera rezerwacje zalogowanego użytkownika (zarówno jako uczeń i jako nauczyciel)"""
    return db.query(Booking).options(
        joinedload(Booking.session)
    ).filter(
        or_(
            Booking.student_id == current_user.id,
            Booking.tutor_id == current_user.id
        )
    ).order_by(Booking.start_time).all()


def cancel_booking(db: Session, current_user: User, booking_id: int):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rezerwacja nie odnaleziona")
        
    # Autoryzacja - tylko uczeń, nauczyciel, z którym jest lekcja lub admin mogą to zrobić
    if current_user.id not in [booking.student_id, booking.tutor_id] and current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do anulowania tej lekcji")
        
    if booking.status == BookingStatus.cancelled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rezerwacja została już anulowana wcześniej")
        
    booking.status = BookingStatus.cancelled
    
    # Skoro odwołane, nikt tam nie wejdzie. Zwalniamy model sesji by link nie był aktywny na darmo.
    if booking.session:
        # Jeśli to był prawdziwy Zoom meeting, usuwamy go
        if booking.session.zoom_meeting_id:
            delete_zoom_meeting(booking.session.zoom_meeting_id)
        db.delete(booking.session)
        
    db.commit()
    db.refresh(booking)
    return booking
