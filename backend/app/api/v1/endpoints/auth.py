# Endpunkte für Authentifizierung (Login, Registrierung)
# Placeholder for later implementation 

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm # Use OAuth2PasswordRequestForm for login for compatibility
from sqlalchemy.orm import Session

from .....crud import users
from .....schemas.user import UserCreate, User
from .....schemas.auth import Token, UserLogin, LoginResponse # Import LoginResponse
from .....core.database import get_db
from .....core.security import verify_password, hash_password, create_access_token # Import hash_password for registration and create_access_token
from datetime import timedelta
from .....core.config import settings # Import settings

router = APIRouter()

@router.post("/register", response_model=User)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = users.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    # The hashing and salt generation is handled within the create_user function now
    return users.create_user(db=db, user=user)

@router.post("/login", response_model=LoginResponse) # Change response_model to LoginResponse
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = users.get_user_by_username(db, username=form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # The salt is stored in the database for the user
    # The verify_password function from security.py should handle combining password and salt
    if not verify_password(form_data.password, user.hashed_master_password): # Assuming verify_password handles salt internally now
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Include salt and two_factor_enabled in the response
    return {"access_token": access_token, "token_type": "bearer", "salt": user.salt, "two_factor_enabled": user.two_factor_enabled}

# Login endpoint will be added next 