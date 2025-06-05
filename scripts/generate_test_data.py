# Skript zum Generieren von 100k+ Datensätzen
# Placeholder for later implementation
print("Generate test data script placeholder") 

import os
import psycopg2
from dotenv import load_dotenv
from faker import Faker
import base64
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import random

# Load environment variables from backend/.env
# Assume this script is run from the project root or scripts directory, 
# but the .env is in the backend directory relative to the root.
load_dotenv(dotenv_path='../backend/.env')

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL not found in backend/.env")
    exit(1)

faker = Faker()
backend = default_backend()

# --- Replicating necessary security functions from backend/app/core/security.py ---
# In a real scenario, you might structure your project to share these.
def derive_key_from_password(password: str, salt: bytes) -> bytes:
    kdf = Scrypt(
        salt=salt,
        length=32, # 256 bits for AES-256
        n=2**14, # Must match backend (example value)
        r=8,     # Must match backend
        p=1,     # Must match backend
        backend=backend
    )
    return kdf.derive(password.encode('utf-8'))

def encrypt_data(data: str, key: bytes) -> tuple[str, str, str]:
    # Ensure data is bytes
    data_bytes = data.encode('utf-8')
    iv = os.urandom(12) # 96-bit IV for GCM
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv), backend=backend)
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(data_bytes) + encryptor.finalize()
    return base64.b64encode(iv).decode('utf-8'), base64.b64encode(ciphertext).decode('utf-8'), base64.b64encode(encryptor.tag).decode('utf-8')

# We don't need hash_password here as we are inserting encrypted data directly, 
# and the master password hash is for user authentication, not encrypting passwords.
# We DO need to generate a salt for the user, similar to backend user creation.
def generate_salt() -> str:
    return base64.b64encode(os.urandom(16)).decode('utf-8') # 16 bytes salt

# --- Data Generation Logic ---

def generate_users(num_users: int):
    users_data = []
    for _ in range(num_users):
        username = faker.user_name() + str(random.randint(1000, 9999)) # Ensure unique username
        # For test data, we can use a simple master password and derive a key
        # In a real scenario, the user provides the master password
        master_password = "testpassword123!"
        salt = generate_salt()
        # In a real app, master_password is hashed. Here we just need the salt for key derivation later.
        # We'll store a placeholder hashed password and the salt.
        # NOTE: This simplified approach is for generating test data. 
        # The actual user registration uses a proper password hashing function (Argon2).
        hashed_master_password_placeholder = "placeholder_hashed_password"
        users_data.append((
            username,
            hashed_master_password_placeholder,
            salt,
            False, # 2FA disabled
            None # 2FA secret
        ))
    return users_data

def generate_passwords(user_ids: list[int], num_passwords_per_user: int):
    passwords_data = []
    # For generating encrypted passwords, we need a key derived from a master password and salt.
    # We'll use a fixed test master password and a derived key for simplicity in data generation.
    # In a real app, each user has their own master password and derived key.
    test_master_password = "testpassword123!"
    # Use a fixed salt for test data encryption key derivation for simplicity.
    # In the actual backend/frontend, each user has a unique salt for master password hashing,
    # and the encryption key is derived from the user's master password and their unique salt.
    # For *generating test password records*, we can use a consistent approach.
    # A pragmatic approach for *generating* encrypted passwords is to use a consistent key derived from a *test* master password and *a* salt.
    # When these passwords are later *retrieved* by the actual application, the user's *actual* master password and *their* salt will be used for decryption.
    # This highlights that the encryption key for password *records* is related to the user's master password, not the (placeholder) hashed master password stored with the user.
    # Let's derive a key using a fixed salt for the purpose of *generating these test password records*.
    test_salt_bytes = os.urandom(16) # Just a random salt for the test data generation script's internal key derivation
    test_encryption_key = derive_key_from_password(test_master_password, test_salt_bytes)

    for user_id in user_ids:
        for _ in range(num_passwords_per_user):
            website_url = faker.url()
            plain_username = faker.user_name()
            plain_password = faker.password()
            plain_notes = faker.sentence()

            # Encrypt username, password, and notes
            try:
                username_iv, encrypted_username, username_tag = encrypt_data(plain_username, test_encryption_key)
                password_iv, encrypted_password, password_tag = encrypt_data(plain_password, test_encryption_key)
                notes_iv, encrypted_notes, notes_tag = encrypt_data(plain_notes, test_encryption_key)
            except Exception as e:
                 print(f"Error encrypting data: {e}")
                 continue # Skip this password if encryption fails

            passwords_data.append((
                user_id,
                website_url,
                encrypted_username,
                username_iv,
                username_tag,
                encrypted_password,
                password_iv,
                password_tag,
                encrypted_notes,
                notes_iv,
                notes_tag
            ))
    return passwords_data

# Modified to insert users one by one to get returning IDs
def insert_users_individually(conn, users_data):
    cursor = conn.cursor()
    sql = "INSERT INTO users (username, hashed_master_password, salt, two_fa_enabled, two_fa_secret) VALUES (%s, %s, %s, %s, %s) RETURNING id;"
    user_ids = []
    for i, user_data in enumerate(users_data):
        try:
            cursor.execute(sql, user_data)
            user_id = cursor.fetchone()[0] # Fetch the single returned ID
            user_ids.append(user_id)
            conn.commit()
            if (i + 1) % 100 == 0: # Print progress every 100 users
                print(f"Inserted {i + 1} users.")
        except Exception as e:
            conn.rollback() # Rollback in case of error
            print(f"Error inserting user {user_data[0]}: {e}")
            # Depending on requirements, you might want to stop or continue here
    cursor.close()
    return user_ids

def insert_passwords_in_batches(conn, passwords_data, batch_size=1000):
    cursor = conn.cursor()
    sql = "INSERT INTO passwords (user_id, website_url, encrypted_username, username_iv, username_tag, encrypted_password, password_iv, password_tag, encrypted_notes, notes_iv, notes_tag) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);"
    for i in range(0, len(passwords_data), batch_size):
        batch = passwords_data[i:i + batch_size]
        cursor.executemany(sql, batch)
        conn.commit()
        print(f"Inserted {len(batch)} passwords. Total passwords inserted: {i + len(batch)}")
    cursor.close()

# --- Main Execution ---
if __name__ == "__main__":
    num_users = 1000 # Generate 1000 users
    num_passwords_per_user = 100 # Each user gets 100 passwords, total 100,000 passwords
    total_passwords = num_users * num_passwords_per_user

    print(f"Generating {num_users} users and {total_passwords} passwords...")

    users_data = generate_users(num_users)
    # We don't generate passwords yet, we need user IDs first after inserting users.

    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("Database connection successful.")

        print("Inserting users...")
        # Use the modified function to insert users individually
        user_ids = insert_users_individually(conn, users_data)

        if len(user_ids) > 0:
            print("Generating password data...")
            # Now generate passwords using the IDs of the users we just inserted
            passwords_data = generate_passwords(user_ids, num_passwords_per_user)

            print("Inserting passwords...")
            insert_passwords_in_batches(conn, passwords_data)

            print("Data generation and insertion complete.")
        else:
            print("No users were inserted, skipping password generation.")

        conn.close()

    except Exception as e:
        print(f"An error occurred: {e}") 