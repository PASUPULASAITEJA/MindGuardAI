from typing import Any, List, Union, Optional
import json
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    ENVIRONMENT: str = Field(default="development", description="Application execution environment (development/production)")
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:secure_database_password_99@db:5432/mindguard",
        description="Connection string pointing to the PostgreSQL service"
    )
    JWT_SECRET_KEY: str = Field(
        default="super_secret_cryptographic_key_32_bytes",
        description="Key used to sign user access and refresh tokens"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=43200, description="Lifetime of the access token in minutes (30 days)")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Expiration limit for HttpOnly cookies in days")
    CORS_ORIGINS: Union[List[str], str] = Field(
        default=["http://localhost:5173"],
        description="Authorized origin whitelist for FastAPI CORS middleware"
    )

    # SMTP Emergency Alert Notification Settings
    SMTP_HOST: str = Field(default="smtp.gmail.com", description="SMTP server host")
    SMTP_PORT: int = Field(default=587, description="SMTP server port (587 for TLS)")
    SMTP_USER: Optional[str] = Field(default=None, description="SMTP authentication username")
    SMTP_PASSWORD: Optional[str] = Field(default=None, description="SMTP authentication password")
    SMTP_FROM_EMAIL: str = Field(default="alerts@mindguard.ai", description="Outbound sender email address")
    SMTP_FROM_NAME: str = Field(default="MindGuard Clinical Emergency System", description="Sender display name")
    SMTP_TLS: bool = Field(default=True, description="Enable STARTTLS on port 587")
    SMTP_ENABLED: bool = Field(default=False, description="Whether live SMTP delivery is enabled or simulated")
    DEFAULT_COUNSELOR_EMAILS: List[str] = Field(
        default=["counseling-center@campus.edu", "mentalhealth-triage@campus.edu"],
        description="Fallback counselor emails when no active counselors are registered"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                raise ValueError("CORS_ORIGINS must be a valid JSON list format or comma-separated string")
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        # Standardize standard DB connection URLs to their async SQLAlchemy equivalent
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif v.startswith("sqlite://") and not v.startswith("sqlite+aiosqlite://"):
            return v.replace("sqlite://", "sqlite+aiosqlite://", 1)
        elif not (v.startswith("postgresql+asyncpg://") or v.startswith("sqlite+aiosqlite://")):
            raise ValueError("DATABASE_URL must start with postgresql://, postgresql+asyncpg://, or sqlite://")
        return v

settings = Settings()
