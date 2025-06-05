from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv() # Lädt Umgebungsvariablen aus .env

app = FastAPI(title="Passwort-Manager Backend")

@app.get("/")
async def read_root():
    return {"message": "Willkommen zum Passwort-Manager Backend!"}

# Teste DB-Verbindung (später in core/database.py)
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker
# DATABASE_URL = os.getenv("DATABASE_URL")
# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# @app.on_event("startup")
# async def startup_db_client():
#     try:
#         conn = SessionLocal()
#         conn.execute(text("SELECT 1"))
#         print("Datenbankverbindung erfolgreich!")
#         conn.close()
#     except Exception as e:
#         print(f"Datenbankverbindung fehlgeschlagen: {e}") 