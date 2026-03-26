from __future__ import annotations

from urllib.parse import urlparse

import redis


def is_redis_available(redis_url: str | None) -> bool:
    if not redis_url:
        return False

    parsed = urlparse(redis_url)
    if parsed.scheme not in {"redis", "rediss"}:
        return False

    try:
        client = redis.Redis.from_url(redis_url, socket_connect_timeout=0.5, socket_timeout=0.5)
        client.ping()
        return True
    except Exception:
        return False


def apply_local_fallbacks(app) -> None:
    redis_url = app.config.get("REDIS_URL")
    if is_redis_available(redis_url):
        return

    app.config["CELERY_BROKER_URL"] = "memory://"
    app.config["CELERY_RESULT_BACKEND"] = "cache+memory://"
    app.config["CELERY_TASK_ALWAYS_EAGER"] = True
    app.config["RATELIMIT_STORAGE_URI"] = "memory://"
