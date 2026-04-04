from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from core.security import get_current_user
from db.base import get_db
from models.user import User

from schemas.booking import SessionResponse
from services.session_service import get_my_sessions

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.get("/me", response_model=List[SessionResponse], status_code=status.HTTP_200_OK)
def get_my_sessions_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Zwraca same wygenerowane sesje (w tym linki wideo) powiązane z lekcjami użytkownika.
    """
    return get_my_sessions(db, current_user)
