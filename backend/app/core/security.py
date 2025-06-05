from passlib.context import CryptContext
from cryptography.fernet import Fernet # Für einfache Demo, später AES-GCM
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
import os
import base64

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def derive_key_from_password(password: str, salt: bytes) -> bytes:
    kdf = Scrypt(
        salt=salt,
        length=32, # 256 bits for AES-256
        n=2**14, # N = iteration count (adjust as needed for performance/security)
        r=8,     # r = block size
        p=1,     # p = parallelism factor
        backend=default_backend()
    )
    return kdf.derive(password.encode('utf-8'))

def encrypt_data(data: str, key: bytes) -> tuple[str, str, str]:
    iv = os.urandom(12) # 96-bit IV for GCM
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(data.encode('utf-8')) + encryptor.finalize()
    return base64.b64encode(iv).decode('utf-8'), base64.b64encode(ciphertext).decode('utf-8'), base64.b64encode(encryptor.tag).decode('utf-8')

# Zum Testen (nicht für Produktion im Backend)
def decrypt_data(encrypted_text: str, iv_b64: str, tag_b64: str, key: bytes) -> str:
    iv = base64.b64decode(iv_b64)
    ciphertext = base64.b64decode(encrypted_text)
    tag = base64.b64decode(tag_b64)
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv, tag), backend=default_backend())
    decryptor = cipher.decryptor()
    return (decryptor.update(ciphertext) + decryptor.finalize()).decode('utf-8') 