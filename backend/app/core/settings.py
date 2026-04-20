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
    MONGO_DB_NAME: str = "ciop_db"
    MONGO_ASSESSMENT_COLLECTION: str = "assessment_questions"
    MONGO_ASSESSMENT_SUBMISSION_COLLECTION: str = "assessment_submissions"
    MONGO_MATERIAL_SOURCE_COLLECTION: str = "material_sources"
    MONGO_AI_SETTINGS_COLLECTION: str = "ai_settings"
    MONGO_RAG_INGESTION_COLLECTION: str = "rag_ingestion_runs"
    MONGO_RAG_DOCUMENT_COLLECTION: str = "rag_documents"
    MONGO_RAG_CHUNK_COLLECTION: str = "rag_chunks"
    MONGO_RAG_IMAGE_COLLECTION: str = "rag_images"
    MONGO_STUDENT_CHAT_THREAD_COLLECTION: str = "student_chat_threads"
    MONGO_STUDENT_CHAT_MESSAGE_COLLECTION: str = "student_chat_messages"
    USE_MONGO_MOCK: bool = False
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    UPLOAD_ROOT: str = str(BACKEND_DIR / "uploads")
    UPLOAD_URL_PREFIX: str = "/uploads"
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024
    RAG_CHUNK_SIZE: int = 700
    RAG_CHUNK_OVERLAP: int = 120
    RAG_MAX_CONTEXT_CHUNKS: int = 6
    RAG_SOURCE_ROOT: str = str(BACKEND_DIR / "uploads" / "documents")
    RAG_VECTOR_DIR: str = str(BACKEND_DIR / "instance" / "rag" / "chroma")
    
    # Text Embedding Configuration
    RAG_TEXT_EMBEDDING_PROVIDER: str = "local"  # local, openai, huggingface, ollama
    RAG_TEXT_MODEL: str = "all-MiniLM-L6-v2"  # HuggingFace model name or local path
    
    # Image Embedding Configuration
    RAG_IMAGE_EMBEDDING_PROVIDER: str = "local"  # local, openai, huggingface
    RAG_CLIP_MODEL: str = "openai/clip-vit-base-patch32"  # Used for local embeddings
    
    # API Configuration for Embeddings
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"  # For OpenAI embeddings
    OPENAI_EMBEDDING_API_KEY: str = ""  # OpenAI API key (optional, uses OPENAI_API_KEY if not set)
    HUGGINGFACE_EMBEDDING_API_KEY: str = ""  # Hugging Face API key
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"  # For Ollama embeddings
    OLLAMA_EMBEDDING_BASE_URL: str = "http://localhost:11434"  # Ollama endpoint for embeddings
    
    # Embedding Retrieval Settings
    RAG_TEXT_TOP_K: int = 4
    RAG_IMAGE_TOP_K: int = 3
    RAG_CHUNK_TOKENS: int = 700
    RAG_CHUNK_TOKEN_OVERLAP: int = 100

    EMAIL_ENABLED: bool = False
    EMAIL_FROM_ADDRESS: str = "no-reply@ciop.local"
    EMAIL_FROM_NAME: str = "CIOP Platform"
    EMAIL_SMTP_HOST: str = ""
    EMAIL_SMTP_PORT: int = 587
    EMAIL_SMTP_USERNAME: str = ""
    EMAIL_SMTP_PASSWORD: str = ""
    EMAIL_SMTP_USE_TLS: bool = True
    EMAIL_SMTP_USE_SSL: bool = False
    EMAIL_IMAP_HOST: str = ""
    EMAIL_IMAP_PORT: int = 993
    EMAIL_IMAP_USERNAME: str = ""
    EMAIL_IMAP_PASSWORD: str = ""
    EMAIL_IMAP_MAILBOX: str = "INBOX"
    EMAIL_IMAP_USE_SSL: bool = True
    EMAIL_DEBUG_INCLUDE_OTP: bool = True

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
