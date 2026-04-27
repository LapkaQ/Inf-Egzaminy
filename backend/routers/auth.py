from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from models.user import User
from schemas.user import (
    UserCreate,
    UserResponse,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ResendVerificationRequest,
    MessageResponse,
)
from db.base import get_db
from core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from core.config import settings
from services.mail_service import (
    send_registration_email,
    send_forgot_password_email,
    send_password_changed_email,
    send_welcome_verified_email,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


def _create_verification_token(user_id: int) -> str:
    """Create a JWT token for email verification (valid 24h)."""
    return create_access_token(
        data={"user_id": str(user_id), "purpose": "verify_email"},
        expires_delta=timedelta(hours=settings.TOKEN_EXPIRATION_DATE_HOURS),
    )


def _create_reset_token(user_id: int) -> str:
    """Create a JWT token for password reset (valid 1h)."""
    return create_access_token(
        data={"user_id": str(user_id), "purpose": "reset_password"},
        expires_delta=timedelta(hours=1),
    )


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=UserResponse,
    description="Register a new user",
)
async def register(
    user: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    hashed_password = get_password_hash(user.password)
    # Always force role to student — admin/tutor roles are assigned by admins only
    new_user = User(
        email=user.email,
        password=hashed_password,
        name=user.name,
        role="student",
        is_verified=False,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send verification email in background
    token = _create_verification_token(new_user.id)
    confirmation_link = f"{settings.FRONTEND_APP_URL}/verify-email?token={token}"
    background_tasks.add_task(
        send_registration_email, new_user.email, new_user.name, confirmation_link
    )

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
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password."
        )

    if not verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password."
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Check your inbox or resend verification email.",
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


@router.post(
    "/verify-email",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
    description="Verify email address using token from registration email",
)
async def verify_email(
    token: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    import jwt

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("user_id")
        purpose = payload.get("purpose")
        if user_id is None or purpose != "verify_email":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nieprawidłowy token weryfikacji.",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token weryfikacji wygasł. Poproś o ponowne wysłanie.",
        )
    except (jwt.PyJWTError, Exception):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nieprawidłowy token weryfikacji.",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Użytkownik nie znaleziony.",
        )

    if user.is_verified:
        return {"message": "Email został już wcześniej potwierdzony. Możesz się zalogować."}

    user.is_verified = True
    db.commit()

    # Send welcome email
    background_tasks.add_task(send_welcome_verified_email, user.email, user.name)

    return {"message": "Email potwierdzony pomyślnie! Możesz się teraz zalogować."}


@router.post(
    "/resend-verification",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
    description="Resend verification email",
)
async def resend_verification(
    body: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == body.email).first()
    # Always return success (don't reveal if email exists)
    if not user or user.is_verified:
        return {"message": "Jeśli konto istnieje i nie jest jeszcze zweryfikowane, email został wysłany."}

    token = _create_verification_token(user.id)
    confirmation_link = f"{settings.FRONTEND_APP_URL}/verify-email?token={token}"
    background_tasks.add_task(
        send_registration_email, user.email, user.name, confirmation_link
    )

    return {"message": "Jeśli konto istnieje i nie jest jeszcze zweryfikowane, email został wysłany."}


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
    description="Request a password reset email",
)
async def forgot_password(
    body: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == body.email).first()
    # Always return success (don't reveal if email exists)
    if user:
        token = _create_reset_token(user.id)
        reset_link = f"{settings.FRONTEND_APP_URL}/reset-password?token={token}"
        background_tasks.add_task(
            send_forgot_password_email, user.email, user.name, reset_link
        )

    return {"message": "Jeśli konto o podanym adresie istnieje, email z linkiem do resetowania hasła został wysłany."}


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
    description="Reset password using token from email",
)
async def reset_password(
    body: ResetPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    import jwt

    try:
        payload = jwt.decode(
            body.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("user_id")
        purpose = payload.get("purpose")
        if user_id is None or purpose != "reset_password":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nieprawidłowy token resetowania hasła.",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token resetowania hasła wygasł. Spróbuj ponownie.",
        )
    except (jwt.PyJWTError, Exception):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nieprawidłowy token resetowania hasła.",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Użytkownik nie znaleziony.",
        )

    user.password = get_password_hash(body.new_password)
    # Also verify email if it wasn't verified yet
    user.is_verified = True
    db.commit()

    # Send password changed notification
    background_tasks.add_task(send_password_changed_email, user.email, user.name)

    return {"message": "Hasło zostało zmienione pomyślnie. Możesz się teraz zalogować."}
