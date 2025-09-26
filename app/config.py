import os
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = Field(
        default=os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg2://postgres:postgres@localhost:5432/edumanage",
        )
    )

    # Auth / JWT
    JWT_SECRET: str = Field(default=os.getenv("JWT_SECRET", "change_me"))
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")))

    # Admin bootstrap
    ADMIN_USERNAME: str = Field(default=os.getenv("ADMIN_USERNAME", "admin"))
    ADMIN_PASSWORD: str = Field(default=os.getenv("ADMIN_PASSWORD", "admin123"))

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = Field(default_factory=lambda: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ])

    # Storage
    STORAGE_DIR: str = Field(default=os.getenv("STORAGE_DIR", "storage"))
    RECEIPTS_DIR: str = Field(default=os.getenv("RECEIPTS_DIR", os.path.join("storage", "receipts")))
    REPORTS_DIR: str = Field(default=os.getenv("REPORTS_DIR", os.path.join("storage", "reports")))
    DOCUMENTS_DIR: str = Field(default=os.getenv("DOCUMENTS_DIR", os.path.join("storage", "documents")))

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(settings.RECEIPTS_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs(settings.DOCUMENTS_DIR, exist_ok=True)
