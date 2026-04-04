from sqlalchemy.orm import Session
from models.user import User, UserRole
from models.tutor import TutorProfile, TutorSubject
from fastapi import HTTPException, status
from schemas.tutor import TutorProfileCreate, TutorProfileUpdate


def add_tutor(user_id: int, db: Session, current_user: User):
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to perform this action",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user.role = UserRole.tutor
    db.commit()
    db.refresh(user)
    return user


def remove_tutor(user_id: int, db: Session, current_user: User):
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to perform this action",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user.role = UserRole.student
    db.commit()
    db.refresh(user)
    return user


def get_all_tutors(db: Session):
    return db.query(User).filter(User.role == UserRole.tutor).all()


def get_tutor_by_id(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutor not found", # User not found
        )
    if user.role != UserRole.tutor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tutor not found", # User is not a tutor
        )   
    return user.tutor_profile


def create_tutor_profile(
    db: Session, current_user: User, profile_data: TutorProfileCreate
):
    if current_user.role != UserRole.tutor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to perform this action",
        )
    user = db.query(User).filter(User.id == current_user.id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    tutor_profile = (
        db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    )
    if tutor_profile is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tutor profile already exists",
        )
    subject_models = []
    for subject_name in profile_data.subjects:
        subj = TutorSubject(name=subject_name.value)
        subject_models.append(subj)

    profile_dict = profile_data.model_dump(exclude={"subjects"})
    tutor_profile = TutorProfile(
        user_id=user.id, **profile_dict, subjects=subject_models
    )

    db.add(tutor_profile)
    db.commit()
    db.refresh(tutor_profile)
    return tutor_profile


def update_tutor_profile(
    db: Session, current_user: User, profile_data: TutorProfileUpdate
):
    if current_user.role != UserRole.tutor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to perform this action",
        )

    tutor_profile = (
        db.query(TutorProfile).filter(TutorProfile.user_id == current_user.id).first()
    )
    if tutor_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutor profile not found",
        )

    # extract only explicitly provided fields
    update_data = profile_data.model_dump(exclude_unset=True)

    if "subjects" in update_data:
        new_subjects = []
        for subject_name in update_data["subjects"]:
            subj = TutorSubject(name=subject_name.value)
            new_subjects.append(subj)

        # overriding the relation list drops old orphans automatically in sqlalchemy
        tutor_profile.subjects = new_subjects
        del update_data["subjects"]

    for key, value in update_data.items():
        setattr(tutor_profile, key, value)

    db.commit()
    db.refresh(tutor_profile)
    return tutor_profile
