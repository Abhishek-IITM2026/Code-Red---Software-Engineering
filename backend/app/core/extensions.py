from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy

try:
    from flask_migrate import Migrate
except ModuleNotFoundError:  # pragma: no cover - depends on installed extras
    class Migrate:  # type: ignore[override]
        def init_app(self, app, db):
            return None


db = SQLAlchemy()
migrate = Migrate()
limiter = Limiter(key_func=get_remote_address, default_limits=[])
cors = CORS()


@dataclass
class InMemoryDocumentDatabase:
    collections: dict[str, dict[str, dict[str, Any]]] = field(default_factory=dict)

    def collection(self, name: str):
        return self.collections.setdefault(name, {})


document_db = InMemoryDocumentDatabase()
