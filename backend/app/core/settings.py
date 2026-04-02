from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(BACKEND_DIR / ".env"), str(PROJECT_ROOT / ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    SECRET_KEY: str = "dev-secret-key-change-me"
    DB_ENGINE: str = "sqlite"
    DATABASE_URL: str | None = None
    SQLITE_PATH: str = str(BACKEND_DIR / "instance" / "app.db")

    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "code_red"

    OTP_EXPIRY_SECONDS: int = 300
    API_PREFIX: str = "/api"
    API_VERSION: str = "v1"

    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "code_red"
    MONGO_ASSESSMENT_COLLECTION: str = "assessment_questions"
    USE_MONGO_MOCK: bool = False

    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    CELERY_TASK_ALWAYS_EAGER: bool = False

    RATELIMIT_ENABLED: bool = True
    RATELIMIT_STORAGE_URI: str | None = None
    RATELIMIT_DEFAULT: str = "200 per hour"

    SEED_ON_STARTUP: bool = False
    AUTO_CREATE_TABLES: bool = False


def get_settings() -> Settings:
    return Settings()
