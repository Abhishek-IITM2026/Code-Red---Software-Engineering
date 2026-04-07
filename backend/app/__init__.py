from flask import Flask

from .core.celery_app import init_celery
from .core.extensions import cors, db, limiter, migrate
from .core.runtime import apply_local_fallbacks
from .api.router import register_blueprints
from .config import get_config
from .document_store import init_document_store
from .upload_storage import init_upload_storage
from .seed import seed_database


def create_app(config_name: str | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))
    apply_local_fallbacks(app)

    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)
    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": app.config.get("CORS_ALLOWED_ORIGINS", []),
                "allow_headers": ["Authorization", "Content-Type"],
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            }
        },
    )
    init_document_store(app)
    init_upload_storage(app)
    init_celery(app)
    register_blueprints(app)

    with app.app_context():
        if app.config.get("AUTO_CREATE_TABLES"):
            db.create_all()
        if app.config.get("SEED_ON_STARTUP"):
            seed_database()

    return app
