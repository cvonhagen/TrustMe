# Endpunkte für 2FA-Setup und Verifizierung
# Placeholder for later implementation 

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import pyotp

from .....dependencies import get_current_user
from .....models import User
from .....crud import users # We need user crud to update user 2FA status and secret
from .....core.database import get_db

router = APIRouter()

@router.post("/2fa/setup")
def setup_two_fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.two_fa_enabled:
        raise HTTPException(status_code=400, detail="Two-factor authentication is already enabled for this user.")

    # Generate a secret key
    secret = pyotp.random_base32()

    # Store the secret in the database for the user (in the users table)
    # We need to add a method to the users crud or directly update the user model
    # For now, let's assume we can update the user directly via session
    current_user.two_fa_secret = secret
    db.commit()
    db.refresh(current_user)

    # Generate the provisioning URI (for QR code)
    # Replace "TrustMe" with your app name and current_user.username with the actual username
    provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.username, issuer_name="TrustMe Password Manager"
    )

    return {"secret": secret, "provisioning_uri": provisioning_uri}

@router.post("/2fa/verify")
def verify_two_fa(
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.two_fa_secret:
         raise HTTPException(status_code=400, detail="Two-factor authentication is not set up for this user.")

    totp = pyotp.TOTP(current_user.two_fa_secret)
    if totp.verify(code):
        # Mark 2FA as enabled for the user
        current_user.two_fa_enabled = True
        db.commit()
        db.refresh(current_user)
        return {"detail": "Two-factor authentication enabled successfully.", "status": True}
    else:
        raise HTTPException(status_code=400, detail="Invalid two-factor authentication code.")

# Add endpoint to disable 2FA later if needed 