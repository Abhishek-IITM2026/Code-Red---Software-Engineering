from __future__ import annotations

import csv
import zipfile
from io import BytesIO, StringIO
from typing import Any
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from ..extensions import db
from ..models import FinancialTransaction


def create_financial_transaction(
    *,
    transaction_type: str,
    category: str,
    direction: str,
    amount: float,
    payment_method: str,
    status: str = "completed",
    reference_type: str | None = None,
    reference_id: str | None = None,
    related_user_id: int | None = None,
    counterparty_name: str | None = None,
    description: str | None = None,
    metadata: dict[str, Any] | None = None,
    occurred_at=None,
    created_by: int | None = None,
) -> FinancialTransaction:
    next_id = int(db.session.query(db.func.coalesce(db.func.max(FinancialTransaction.id), 0)).scalar() or 0) + 1
    transaction = FinancialTransaction(
        transaction_code=f"FTX-{next_id:06d}",
        transaction_type=transaction_type,
        category=category,
        direction=direction,
        amount=float(amount or 0),
        payment_method=payment_method,
        status=status,
        reference_type=reference_type,
        reference_id=reference_id,
        related_user_id=related_user_id,
        counterparty_name=counterparty_name,
        description=description,
        metadata_json=metadata or {},
        occurred_at=occurred_at,
        created_by=created_by,
    )
    db.session.add(transaction)
    db.session.flush()
    return transaction


def export_transactions_csv(transactions: list[FinancialTransaction]) -> str:
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "Transaction Code",
            "Type",
            "Category",
            "Direction",
            "Amount",
            "Currency",
            "Payment Method",
            "Status",
            "Reference Type",
            "Reference ID",
            "Counterparty",
            "Occurred At",
            "Description",
        ]
    )
    for transaction in transactions:
        writer.writerow(
            [
                transaction.transaction_code,
                transaction.transaction_type,
                transaction.category,
                transaction.direction,
                f"{transaction.amount:.2f}",
                transaction.currency,
                transaction.payment_method,
                transaction.status,
                transaction.reference_type or "",
                transaction.reference_id or "",
                transaction.counterparty_name or "",
                transaction.occurred_at.isoformat() if transaction.occurred_at else "",
                transaction.description or "",
            ]
        )
    return buffer.getvalue()


def export_transactions_pdf(transactions: list[FinancialTransaction], title: str = "Financial Transaction Report") -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=0.4 * inch, leftMargin=0.4 * inch, topMargin=0.4 * inch)
    styles = getSampleStyleSheet()
    elements = [Paragraph(title, styles["Heading1"]), Spacer(1, 12)]

    rows = [["Code", "Type", "Category", "Amount", "Method", "Status"]]
    for transaction in transactions:
        rows.append(
            [
                transaction.transaction_code,
                transaction.transaction_type,
                transaction.category,
                f"Rs. {transaction.amount:,.2f}",
                transaction.payment_method,
                transaction.status,
            ]
        )

    table = Table(rows, repeatRows=1, colWidths=[1.1 * inch, 1.0 * inch, 1.4 * inch, 1.2 * inch, 1.1 * inch, 1.0 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dbeafe")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ]
        )
    )
    elements.append(table)
    doc.build(elements)
    content = buffer.getvalue()
    buffer.close()
    return content


def export_transactions_xlsx(transactions: list[FinancialTransaction]) -> bytes:
    rows = [
        [
            "Transaction Code",
            "Type",
            "Category",
            "Direction",
            "Amount",
            "Currency",
            "Payment Method",
            "Status",
            "Reference Type",
            "Reference ID",
            "Counterparty",
            "Occurred At",
            "Description",
        ]
    ]
    for transaction in transactions:
        rows.append(
            [
                transaction.transaction_code,
                transaction.transaction_type,
                transaction.category,
                transaction.direction,
                f"{transaction.amount:.2f}",
                transaction.currency,
                transaction.payment_method,
                transaction.status,
                transaction.reference_type or "",
                transaction.reference_id or "",
                transaction.counterparty_name or "",
                transaction.occurred_at.isoformat() if transaction.occurred_at else "",
                transaction.description or "",
            ]
        )

    def col_name(index: int) -> str:
        result = ""
        while index > 0:
            index, remainder = divmod(index - 1, 26)
            result = chr(65 + remainder) + result
        return result

    sheet_rows: list[str] = []
    for row_index, row in enumerate(rows, start=1):
        cells: list[str] = []
        for col_index, value in enumerate(row, start=1):
            ref = f"{col_name(col_index)}{row_index}"
            cell_type = "n" if col_index == 5 and row_index > 1 else "inlineStr"
            if cell_type == "n":
                cells.append(f'<c r="{ref}" t="n"><v>{escape(str(value))}</v></c>')
            else:
                cells.append(f'<c r="{ref}" t="inlineStr"><is><t>{escape(str(value))}</t></is></c>')
        sheet_rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')

    worksheet_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(sheet_rows)}</sheetData>'
        '</worksheet>'
    )
    workbook_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<sheets><sheet name="Transactions" sheetId="1" r:id="rId1"/></sheets>'
        '</workbook>'
    )
    workbook_rels_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        '</Relationships>'
    )
    root_rels_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        '</Relationships>'
    )
    content_types_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        '</Types>'
    )
    styles_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>'
        '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>'
        '<borders count="1"><border/></borders>'
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>'
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
        '</styleSheet>'
    )

    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types_xml)
        archive.writestr("_rels/.rels", root_rels_xml)
        archive.writestr("xl/workbook.xml", workbook_xml)
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels_xml)
        archive.writestr("xl/worksheets/sheet1.xml", worksheet_xml)
        archive.writestr("xl/styles.xml", styles_xml)
    content = buffer.getvalue()
    buffer.close()
    return content
