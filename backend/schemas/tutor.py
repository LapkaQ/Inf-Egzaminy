from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class SubjectEnum(str, Enum):
    INF03 = "INF03"
    INF04 = "INF04"


class SubjectResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class TutorProfileBase(BaseModel):
    bio: Optional[str] = None
    price_per_hour: int = Field(gt=0)


class TutorProfileCreate(TutorProfileBase):
    subjects: List[SubjectEnum]


class TutorProfileUpdate(BaseModel):
    bio: Optional[str] = None
    price_per_hour: Optional[int] = None
    subjects: Optional[List[SubjectEnum]] = None


class TutorProfileResponse(TutorProfileBase):
    id: int
    user_id: int
    rating_avg: int
    subjects: List[SubjectResponse]

    class Config:
        from_attributes = True