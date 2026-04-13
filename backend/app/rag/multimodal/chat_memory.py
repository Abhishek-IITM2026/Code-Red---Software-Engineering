from __future__ import annotations

from typing import Any

from ...repositories import StudentChatMessageRepository, StudentChatThreadRepository
from .runtime import normalize_text


def load_or_create_thread(*, student_id: int, subject_id: int, subject_name: str) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    thread_repository = StudentChatThreadRepository()
    message_repository = StudentChatMessageRepository()
    thread = thread_repository.get_or_create(student_id=student_id, subject_id=subject_id, subject_name=subject_name)
    thread_id = str(thread.get("_id") or "")
    messages = message_repository.list_thread_messages(thread_id) if thread_id else []
    return thread, messages


def persist_exchange(
    *,
    thread_id: str,
    user_question: str,
    assistant_answer: str,
    week: str | None,
    citations: list[dict[str, Any]] | None,
    referenced_images: list[dict[str, Any]] | None,
) -> None:
    message_repository = StudentChatMessageRepository()
    message_repository.create_message(
        thread_id=thread_id,
        role="user",
        content=user_question,
        week=week,
    )
    message_repository.create_message(
        thread_id=thread_id,
        role="assistant",
        content=assistant_answer,
        week=week,
        citations=citations,
        referenced_images=referenced_images,
    )
    messages = message_repository.list_thread_messages(thread_id, limit=12)
    StudentChatThreadRepository().update_summary(thread_id, summarize_thread(messages))


def clear_thread(*, thread_id: str) -> None:
    StudentChatMessageRepository().delete_thread_messages(thread_id)
    StudentChatThreadRepository().update_summary(thread_id, "")


def build_runtime_history(
    *,
    request_history: list[dict[str, str]] | None,
    persisted_messages: list[dict[str, Any]],
    max_messages: int = 8,
) -> list[dict[str, str]]:
    runtime_messages = [
        {
            "role": str(message.get("role") or "assistant"),
            "content": str(message.get("content") or ""),
        }
        for message in persisted_messages[-max_messages:]
        if str(message.get("content") or "").strip()
    ]
    for item in request_history or []:
        role = str(item.get("role") or "").strip().lower()
        content = str(item.get("content") or "").strip()
        if role and content:
            runtime_messages.append({"role": role, "content": content})
    return runtime_messages[-max_messages:]


def summarize_thread(messages: list[dict[str, Any]]) -> str:
    if not messages:
        return ""
    summary_parts = []
    for message in messages[-6:]:
        role = str(message.get("role") or "assistant").strip().lower()
        content = normalize_text(message.get("content"))
        if not content:
            continue
        label = "Student" if role == "user" else "Assistant"
        summary_parts.append(f"{label}: {content[:160]}")
    return " | ".join(summary_parts)[:1000]
