from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from services.user_service import add_tutor, remove_tutor, get_all_tutors, create_tutor_profile, update_tutor_profile, get_tutor_by_id

from models.user import User
from schemas.user import UserResponse
from schemas.tutor import TutorProfileCreate, TutorProfileUpdate, TutorProfileResponse
from db.base import get_db
from core.security import get_current_user

router = APIRouter(prefix="/tutors", tags=["Tutors"])

class TutorUserResponse(UserResponse):
    tutor_profile: Optional[TutorProfileResponse] = None

@router.post("/add", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def add_tutor_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return add_tutor(user_id, db, current_user)

@router.post("/remove", response_model=UserResponse, status_code=status.HTTP_200_OK)
def remove_tutor_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return remove_tutor(user_id, db, current_user)

@router.get("/all", response_model=list[TutorUserResponse], status_code=status.HTTP_200_OK)
def get_all_tutors_endpoint(
    db: Session = Depends(get_db)):
    return get_all_tutors(db)

@router.get("/{user_id}", response_model=TutorProfileResponse, status_code=status.HTTP_200_OK)
def get_tutor_by_id_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
):
    return get_tutor_by_id(db, user_id)

@router.post("/profile", response_model=TutorProfileResponse, status_code=status.HTTP_201_CREATED)
def create_tutor_profile_endpoint(
    profile_data: TutorProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_tutor_profile(db, current_user, profile_data)

@router.patch("/profile", response_model=TutorProfileResponse, status_code=status.HTTP_200_OK)
def update_tutor_profile_endpoint(
    profile_data: TutorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_tutor_profile(db, current_user, profile_data)