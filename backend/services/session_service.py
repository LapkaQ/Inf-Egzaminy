from sqlalchemy.orm import Session
from sqlalchemy import or_

from models.session import Session as MeetingSession
from models.booking import Booking
from models.user import User

def get_my_sessions(db: Session, current_user: User):
    """Pobiera sesje spotkań dla usera powiązane z rezerwacjami (zarówno dla ucznia jak i nauczyciela)."""
    return db.query(MeetingSession).join(
        Booking, MeetingSession.booking_id == Booking.id
    ).filter(
        or_(
            Booking.student_id == current_user.id,
            Booking.tutor_id == current_user.id
        )
    ).all()
