from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from .app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    hashed_master_password = Column(Text, nullable=False)
    salt = Column(Text, nullable=False)
    two_fa_enabled = Column(Boolean, default=False)
    two_fa_secret = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    passwords = relationship("Password", back_populates="owner")


class Password(Base):
    __tablename__ = "passwords"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    website_url = Column(Text, nullable=False)
    encrypted_username = Column(Text, nullable=False)
    username_iv = Column(Text, nullable=False)
    username_tag = Column(Text, nullable=False)
    encrypted_password = Column(Text, nullable=False)
    password_iv = Column(Text, nullable=False)
    password_tag = Column(Text, nullable=False)
    encrypted_notes = Column(Text, nullable=True)
    notes_iv = Column(Text, nullable=True)
    notes_tag = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    owner = relationship("User", back_populates="passwords") 