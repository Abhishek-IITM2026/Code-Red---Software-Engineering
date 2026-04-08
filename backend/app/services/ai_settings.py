from __future__ import annotations

from datetime import datetime
from typing import Any

from flask import current_app

from ..repositories import AISettingsRepository


DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_GEMINI_MODEL = "gemini-1.5-flash"

DEFAULT_AI_SETTINGS: dict[str, Any] = {
    "provider": "gemini",
    "model": DEFAULT_GEMINI_MODEL,
    "baseUrl": DEFAULT_GEMINI_BASE_URL,
    "apiKey": None,
    "temperature": 0.2,
    "maxTokens": 1200,
    "generationRateLimit": "15 per minute",
    "modificationRateLimit": "15 per minute",
    "fallbackToGroundedRag": True,
    "notes": None,
    "updatedAt": None,
}


def _runtime_env_defaults() -> dict[str, Any]:
    api_key = str(current_app.config.get("GEMINI_API_KEY") or "").strip() or None
    model = str(current_app.config.get("GEMINI_MODEL") or "").strip() or DEFAULT_GEMINI_MODEL
    base_url = str(current_app.config.get("GEMINI_BASE_URL") or "").strip() or DEFAULT_GEMINI_BASE_URL
    if not api_key:
        return {}
    return {
        "provider": "gemini",
        "model": model,
        "baseUrl": base_url,
        "apiKey": api_key,
    }


def _mask_api_key(value: str | None) -> str | None:
    if not value:
        return None
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}{'*' * (len(value) - 8)}{value[-4:]}"


def _merge_settings(document: dict[str, Any] | None) -> dict[str, Any]:
    merged = dict(DEFAULT_AI_SETTINGS)
    runtime_defaults = _runtime_env_defaults()
    merged.update(runtime_defaults)
    for key, value in (document or {}).items():
        if key.startswith("_") or key == "scope":
            continue
        merged[key] = value
    if not merged.get("apiKey") and runtime_defaults.get("apiKey"):
        merged["apiKey"] = runtime_defaults["apiKey"]
    if runtime_defaults.get("apiKey") and str(merged.get("provider") or "").strip().lower() == "grounded-rag":
        merged["provider"] = "gemini"
    if str(merged.get("provider") or "").strip().lower() == "gemini":
        merged["model"] = str(merged.get("model") or "").strip() or runtime_defaults.get("model") or DEFAULT_GEMINI_MODEL
        merged["baseUrl"] = str(merged.get("baseUrl") or "").strip() or runtime_defaults.get("baseUrl") or DEFAULT_GEMINI_BASE_URL
    return merged


def get_ai_settings(include_secret: bool = False) -> dict[str, Any]:
    settings = _merge_settings(AISettingsRepository().get())
    payload = {
        "provider": settings["provider"],
        "model": settings["model"],
        "baseUrl": settings.get("baseUrl"),
        "temperature": settings["temperature"],
        "maxTokens": settings["maxTokens"],
        "generationRateLimit": settings["generationRateLimit"],
        "modificationRateLimit": settings["modificationRateLimit"],
        "fallbackToGroundedRag": bool(settings.get("fallbackToGroundedRag", True)),
        "notes": settings.get("notes"),
        "updatedAt": settings.get("updatedAt"),
        "hasApiKey": bool(settings.get("apiKey")),
        "apiKeyPreview": _mask_api_key(settings.get("apiKey")),
    }
    if include_secret:
        payload["apiKey"] = settings.get("apiKey")
    return payload


def update_ai_settings(payload: dict[str, Any]) -> dict[str, Any]:
    current = get_ai_settings(include_secret=True)
    next_settings = {
        "provider": payload.get("provider", current["provider"]),
        "model": payload.get("model", current["model"]),
        "baseUrl": payload.get("baseUrl", current.get("baseUrl")),
        "temperature": payload.get("temperature", current["temperature"]),
        "maxTokens": payload.get("maxTokens", current["maxTokens"]),
        "generationRateLimit": payload.get("generationRateLimit", current["generationRateLimit"]),
        "modificationRateLimit": payload.get("modificationRateLimit", current["modificationRateLimit"]),
        "fallbackToGroundedRag": payload.get("fallbackToGroundedRag", current.get("fallbackToGroundedRag", True)),
        "notes": payload.get("notes", current.get("notes")),
        "updatedAt": datetime.utcnow().isoformat(),
        "apiKey": current.get("apiKey"),
    }
    if payload.get("clearApiKey"):
        next_settings["apiKey"] = None
    elif payload.get("apiKey") is not None:
        next_settings["apiKey"] = payload["apiKey"]

    AISettingsRepository().upsert(next_settings)
    return get_ai_settings(include_secret=False)


def get_ai_rate_limit(mode: str) -> str:
    settings = get_ai_settings(include_secret=False)
    if mode == "modify":
        return settings.get("modificationRateLimit") or DEFAULT_AI_SETTINGS["modificationRateLimit"]
    return settings.get("generationRateLimit") or DEFAULT_AI_SETTINGS["generationRateLimit"]
