import os
import secrets
from pydantic_settings import BaseSettings
from typing import List
from pydantic import computed_field

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str
    
    # Security
    JWT_SECRET: str | None = None
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Rate limiting
    RATE_LIMIT_PER_SECOND: int = 10
    
    # Admin bootstrap - only used for initial setup
    ADMIN_USERNAME: str | None = None
    ADMIN_PASSWORD: str | None = None
    
    # Stripe Configuration
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_PUBLISHABLE_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]

    # Storage base
    STORAGE_DIR: str = "storage"
    
    # Stripe Configuration
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_PUBLISHABLE_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    
    @computed_field
    @property
    def RECEIPTS_DIR(self) -> str:
        return os.path.join(self.STORAGE_DIR, "receipts")
    
    @computed_field
    @property
    def REPORTS_DIR(self) -> str:
        return os.path.join(self.STORAGE_DIR, "reports")
    
    @computed_field
    @property
    def DOCUMENTS_DIR(self) -> str:
        return os.path.join(self.STORAGE_DIR, "documents")
    
    def get_jwt_secret(self) -> str:
        if not self.JWT_SECRET:
            if self.ENVIRONMENT == "production":
                raise ValueError("JWT_SECRET must be set in production")
            return secrets.token_urlsafe(32)
        return self.JWT_SECRET
    
    def get_admin_credentials(self) -> tuple[str, str]:
        username = self.ADMIN_USERNAME or "admin"
        password = self.ADMIN_PASSWORD or "admin123"
        if self.ENVIRONMENT == "production" and (not self.ADMIN_USERNAME or not self.ADMIN_PASSWORD):
            raise ValueError("Admin credentials must be set in production")
        return username, password
    
    def get_stripe_keys(self) -> tuple[str, str, str]:
        if self.ENVIRONMENT == "production":
            if not all([self.STRIPE_SECRET_KEY, self.STRIPE_PUBLISHABLE_KEY, self.STRIPE_WEBHOOK_SECRET]):
                raise ValueError("Stripe configuration must be set in production")
        return (
            self.STRIPE_SECRET_KEY or "sk_test_your_stripe_secret_key",
            self.STRIPE_PUBLISHABLE_KEY or "pk_test_your_stripe_publishable_key",
            self.STRIPE_WEBHOOK_SECRET or "whsec_your_stripe_webhook_secret"
        )
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "allow"
    }


# Create settings instance
settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(settings.RECEIPTS_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs(settings.DOCUMENTS_DIR, exist_ok=True)
