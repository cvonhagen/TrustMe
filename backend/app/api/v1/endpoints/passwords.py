# Endpunkte für Passwort CRUD-Operationen
# Placeholder for later implementation 

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .....crud import passwords
from .....schemas.password import Password, PasswordCreate, PasswordBase
from .....dependencies import get_current_user
from .....models import User # Import User model to type hint current_user
from .....core.database import get_db
from .....core.security import derive_key_from_password, encrypt_data, decrypt_data # Import necessary security functions
import base64

router = APIRouter()

@router.post("/passwords", response_model=Password)
def create_password_for_user(
    password: PasswordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # In a real application, the encryption/decryption should happen client-side
    # This implementation assumes the client sends encrypted data
    return passwords.create_user_password(db=db, password=password, user_id=current_user.id)

@router.get("/passwords", response_model=list[Password])
def read_user_passwords(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_passwords = passwords.get_user_passwords(db, user_id=current_user.id, skip=skip, limit=limit)
    # In a real application, decryption would happen client-side after fetching
    return db_passwords

@router.get("/passwords/{password_id}", response_model=Password)
def read_password(
    password_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_password = passwords.get_password(db, password_id=password_id)
    if db_password is None or db_password.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Password not found")
    # In a real application, decryption would happen client-side after fetching
    return db_password

@router.put("/passwords/{password_id}", response_model=Password)
def update_user_password(
    password_id: int,
    password: PasswordBase, # Use PasswordBase for update to allow partial updates
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_password = passwords.get_password(db, password_id=password_id)
    if db_password is None or db_password.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Password not found")
    
    # In a real application, the encryption should happen client-side before sending for update
    updated_password = passwords.update_password(db=db, password_id=password_id, password=password)
    if updated_password is None:
         raise HTTPException(status_code=500, detail="Failed to update password")
    return updated_password

@router.delete("/passwords/{password_id}", response_model=Password)
def delete_user_password(
    password_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_password = passwords.get_password(db, password_id=password_id)
    if db_password is None or db_password.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Password not found")
        
    deleted_password = passwords.delete_password(db=db, password_id=password_id)
    if deleted_password is None:
        raise HTTPException(status_code=500, detail="Failed to delete password")
    return deleted_password 