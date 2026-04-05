from pathlib import Path


INPUT_PATH = Path(__file__).with_name("BACKEND_TEST_SUMMARY.md")
OUTPUT_PATH = Path(__file__).with_name("BACKEND_TEST_SUMMARY.pdf")


def _escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _wrap_text(text: str, width: int = 95) -> list[str]:
    wrapped: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if not line:
            wrapped.append("")
            continue

        if line.startswith("#"):
            line = line.lstrip("#").strip().upper()
        elif line.startswith("- "):
            line = f"* {line[2:]}"

        words = line.split()
        current = ""
        for word in words:
            candidate = word if not current else f"{current} {word}"
            if len(candidate) <= width:
                current = candidate
            else:
                wrapped.append(current)
                current = word
        if current:
            wrapped.append(current)
    return wrapped


def _paginate(lines: list[str], lines_per_page: int = 46) -> list[list[str]]:
    pages: list[list[str]] = []
    current: list[str] = []
    for line in lines:
        current.append(line)
        if len(current) == lines_per_page:
            pages.append(current)
            current = []
    if current:
        pages.append(current)
    return pages


def _build_content_stream(page_lines: list[str]) -> bytes:
    y = 800
    leading = 16
    chunks = ["BT", "/F1 10 Tf", f"72 {y} Td", f"{leading} TL"]
    first = True
    for line in page_lines:
        escaped = _escape_pdf_text(line)
        if first:
            chunks.append(f"({escaped}) Tj")
            first = False
        else:
            chunks.append("T*")
            chunks.append(f"({escaped}) Tj")
    chunks.append("ET")
    return "\n".join(chunks).encode("latin-1", errors="replace")


def build_pdf(text: str) -> bytes:
    lines = _wrap_text(text)
    pages = _paginate(lines)

    objects: list[bytes] = []

    def add_object(data: bytes) -> int:
        objects.append(data)
        return len(objects)

    font_id = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    page_ids: list[int] = []
    content_ids: list[int] = []
    page_object_templates: list[bytes] = []

    for page_lines in pages:
        stream = _build_content_stream(page_lines)
        content_id = add_object(
            f"<< /Length {len(stream)} >>\nstream\n".encode("latin-1") + stream + b"\nendstream"
        )
        content_ids.append(content_id)
        page_object_templates.append(
            f"<< /Type /Page /Parent PAGES_ID 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>".encode(
                "latin-1"
            )
        )
        page_ids.append(0)

    kids_placeholder = " ".join("PAGE_ID 0 R" for _ in page_object_templates)
    pages_id = add_object(f"<< /Type /Pages /Kids [{kids_placeholder}] /Count {len(page_object_templates)} >>".encode("latin-1"))

    for index, template in enumerate(page_object_templates):
        page_obj = template.replace(b"PAGES_ID", str(pages_id).encode("latin-1"))
        page_id = add_object(page_obj)
        page_ids[index] = page_id

    # Replace placeholders inside the /Kids array
    kids_actual = " ".join(f"{page_id} 0 R" for page_id in page_ids)
    objects[pages_id - 1] = f"<< /Type /Pages /Kids [{kids_actual}] /Count {len(page_ids)} >>".encode("latin-1")

    catalog_id = add_object(f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode("latin-1"))

    result = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(result))
        result.extend(f"{index} 0 obj\n".encode("latin-1"))
        result.extend(obj)
        result.extend(b"\nendobj\n")

    xref_offset = len(result)
    result.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    result.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        result.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))
    result.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode(
            "latin-1"
        )
    )
    return bytes(result)


def main() -> None:
    text = INPUT_PATH.read_text(encoding="utf-8")
    pdf_bytes = build_pdf(text)
    OUTPUT_PATH.write_bytes(pdf_bytes)
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
