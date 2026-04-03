from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from services.user_service import add_tutor

from models.user import User
from schemas.user import UserCreate, UserResponse, Token
from db.base import get_db
from core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from core.config import settings

router = APIRouter(prefix="/tutors", tags=["Tutors"])


@router.post("/add", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def add_tutor_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return add_tutor(user_id, db, current_user)
