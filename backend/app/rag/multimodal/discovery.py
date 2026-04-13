from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .runtime import SUPPORTED_SOURCE_EXTENSIONS, compute_sha256, normalize_week_label, parse_week_number


@dataclass(slots=True)
class DiscoveredSource:
    source_key: str
    absolute_path: Path
    relative_path: str
    class_name: str
    subject: str
    week: str
    week_number: int | None
    source_file: str
    extension: str
    file_hash: str


def discover_sources(
    *,
    scan_root: str | Path,
    source_path: str | Path | None = None,
) -> dict[str, Any]:
    root = Path(scan_root).resolve()
    target = Path(source_path).resolve() if source_path else root
    supported: list[DiscoveredSource] = []
    unsupported: list[dict[str, str]] = []

    if not target.exists():
        return {"supported": supported, "unsupported": unsupported}

    if target.is_file():
        candidates = [target]
    else:
        candidates = sorted(path for path in target.rglob("*") if path.is_file())

    for candidate in candidates:
        try:
            relative = candidate.resolve().relative_to(root)
        except ValueError:
            unsupported.append(
                {
                    "path": str(candidate),
                    "reason": "Source is outside the configured RAG source root.",
                }
            )
            continue

        parts = relative.parts
        if len(parts) < 4:
            unsupported.append(
                {
                    "path": str(relative),
                    "reason": "Expected path structure <class>/<subject>/<week>/<file>.",
                }
            )
            continue

        extension = candidate.suffix.lower()
        if extension not in SUPPORTED_SOURCE_EXTENSIONS:
            unsupported.append(
                {
                    "path": str(relative),
                    "reason": f"Unsupported extension {extension or '<none>'}.",
                }
            )
            continue

        class_name, subject, week = parts[0], parts[1], parts[2]
        source_file = "/".join(parts[3:])
        supported.append(
            DiscoveredSource(
                source_key=str(relative).replace("\\", "/"),
                absolute_path=candidate.resolve(),
                relative_path=str(relative).replace("\\", "/"),
                class_name=class_name,
                subject=subject,
                week=normalize_week_label(week) or week,
                week_number=parse_week_number(week),
                source_file=source_file,
                extension=extension,
                file_hash=compute_sha256(candidate),
            )
        )

    return {"supported": supported, "unsupported": unsupported}
