from pathlib import Path

from .settings import get_settings


BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent


def build_database_uri() -> str:
    settings = get_settings()
    explicit_url = settings.DATABASE_URL
    if explicit_url:
        return explicit_url

    db_engine = settings.DB_ENGINE.strip().lower()
    if db_engine in {"postgres", "postgresql"}:
        host = settings.POSTGRES_HOST
        port = settings.POSTGRES_PORT
        user = settings.POSTGRES_USER
        password = settings.POSTGRES_PASSWORD
        database = settings.POSTGRES_DB
        return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"

    sqlite_path = Path(settings.SQLITE_PATH)
    if not sqlite_path.is_absolute():
        sqlite_path = (PROJECT_ROOT / sqlite_path).resolve()
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{sqlite_path}"


class Config:
    settings = get_settings()

    SECRET_KEY = settings.SECRET_KEY
    SQLALCHEMY_DATABASE_URI = build_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    OTP_EXPIRY_SECONDS = settings.OTP_EXPIRY_SECONDS

    API_PREFIX = settings.API_PREFIX
    API_VERSION = settings.API_VERSION

    MONGO_URI = settings.MONGO_URI
    MONGO_DB_NAME = settings.MONGO_DB_NAME
    MONGO_ASSESSMENT_COLLECTION = settings.MONGO_ASSESSMENT_COLLECTION
    MONGO_ASSESSMENT_SUBMISSION_COLLECTION = settings.MONGO_ASSESSMENT_SUBMISSION_COLLECTION
    USE_MONGO_MOCK = settings.USE_MONGO_MOCK
    UPLOAD_ROOT = settings.UPLOAD_ROOT
    UPLOAD_URL_PREFIX = settings.UPLOAD_URL_PREFIX
    MAX_CONTENT_LENGTH = settings.MAX_CONTENT_LENGTH

    EMAIL_ENABLED = settings.EMAIL_ENABLED
    EMAIL_FROM_ADDRESS = settings.EMAIL_FROM_ADDRESS
    EMAIL_FROM_NAME = settings.EMAIL_FROM_NAME
    EMAIL_SMTP_HOST = settings.EMAIL_SMTP_HOST
    EMAIL_SMTP_PORT = settings.EMAIL_SMTP_PORT
    EMAIL_SMTP_USERNAME = settings.EMAIL_SMTP_USERNAME
    EMAIL_SMTP_PASSWORD = settings.EMAIL_SMTP_PASSWORD
    EMAIL_SMTP_USE_TLS = settings.EMAIL_SMTP_USE_TLS
    EMAIL_SMTP_USE_SSL = settings.EMAIL_SMTP_USE_SSL
    EMAIL_IMAP_HOST = settings.EMAIL_IMAP_HOST
    EMAIL_IMAP_PORT = settings.EMAIL_IMAP_PORT
    EMAIL_IMAP_USERNAME = settings.EMAIL_IMAP_USERNAME
    EMAIL_IMAP_PASSWORD = settings.EMAIL_IMAP_PASSWORD
    EMAIL_IMAP_MAILBOX = settings.EMAIL_IMAP_MAILBOX
    EMAIL_IMAP_USE_SSL = settings.EMAIL_IMAP_USE_SSL
    EMAIL_DEBUG_INCLUDE_OTP = settings.EMAIL_DEBUG_INCLUDE_OTP

    REDIS_URL = settings.REDIS_URL
    CELERY_BROKER_URL = settings.CELERY_BROKER_URL
    CELERY_RESULT_BACKEND = settings.CELERY_RESULT_BACKEND
    CELERY_TASK_ALWAYS_EAGER = settings.CELERY_TASK_ALWAYS_EAGER

    RATELIMIT_ENABLED = settings.RATELIMIT_ENABLED
    RATELIMIT_STORAGE_URI = settings.RATELIMIT_STORAGE_URI or settings.REDIS_URL
    RATELIMIT_DEFAULT = settings.RATELIMIT_DEFAULT
    RATELIMIT_HEADERS_ENABLED = True
    CORS_ALLOWED_ORIGINS = [
        origin.strip()
        for origin in settings.CORS_ALLOWED_ORIGINS.split(",")
        if origin.strip()
    ]

    SEED_ON_STARTUP = settings.SEED_ON_STARTUP
    AUTO_CREATE_TABLES = settings.AUTO_CREATE_TABLES


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SEED_ON_STARTUP = True
    AUTO_CREATE_TABLES = True
    USE_MONGO_MOCK = True
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_BROKER_URL = "memory://"
    CELERY_RESULT_BACKEND = "cache+memory://"
    RATELIMIT_ENABLED = False
    RATELIMIT_STORAGE_URI = "memory://"


def get_config(config_name: str | None):
    if config_name == "testing":
        return TestConfig
    return Config
