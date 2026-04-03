from sqlalchemy.orm import Session
from models.user import User, UserRole
from fastapi import HTTPException, status


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