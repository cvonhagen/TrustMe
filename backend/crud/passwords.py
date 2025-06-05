# CRUD operations for passwords
# Placeholder for later implementation 

from sqlalchemy.orm import Session
from ..models import Password
from ..schemas.password import PasswordCreate, PasswordBase

def get_password(db: Session, password_id: int):
    return db.query(Password).filter(Password.id == password_id).first()


def get_user_passwords(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(Password).filter(Password.user_id == user_id).offset(skip).limit(limit).all()


def create_user_password(db: Session, password: PasswordCreate, user_id: int):
    db_password = Password(**password.model_dump(), user_id=user_id)
    db.add(db_password)
    db.commit()
    db.refresh(db_password)
    return db_password


def update_password(db: Session, password_id: int, password: PasswordBase):
    db_password = db.query(Password).filter(Password.id == password_id).first()
    if db_password:
        for var, value in password.model_dump(exclude_unset=True).items():
            setattr(db_password, var, value)
        db.commit()
        db.refresh(db_password)
        return db_password
    return None


def delete_password(db: Session, password_id: int):
    db_password = db.query(Password).filter(Password.id == password_id).first()
    if db_password:
        db.delete(db_password)
        db.commit()
        return db_password
    return None 