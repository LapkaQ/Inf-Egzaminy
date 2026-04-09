from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.user import User, UserRole
from models.tutor import TutorProfile
from models.session import Session as SessionModel, SessionStatus
from db.base import get_db

router = APIRouter(prefix="/stats", tags=["Stats"])


# zwraca ilosc aktywnych uczniow, procent zdawalnosci egzaminow, ilosc korepetytorow, srednia ocen
@router.get("/")
def get_stats(db: Session = Depends(get_db)):
    # Liczba aktywnych uczniów
    active_students = db.query(User).filter(User.role == UserRole.student).count()

    # Liczba korepetytorów
    tutors_count = db.query(User).filter(User.role == UserRole.tutor).count()

    # Procent zdawalności sesji (completed / wszystkie)
    total_sessions = db.query(SessionModel).count()
    completed_sessions = (
        db.query(SessionModel)
        .filter(SessionModel.status == SessionStatus.completed)
        .count()
    )
    pass_rate = round((completed_sessions / total_sessions) * 100, 1) if total_sessions > 0 else 0.0

    # Średnia ocen korepetytorów
    avg_rating = db.query(func.avg(TutorProfile.rating_avg)).scalar()
    avg_rating = round(float(avg_rating), 2) if avg_rating is not None else 0.0

    return {
        "active_students": active_students,
        "tutors_count": tutors_count,
        "pass_rate_percent": pass_rate,
        "avg_tutor_rating": avg_rating,
    }
