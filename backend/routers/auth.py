from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

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

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=UserResponse,
    description="Register a new user",
)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    hashed_password = get_password_hash(user.password)
    # Always force role to student — admin/tutor roles are assigned by admins only
    new_user = User(
        email=user.email, password=hashed_password, name=user.name, role="student"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
    response_model=Token,
    description="Login to get access token",
)
async def login(
    user_credentials: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == user_credentials.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    if not verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"user_id": str(user.id)}, expires_delta=access_token_expires
    )

    return {"access_token": token, "token_type": "bearer"}


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
    response_model=UserResponse,
    description="Get current authenticated user information",
)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
