from __future__ import annotations

import json
from typing import Any
from urllib import error as urllib_error
from urllib import parse as urllib_parse
from urllib import request as urllib_request


DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_GEMINI_MODEL = "gemini-1.5-flash"
DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_OLLAMA_MODEL = "llama3.2"
SUPPORTED_EXTERNAL_PROVIDERS = {
    "ollama",
    "openai-compatible-cloud",
    "openai-compatible-local",
    "gemini",
}
EXTERNAL_PROVIDER_ERRORS = (
    OSError,
    ValueError,
    json.JSONDecodeError,
    urllib_error.URLError,
    urllib_error.HTTPError,
)


def resolve_external_runtime(ai_settings: dict[str, Any] | None) -> tuple[str, str, str, str | None, str]:
    settings = ai_settings or {}
    provider = str(settings.get("provider") or "grounded-rag").strip().lower()
    mode = str(settings.get("mode") or "").strip().lower()
    model = str(settings.get("model") or "").strip()
    base_url = str(settings.get("baseUrl") or "").strip().rstrip("/")
    api_key = str(settings.get("apiKey") or "").strip() or None

    if provider == "ollama":
        if not model:
            model = DEFAULT_OLLAMA_MODEL
        if not base_url:
            base_url = DEFAULT_OLLAMA_BASE_URL
        mode = "local"
    if provider == "gemini":
        if not model:
            model = DEFAULT_GEMINI_MODEL
        if not base_url:
            base_url = DEFAULT_GEMINI_BASE_URL
        if not mode:
            mode = "api-key"

    if not mode:
        mode = "local" if provider in {"grounded-rag", "ollama", "openai-compatible-local"} else "api-key"

    return provider, base_url, model, api_key, mode


def post_external_chat_completion(
    *,
    provider: str,
    base_url: str,
    api_key: str | None,
    model: str,
    prompt: str,
    system_prompt: str,
    temperature: float,
    max_tokens: int,
) -> dict[str, Any]:
    if provider == "gemini":
        return _post_gemini_completion(
            base_url=base_url,
            api_key=api_key,
            model=model,
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    if provider == "ollama":
        return _post_ollama_completion(
            base_url=base_url,
            model=model,
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    return _post_openai_compatible_completion(
        base_url=base_url,
        api_key=api_key,
        model=model,
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=temperature,
        max_tokens=max_tokens,
    )


def extract_text_content(provider: str, payload: dict[str, Any]) -> str | None:
    if provider == "ollama":
        message = payload.get("message")
        if isinstance(message, dict) and isinstance(message.get("content"), str):
            return message["content"]
        return None
    if provider == "gemini":
        candidates = payload.get("candidates")
        if not isinstance(candidates, list) or not candidates:
            return None
        for candidate in candidates:
            if not isinstance(candidate, dict):
                continue
            content = candidate.get("content")
            if not isinstance(content, dict):
                continue
            parts = content.get("parts")
            if not isinstance(parts, list):
                continue
            text_parts = [
                item.get("text")
                for item in parts
                if isinstance(item, dict) and isinstance(item.get("text"), str)
            ]
            merged = "".join(text_parts).strip()
            if merged:
                return merged
        return None

    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return None
    message = choices[0].get("message") if isinstance(choices[0], dict) else None
    if not isinstance(message, dict):
        return None
    content = message.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, dict) and isinstance(item.get("text"), str):
                text_parts.append(item["text"])
        return "".join(text_parts) or None
    return None


def _post_openai_compatible_completion(
    *,
    base_url: str,
    api_key: str | None,
    model: str,
    prompt: str,
    system_prompt: str,
    temperature: float,
    max_tokens: int,
) -> dict[str, Any]:
    if not base_url or not model:
        raise ValueError("OpenAI-compatible provider requires base_url and model.")

    payload = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    }
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    request = urllib_request.Request(
        f"{base_url}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib_request.urlopen(request, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def _post_gemini_completion(
    *,
    base_url: str,
    api_key: str | None,
    model: str,
    prompt: str,
    system_prompt: str,
    temperature: float,
    max_tokens: int,
) -> dict[str, Any]:
    if not api_key:
        raise ValueError("Gemini provider requires an API key.")
    if not base_url or not model:
        raise ValueError("Gemini provider requires base_url and model.")

    model_path = model if model.startswith("models/") else f"models/{model}"
    endpoint = f"{base_url}/{model_path}:generateContent"
    query = urllib_parse.urlencode({"key": api_key})
    request_url = f"{endpoint}?{query}"

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}],
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": max(float(temperature), 0.0),
            "maxOutputTokens": max(int(max_tokens), 1),
            "responseMimeType": "application/json",
        },
    }

    request = urllib_request.Request(
        request_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib_request.urlopen(request, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def _post_ollama_completion(
    *,
    base_url: str,
    model: str,
    prompt: str,
    system_prompt: str,
    temperature: float,
    max_tokens: int,
) -> dict[str, Any]:
    if not base_url or not model:
        raise ValueError("Ollama provider requires base_url and model.")

    payload = {
        "model": model,
        "stream": False,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "options": {
            "temperature": max(float(temperature), 0.0),
            "num_predict": max(int(max_tokens), 1),
        },
    }

    request = urllib_request.Request(
        f"{base_url}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib_request.urlopen(request, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))
