# Pydantic models for passwords
# Placeholder for later implementation 

from pydantic import BaseModel


class PasswordBase(BaseModel):
    website_url: str
    encrypted_username: str
    username_iv: str
    username_tag: str
    encrypted_password: str
    password_iv: str
    password_tag: str
    encrypted_notes: str | None = None
    notes_iv: str | None = None
    notes_tag: str | None = None


class PasswordCreate(PasswordBase):
    pass


class Password(PasswordBase):
    id: int
    user_id: int
    created_at: str # or datetime
    updated_at: str # or datetime

    class Config:
        orm_mode = True 