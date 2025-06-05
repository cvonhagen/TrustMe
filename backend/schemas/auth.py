# Pydantic models for authentication
# Placeholder for later implementation 

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


class UserLogin(BaseModel):
    username: str
    master_password: str


# Updated schema for Login response to include salt and 2FA status
class LoginResponse(Token):
    salt: str
    two_factor_enabled: bool


class UserLogin(BaseModel):
    username: str
    master_password: str 