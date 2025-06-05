# Pydantic models for users
# Placeholder for later implementation 

from pydantic import BaseModel


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    master_password: str


class User(UserBase):
    id: int
    two_fa_enabled: bool

    class Config:
        orm_mode = True 