# Dependencies for API endpoints (e.g., authentication)
# Placeholder for later implementation 

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from . import crud, models, schemas
from .app.core import security
from .app.core.database import get_db
from .app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login") # Stellen Sie sicher, dass der tokenUrl Pfad korrekt ist

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.decode_access_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.auth.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.users.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user 