from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def _format_money(amount: Any) -> str:
    try:
        value = float(amount or 0)
    except (TypeError, ValueError):
        value = 0.0
    return f"Rs. {value:,.2f}"


def _resolve_pay_period(salary_slip_data: dict[str, Any]) -> str:
    month_label = str(salary_slip_data.get("monthLabel", "") or "").strip()
    if month_label:
        return month_label

    month_key = str(salary_slip_data.get("monthKey", "") or "").strip()
    year = str(salary_slip_data.get("year", "") or "").strip()
    return month_key or year or "N/A"


def generate_salary_slip_pdf(salary_slip_data: dict[str, Any]) -> bytes:
    """Generate a professional salary slip PDF."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=20,
        alignment=1,  # Center
        spaceAfter=10,
        textColor=colors.HexColor('#1a365d'),
    )
    
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Normal'],
        fontSize=10,
        alignment=1,
        textColor=colors.grey,
    )
    
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=6,
        textColor=colors.HexColor('#2d3748'),
    )
    
    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.grey,
    )
    
    value_style = ParagraphStyle(
        'Value',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#1a202c'),
    )

    elements = []
    
    # Title
    elements.append(Paragraph("SALARY SLIP", title_style))
    elements.append(Paragraph("Code Red Educational Institution", header_style))
    elements.append(Spacer(1, 20))

    # Employee Information Table
    employee_info = [
        [Paragraph("<b>Employee Name:</b>", label_style), Paragraph(str(salary_slip_data.get('staffName', '')), value_style),
         Paragraph("<b>Employee Code:</b>", label_style), Paragraph(str(salary_slip_data.get('employeeCode', '')), value_style)],
        [Paragraph("<b>Role/Position:</b>", label_style), Paragraph(str(salary_slip_data.get('role', '')), value_style),
         Paragraph("<b>Department:</b>", label_style), Paragraph(str(salary_slip_data.get('department', '')), value_style)],
        [Paragraph("<b>Category:</b>", label_style), Paragraph(str(salary_slip_data.get('category', '')), value_style),
         Paragraph("<b>Bank Account:</b>", label_style), Paragraph(str(salary_slip_data.get('bankAccount', '')), value_style)],
    ]
    
    emp_table = Table(employee_info, colWidths=[1.3*inch, 2.0*inch, 1.3*inch, 2.0*inch])
    emp_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(emp_table)
    elements.append(Spacer(1, 15))

    pay_period = _resolve_pay_period(salary_slip_data)
    period_data = [
        [Paragraph("<b>Pay Period:</b>", label_style), 
         Paragraph(pay_period, value_style),
         Paragraph("<b>Generated On:</b>", label_style), 
         Paragraph(str(salary_slip_data.get('generatedOn', '')), value_style)],
        [Paragraph("<b>Payout Status:</b>", label_style), 
         Paragraph(str(salary_slip_data.get('payoutStatus', '')), value_style),
         Paragraph("<b>Payment Mode:</b>", label_style), 
         Paragraph(str(salary_slip_data.get('paymentMode', '')), value_style)],
    ]
    
    period_table = Table(period_data, colWidths=[1.3*inch, 2.0*inch, 1.3*inch, 2.0*inch])
    period_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(period_table)
    elements.append(Spacer(1, 15))


    # Attendance Section
    elements.append(Paragraph("Attendance Details", section_style))
    
    attendance_data = [
        [Paragraph("<b>Working Days</b>", label_style), Paragraph("<b>Payable Days</b>", label_style),
         Paragraph("<b>Paid Leave</b>", label_style), Paragraph("<b>Unpaid Leave</b>", label_style),
         Paragraph("<b>Overtime Hours</b>", label_style)],
        [str(salary_slip_data.get('workingDays', 0)), str(salary_slip_data.get('payableDays', 0)),
         str(salary_slip_data.get('paidLeaveDays', 0)), str(salary_slip_data.get('unpaidLeaveDays', 0)),
         f"{salary_slip_data.get('overtimeHours', 0)} hrs"],
    ]
    
    attendance_table = Table(attendance_data, colWidths=[1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch])
    attendance_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(attendance_table)
    elements.append(Spacer(1, 20))

    # Earnings and Deductions
    elements.append(Paragraph("Earnings & Deductions", section_style))
    
    # Base Salary
    earnings_data = [
        [Paragraph("<b>Component</b>", label_style), Paragraph("<b>Amount</b>", label_style)],
        [Paragraph("Base Salary", value_style), 
         Paragraph(_format_money(salary_slip_data.get('baseSalary', 0)), value_style)],
    ]
    
    # Add allowances
    allowances = salary_slip_data.get('allowances', [])
    if allowances:
        for allowance in allowances:
            name = allowance.get('label') or allowance.get('name') or 'Allowance'
            amount = allowance.get('amount', 0)
            earnings_data.append([
                Paragraph(str(name), value_style),
                Paragraph(_format_money(amount), value_style)
            ])
    
    # Overtime
    overtime_amount = salary_slip_data.get('overtimeAmount', 0)
    if overtime_amount > 0:
        earnings_data.append([
            Paragraph("Overtime Amount", value_style),
            Paragraph(_format_money(overtime_amount), value_style)
        ])
    
    # Gross Salary
    earnings_data.append([
        Paragraph("<b>Gross Salary</b>", label_style),
        Paragraph(f"<b>{_format_money(salary_slip_data.get('grossSalary', 0))}</b>", label_style)
    ])
    
    earnings_table = Table(earnings_data, colWidths=[4.0*inch, 2.0*inch])
    earnings_table.setStyle(TableStyle([
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#c6f6d5')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    # Deductions
    deductions_data = [
        [Paragraph("<b>Component</b>", label_style), Paragraph("<b>Amount</b>", label_style)],
    ]
    
    unpaid_leave = salary_slip_data.get('unpaidLeaveDeduction', 0)
    if unpaid_leave > 0:
        deductions_data.append([
            Paragraph("Unpaid Leave Deduction", value_style),
            Paragraph(_format_money(unpaid_leave), value_style)
        ])
    else:
        deductions_data.append([
            Paragraph("No deductions", value_style),
            Paragraph(_format_money(0), value_style)
        ])
    
    # Total Deductions
    total_deductions = salary_slip_data.get('totalDeductions', 0)
    deductions_data.append([
        Paragraph("<b>Total Deductions</b>", label_style),
        Paragraph(f"<b>{_format_money(total_deductions)}</b>", label_style)
    ])
    
    deductions_table = Table(deductions_data, colWidths=[4.0*inch, 2.0*inch])
    deductions_table.setStyle(TableStyle([
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fed7d7')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))

    # Combine Earnings and Deductions side by side
    combined_data = [[earnings_table, deductions_table]]
    combined_table = Table(combined_data, colWidths=[3.5*inch, 3.5*inch])
    combined_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(combined_table)
    elements.append(Spacer(1, 25))

    # Net Salary Box
    net_salary = salary_slip_data.get('netSalary', 0)
    net_data = [
        [Paragraph(f"<b>NET SALARY: {_format_money(net_salary)}</b>", ParagraphStyle(
            'Net',
            parent=styles['Normal'],
            fontSize=14,
            textColor=colors.HexColor('#1a365d'),
            alignment=1,
        ))]
    ]
    net_table = Table(net_data, colWidths=[7.0*inch])
    net_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#bee3f8')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ('ROUNDEDCORNERS', [5, 5, 5, 5]),
    ]))
    elements.append(net_table)
    elements.append(Spacer(1, 30))

    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        alignment=1,
        textColor=colors.grey,
    )
    elements.append(Paragraph("This is a computer-generated salary slip and does not require a signature.", footer_style))
    elements.append(Paragraph(f"Slip ID: {salary_slip_data.get('id', '')} | Generated: {salary_slip_data.get('generatedOn', '')}", footer_style))

    doc.build(elements)
    pdf_content = buffer.getvalue()
    buffer.close()
    return pdf_content
