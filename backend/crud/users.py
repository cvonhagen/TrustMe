# CRUD operations for users
# Placeholder for later implementation 

from sqlalchemy.orm import Session
from ..models import User
from ..schemas.user import UserCreate
from ..core.security import hash_password
import os
import base64

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, user: UserCreate):
    salt = os.urandom(16) # 16 bytes salt for Argon2
    hashed_password = hash_password(user.master_password + base64.b64encode(salt).decode('utf-8'))
    db_user = User(
        username=user.username,
        hashed_master_password=hashed_password,
        salt=base64.b64encode(salt).decode('utf-8')
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Weitere CRUD-Operationen (get_user, update_user, delete_user) können hier hinzugefügt werden. 