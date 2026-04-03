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

    REDIS_URL = settings.REDIS_URL
    CELERY_BROKER_URL = settings.CELERY_BROKER_URL
    CELERY_RESULT_BACKEND = settings.CELERY_RESULT_BACKEND
    CELERY_TASK_ALWAYS_EAGER = settings.CELERY_TASK_ALWAYS_EAGER

    RATELIMIT_ENABLED = settings.RATELIMIT_ENABLED
    RATELIMIT_STORAGE_URI = settings.RATELIMIT_STORAGE_URI or settings.REDIS_URL
    RATELIMIT_DEFAULT = settings.RATELIMIT_DEFAULT
    RATELIMIT_HEADERS_ENABLED = True

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
