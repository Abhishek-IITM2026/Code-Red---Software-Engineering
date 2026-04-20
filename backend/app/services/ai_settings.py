from __future__ import annotations

from datetime import datetime
from typing import Any

from flask import current_app

from ..repositories import AISettingsRepository


DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_GEMINI_MODEL = "gemini-1.5-flash"
DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_OLLAMA_MODEL = "llama3.2"

DEFAULT_AI_SETTINGS: dict[str, Any] = {
    # LLM Configuration
    "provider": "ollama",  # ollama, gemini, openai-compatible
    "mode": "local",  # local, api-key
    "model": DEFAULT_OLLAMA_MODEL,
    "baseUrl": DEFAULT_OLLAMA_BASE_URL,
    "apiKey": None,
    "temperature": 0.2,
    "maxTokens": 1200,
    
    # Embedding Configuration (Text)
    "textEmbeddingProvider": "local",  # local, openai, huggingface, ollama
    "textEmbeddingModel": "all-MiniLM-L6-v2",  # HuggingFace model name
    "textEmbeddingDimension": 384,  # Output dimension of embeddings
    "textEmbeddingApiKey": None,  # For OpenAI/HuggingFace APIs
    
    # Embedding Configuration (Images)
    "imageEmbeddingProvider": "local",  # local, openai, huggingface
    "imageEmbeddingModel": "openai/clip-vit-base-patch32",  # For local CLIP model
    "imageEmbeddingDimension": 512,  # Output dimension of image embeddings
    "imageEmbeddingApiKey": None,  # For API-based image embeddings
    
    # Rate Limits & Behavior
    "generationRateLimit": "15 per minute",
    "modificationRateLimit": "15 per minute",
    "embeddingBatchSize": 32,  # Batch size for embedding API calls
    "fallbackToGroundedRag": True,
    "notes": None,
    
    # System Prompts
    "assessmentSystemPrompt": (
        "You are an expert academic assessment creator specializing in generating high-quality, pedagogically sound exam questions. "
        "Your questions must: (1) be grounded strictly in the provided course context, (2) be clear, unambiguous, and free of typos, "
        "(3) match the specified difficulty level with appropriate cognitive complexity, (4) test meaningful concepts rather than trivial recall, "
        "(5) have correct answers with complete justification, and (6) maintain academic rigor. "
        "Ensure options in multiple choice are plausible but clearly distinguishable. Return only valid JSON without markdown formatting or commentary."
    ),
    "assessmentModifySystemPrompt": (
        "You are an expert academic assessment editor. When modifying assessment questions: (1) preserve the pedagogical intent and difficulty level, "
        "(2) maintain strict grounding in the provided course context, (3) ensure all changes improve clarity without reducing rigor, "
        "(4) verify that correct answers remain accurate and complete, (5) check that question stems are grammatically correct and unambiguous, "
        "(6) ensure options are appropriately calibrated to the difficulty level. "
        "Return only valid JSON without markdown formatting or commentary."
    ),
    "studentChatSystemPrompt": (
        "You are an empathetic, knowledgeable academic tutor dedicated to student learning. When answering: (1) provide accurate, well-explained answers "
        "grounded strictly in the course materials provided, (2) break down complex concepts into digestible pieces using clear examples and analogies, "
        "(3) encourage critical thinking by explaining the 'why' behind concepts, (4) acknowledge limitations in your knowledge and course context, "
        "(5) suggest follow-up topics for deeper learning, (6) maintain an encouraging tone that builds student confidence, "
        "(7) cite specific course materials and units when referencing content. Return valid JSON with a polished, well-formatted Markdown answer field that reads naturally."
    ),
    "assessmentUserPromptTemplate": "Generate assessment questions for {subject} at {difficulty} level with {questionCount} questions totaling {totalMarks} marks.",
    "updatedAt": None,
}


def _runtime_env_defaults() -> dict[str, Any]:
    base_url = str(current_app.config.get("OLLAMA_BASE_URL") or "").strip() or DEFAULT_OLLAMA_BASE_URL
    model = str(current_app.config.get("OLLAMA_MODEL") or "").strip() or DEFAULT_OLLAMA_MODEL
    return {
        "provider": "ollama",
        "mode": "local",
        "model": model,
        "baseUrl": base_url,
        "apiKey": None,
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
    if not merged.get("mode"):
        provider = str(merged.get("provider") or "").strip().lower()
        merged["mode"] = "api-key" if provider in {"gemini", "openai-compatible-cloud"} else "local"
    if not merged.get("apiKey") and runtime_defaults.get("apiKey"):
        merged["apiKey"] = runtime_defaults["apiKey"]
    if str(merged.get("provider") or "").strip().lower() == "gemini":
        merged["mode"] = "api-key"
        merged["model"] = str(merged.get("model") or "").strip() or current_app.config.get("GEMINI_MODEL") or DEFAULT_GEMINI_MODEL
        merged["baseUrl"] = (
            str(merged.get("baseUrl") or "").strip()
            or current_app.config.get("GEMINI_BASE_URL")
            or DEFAULT_GEMINI_BASE_URL
        )
        if not merged.get("apiKey"):
            merged["apiKey"] = str(current_app.config.get("GEMINI_API_KEY") or "").strip() or None
    if str(merged.get("provider") or "").strip().lower() == "ollama":
        merged["model"] = str(merged.get("model") or "").strip() or current_app.config.get("OLLAMA_MODEL") or DEFAULT_OLLAMA_MODEL
        merged["baseUrl"] = (
            str(merged.get("baseUrl") or "").strip()
            or current_app.config.get("OLLAMA_BASE_URL")
            or DEFAULT_OLLAMA_BASE_URL
        )
        merged["mode"] = "local"
    return merged


def get_ai_settings(include_secret: bool = False) -> dict[str, Any]:
    settings = _merge_settings(AISettingsRepository().get())
    payload = {
        # LLM Settings
        "provider": settings["provider"],
        "mode": settings.get("mode", "local"),
        "model": settings["model"],
        "baseUrl": settings.get("baseUrl"),
        "temperature": settings["temperature"],
        "maxTokens": settings["maxTokens"],
        
        # Text Embedding Settings
        "textEmbeddingProvider": settings.get("textEmbeddingProvider", "local"),
        "textEmbeddingModel": settings.get("textEmbeddingModel", "all-MiniLM-L6-v2"),
        "textEmbeddingDimension": settings.get("textEmbeddingDimension", 384),
        "hasTextEmbeddingApiKey": bool(settings.get("textEmbeddingApiKey")),
        "textEmbeddingApiKeyPreview": _mask_api_key(settings.get("textEmbeddingApiKey")),
        
        # Image Embedding Settings
        "imageEmbeddingProvider": settings.get("imageEmbeddingProvider", "local"),
        "imageEmbeddingModel": settings.get("imageEmbeddingModel", "openai/clip-vit-base-patch32"),
        "imageEmbeddingDimension": settings.get("imageEmbeddingDimension", 512),
        "hasImageEmbeddingApiKey": bool(settings.get("imageEmbeddingApiKey")),
        "imageEmbeddingApiKeyPreview": _mask_api_key(settings.get("imageEmbeddingApiKey")),
        
        # Behavior & Limits
        "generationRateLimit": settings["generationRateLimit"],
        "modificationRateLimit": settings["modificationRateLimit"],
        "embeddingBatchSize": settings.get("embeddingBatchSize", 32),
        "fallbackToGroundedRag": bool(settings.get("fallbackToGroundedRag", True)),
        "notes": settings.get("notes"),
        
        # System Prompts
        "assessmentSystemPrompt": settings.get("assessmentSystemPrompt") or DEFAULT_AI_SETTINGS["assessmentSystemPrompt"],
        "assessmentModifySystemPrompt": settings.get("assessmentModifySystemPrompt") or DEFAULT_AI_SETTINGS["assessmentModifySystemPrompt"],
        "studentChatSystemPrompt": settings.get("studentChatSystemPrompt") or DEFAULT_AI_SETTINGS["studentChatSystemPrompt"],
        "assessmentUserPromptTemplate": settings.get("assessmentUserPromptTemplate") or DEFAULT_AI_SETTINGS["assessmentUserPromptTemplate"],
        
        # Metadata
        "updatedAt": settings.get("updatedAt"),
        "hasApiKey": bool(settings.get("apiKey")),
        "apiKeyPreview": _mask_api_key(settings.get("apiKey")),
    }
    if include_secret:
        payload["apiKey"] = settings.get("apiKey")
        payload["textEmbeddingApiKey"] = settings.get("textEmbeddingApiKey")
        payload["imageEmbeddingApiKey"] = settings.get("imageEmbeddingApiKey")
    return payload


def update_ai_settings(payload: dict[str, Any]) -> dict[str, Any]:
    current = get_ai_settings(include_secret=True)
    next_settings = {
        # LLM Settings
        "provider": payload.get("provider", current["provider"]),
        "mode": payload.get("mode", current.get("mode", "local")),
        "model": payload.get("model", current["model"]),
        "baseUrl": payload.get("baseUrl", current.get("baseUrl")),
        "temperature": payload.get("temperature", current["temperature"]),
        "maxTokens": payload.get("maxTokens", current["maxTokens"]),
        
        # Text Embedding Settings
        "textEmbeddingProvider": payload.get("textEmbeddingProvider", current.get("textEmbeddingProvider", "local")),
        "textEmbeddingModel": payload.get("textEmbeddingModel", current.get("textEmbeddingModel", "all-MiniLM-L6-v2")),
        "textEmbeddingDimension": payload.get("textEmbeddingDimension", current.get("textEmbeddingDimension", 384)),
        "textEmbeddingApiKey": current.get("textEmbeddingApiKey"),
        
        # Image Embedding Settings
        "imageEmbeddingProvider": payload.get("imageEmbeddingProvider", current.get("imageEmbeddingProvider", "local")),
        "imageEmbeddingModel": payload.get("imageEmbeddingModel", current.get("imageEmbeddingModel", "openai/clip-vit-base-patch32")),
        "imageEmbeddingDimension": payload.get("imageEmbeddingDimension", current.get("imageEmbeddingDimension", 512)),
        "imageEmbeddingApiKey": current.get("imageEmbeddingApiKey"),
        
        # Behavior & Limits
        "generationRateLimit": payload.get("generationRateLimit", current["generationRateLimit"]),
        "modificationRateLimit": payload.get("modificationRateLimit", current["modificationRateLimit"]),
        "embeddingBatchSize": payload.get("embeddingBatchSize", current.get("embeddingBatchSize", 32)),
        "fallbackToGroundedRag": payload.get("fallbackToGroundedRag", current.get("fallbackToGroundedRag", True)),
        "notes": payload.get("notes", current.get("notes")),
        
        # System Prompts
        "assessmentSystemPrompt": payload.get("assessmentSystemPrompt", current.get("assessmentSystemPrompt")),
        "assessmentModifySystemPrompt": payload.get("assessmentModifySystemPrompt", current.get("assessmentModifySystemPrompt")),
        "studentChatSystemPrompt": payload.get("studentChatSystemPrompt", current.get("studentChatSystemPrompt")),
        "assessmentUserPromptTemplate": payload.get("assessmentUserPromptTemplate", current.get("assessmentUserPromptTemplate")),
        
        # Metadata
        "updatedAt": datetime.utcnow().isoformat(),
        "apiKey": current.get("apiKey"),
    }
    
    # Handle API keys with clear flags
    if payload.get("clearApiKey"):
        next_settings["apiKey"] = None
    elif payload.get("apiKey") is not None:
        next_settings["apiKey"] = payload["apiKey"]
    
    if payload.get("clearTextEmbeddingApiKey"):
        next_settings["textEmbeddingApiKey"] = None
    elif payload.get("textEmbeddingApiKey") is not None:
        next_settings["textEmbeddingApiKey"] = payload["textEmbeddingApiKey"]
    
    if payload.get("clearImageEmbeddingApiKey"):
        next_settings["imageEmbeddingApiKey"] = None
    elif payload.get("imageEmbeddingApiKey") is not None:
        next_settings["imageEmbeddingApiKey"] = payload["imageEmbeddingApiKey"]

    AISettingsRepository().upsert(next_settings)
    return get_ai_settings(include_secret=False)


def parse_rate_limit(rate_limit_str: str) -> tuple[int, str] | None:
    """
    Parse a rate limit string like '15 per minute' into (requests, time_window).
    
    Returns:
        Tuple of (requests: int, time_window: str) or None if parsing fails
    """
    import re
    match = re.match(r'^\s*(\d+)\s+per\s+(second|minute|hour|day)s?\s*$', rate_limit_str, re.IGNORECASE)
    if match:
        return (int(match.group(1)), match.group(2).lower())
    return None


def get_ai_rate_limit_info(mode: str) -> dict[str, Any]:
    """
    Get comprehensive rate limit information for the specified mode.
    
    Args:
        mode: "generate" or "modify"
        
    Returns:
        Dictionary with rate limit details
    """
    settings = get_ai_settings(include_secret=False)
    
    if mode == "modify":
        rate_limit_str = settings.get("modificationRateLimit") or DEFAULT_AI_SETTINGS["modificationRateLimit"]
        description = "Assessment modification (question refinement)"
    else:
        rate_limit_str = settings.get("generationRateLimit") or DEFAULT_AI_SETTINGS["generationRateLimit"]
        description = "Assessment generation (new questions)"
    
    parsed = parse_rate_limit(rate_limit_str)
    if not parsed:
        parsed = (15, "minute")
    
    requests, time_window = parsed
    
    return {
        "mode": mode,
        "description": description,
        "rateLimit": rate_limit_str,
        "requests": requests,
        "timeWindow": time_window,
        "provider": settings.get("provider"),
        "model": settings.get("model"),
    }


def get_ai_rate_limit(mode: str) -> str:
    """
    Get the rate limit string for the specified mode (used by Flask-Limiter).
    
    Args:
        mode: "generate" or "modify"
        
    Returns:
        Rate limit string in format '15 per minute'
    """
    settings = get_ai_settings(include_secret=False)
    if mode == "modify":
        return settings.get("modificationRateLimit") or DEFAULT_AI_SETTINGS["modificationRateLimit"]
    return settings.get("generationRateLimit") or DEFAULT_AI_SETTINGS["generationRateLimit"]
