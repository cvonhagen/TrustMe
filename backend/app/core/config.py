from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str # Für JWT
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # ... weitere Secrets oder Einstellungen

    model_config = SettingsConfigDict(env_file=".env") # Hier lädt Pydantic die .env

settings = Settings() 