from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)


class UserCreate(UserBase):
    password: str = Field(min_length=8, description="Hasło musi mieć minimum 8 znaków")
    role: Optional[UserRole] = UserRole.student


class UserResponse(UserBase):
    id: int
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
