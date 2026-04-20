from flask import Blueprint, g, request, send_file
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import Attendance, Assignment, CourseEnrollment, FacultySubjectAssignment, Mark, Parent, Student, Subject
from ...schemas import CoursePaymentRequest, parse_json
from ...services.courses import list_program_courses_for_class, record_course_payment, serialize_course_for_student
from ...services.query import (
    get_attendance_stats,
    get_enrollment_class_scope_ids,
    get_performance_summary,
    get_student_subjects,
)



parent_bp = Blueprint("parent", __name__)


def _get_parent():
    parent = Parent.query.filter_by(user_id=g.current_user.id).first()
    if parent is None:
        raise ApiError(404, "PARENT_NOT_FOUND", "Parent profile was not found.")
    return parent


def _child_attendance_rows(child_id: int):
    subjects = {subject["id"]: subject["name"] for subject in get_student_subjects(child_id)}
    rows = []
    for subject_id, subject_name in subjects.items():
        records = Attendance.query.filter_by(student_id=child_id, subject_id=int(subject_id)).all()
        total = len(records)
        attended = len([item for item in records if item.status in {"PRESENT", "LATE"}])
        rows.append(
            {
                "subject": subject_name,
                "attended": str(attended),
                "total": str(total),
                "percentage": f"{round((attended / total) * 100) if total else 0}%",
            }
        )
    return rows


def _child_performance_rows(child_id: int):
    subjects = {subject["id"]: subject for subject in get_student_subjects(child_id)}
    child = db.session.get(Student, child_id)
    enrollment = child.current_enrollment() if child is not None else None
    class_id = enrollment.class_id if enrollment is not None else None
    rows = []
    for subject_id, subject in subjects.items():
        marks = Mark.query.filter_by(student_id=child_id, subject_id=int(subject_id)).all()
        average = round(sum(mark.marks_obtained for mark in marks) / len(marks), 2) if marks else 0
        assignment_query = FacultySubjectAssignment.query.filter_by(subject_id=int(subject_id))
        if class_id is not None:
            assignment_query = assignment_query.filter_by(class_id=class_id)
        faculty_assignment = assignment_query.first()
        teacher_name = ""
        if faculty_assignment and faculty_assignment.faculty and faculty_assignment.faculty.user:
            teacher_name = f"{faculty_assignment.faculty.user.first_name} {faculty_assignment.faculty.user.last_name}"
        rows.append(
            {
                "id": str(subject_id),
                "name": subject["name"],
                "score": f"{round(average)}%",
                "teacher": teacher_name,
                "report": [
                    f"Current average score in {subject['name']} is {round(average)}%.",
                    f"Total assessments recorded: {len(marks)}.",
                    "Performance summary generated from recorded marks.",
                ],
                "syllabus": [assignment.title for assignment in Assignment.query.filter_by(subject_id=int(subject_id)).all()] or ["Syllabus updates will appear here."],
            }
        )
    return rows


def _child_fee_rows(child):
    rows = []
    enrollments = (
        CourseEnrollment.query.filter_by(student_id=child.id)
        .order_by(CourseEnrollment.created_at.desc(), CourseEnrollment.id.desc())
        .all()
    )
    for enrollment in enrollments:
        course_title = enrollment.course.name if enrollment.course is not None else "Course"
        for payment in enrollment.payments:
            rows.append(
                {
                    "month": f"{course_title} - Receipt {payment.receipt_number}",
                    "amount": f"Rs. {payment.amount:,.2f}",
                    "status": "Paid",
                    "date": payment.paid_at.date().isoformat(),
                }
            )
        if enrollment.balance_due > 0:
            rows.append(
                {
                    "month": f"{course_title} - Outstanding",
                    "amount": f"Rs. {enrollment.balance_due:,.2f}",
                    "status": "Pending",
                    "date": enrollment.course.start_date or enrollment.created_at.date().isoformat(),
                }
            )
    return rows


def _child_faculty_contacts(child_id: int):
    child = db.session.get(Student, child_id)
    enrollment = child.current_enrollment() if child is not None else None
    class_id = enrollment.class_id if enrollment is not None else None
    contacts = []
    for subject in get_student_subjects(child_id):
        assignment_query = FacultySubjectAssignment.query.filter_by(subject_id=int(subject["id"]))
        if class_id is not None:
            assignment_query = assignment_query.filter_by(class_id=class_id)
        assignment = assignment_query.first()
        if assignment and assignment.faculty and assignment.faculty.user:
            phone = assignment.faculty.user.contact_profile.phone_number if assignment.faculty.user.contact_profile else "Not available"
            contacts.append(
                {
                    "subject": subject["name"],
                    "faculty": f"{assignment.faculty.user.first_name} {assignment.faculty.user.last_name}",
                    "phone": phone,
                }
            )
    return contacts


def _child_upcoming_courses(child):
    enrollment = child.current_enrollment()
    if enrollment is None:
        return []
    class_scope_ids = get_enrollment_class_scope_ids(enrollment)
    courses = list_program_courses_for_class(class_scope_ids)
    return [serialize_course_for_student(course, child) for course in courses]


def _fee_invoice_payload(enrollment: CourseEnrollment):
    course = enrollment.course
    student = enrollment.student
    student_name = ""
    if student is not None and student.user is not None:
        student_name = f"{student.user.first_name} {student.user.last_name}".strip()

    due_date = (course.start_date if course is not None and course.start_date else enrollment.created_at.date().isoformat())
    status = "paid" if enrollment.balance_due <= 0 else "partially_paid" if enrollment.amount_paid > 0 else "pending"
    return {
        "id": str(enrollment.id),
        "studentId": str(enrollment.student_id),
        "studentName": student_name,
        "invoiceNumber": f"CRS-{enrollment.id:05d}",
        "invoiceDate": enrollment.created_at.date().isoformat(),
        "dueDate": due_date,
        "description": course.name if course is not None else "Course enrollment",
        "amount": float(enrollment.total_fee or 0),
        "paidAmount": float(enrollment.amount_paid or 0),
        "pendingAmount": float(enrollment.balance_due or 0),
        "status": status,
        "createdAt": enrollment.created_at.isoformat(),
        "updatedAt": enrollment.updated_at.isoformat(),
    }


@parent_bp.get("/children")
@roles_required("parent")
def list_children():
    parent = _get_parent()
    child = parent.student.to_dict()
    return success_response([child])


@parent_bp.get("/children/<int:child_id>")
@roles_required("parent")
def get_child(child_id: int):
    parent = _get_parent()
    if parent.student_id != child_id:
        raise ApiError(403, "FORBIDDEN", "You can only access linked children.")
    return success_response(parent.student.to_dict())


@parent_bp.get("/children/<int:child_id>/dashboard")
@roles_required("parent")
def get_child_dashboard(child_id: int):
    parent = _get_parent()
    if parent.student_id != child_id:
        raise ApiError(403, "FORBIDDEN", "You can only access linked children.")
    child = parent.student
    return success_response(
        {
            "child": child.to_dict(),
            "attendance": get_attendance_stats(child_id),
            "attendanceRows": _child_attendance_rows(child_id),
            "performance": get_performance_summary(child_id),
            "performanceSubjects": _child_performance_rows(child_id),
            "feeTransactions": _child_fee_rows(child),
            "facultyContacts": _child_faculty_contacts(child_id),
            "upcomingCourses": _child_upcoming_courses(child),
        }
    )


@parent_bp.get("/children/<int:child_id>/attendance")
@roles_required("parent")
def get_child_attendance(child_id: int):
    parent = _get_parent()
    if parent.student_id != child_id:
        raise ApiError(403, "FORBIDDEN", "You can only access linked children.")
    return success_response(get_attendance_stats(child_id))


@parent_bp.get("/children/<int:child_id>/attendance-rows")
@roles_required("parent")
def get_child_attendance_rows(child_id: int):
    parent = _get_parent()
    if parent.student_id != child_id:
        raise ApiError(403, "FORBIDDEN", "You can only access linked children.")
    return success_response(_child_attendance_rows(child_id))


@parent_bp.get("/children/<int:child_id>/performance")
@roles_required("parent")
def get_child_performance(child_id: int):
    parent = _get_parent()
    if parent.student_id != child_id:
        raise ApiError(403, "FORBIDDEN", "You can only access linked children.")
    return success_response(get_performance_summary(child_id))


@parent_bp.get("/students/<int:child_id>/fees")
@roles_required("parent")
def get_child_fee_invoices(child_id: int):
    parent = _get_parent()
    if parent.student_id != child_id:
        raise ApiError(403, "FORBIDDEN", "You can only access linked children.")
    enrollments = (
        CourseEnrollment.query.filter_by(student_id=child_id)
        .order_by(CourseEnrollment.created_at.desc(), CourseEnrollment.id.desc())
        .all()
    )
    return success_response([_fee_invoice_payload(enrollment) for enrollment in enrollments])


@parent_bp.get("/fees/<int:invoice_id>")
@roles_required("parent")
def get_fee_invoice(invoice_id: int):
    parent = _get_parent()
    enrollment = CourseEnrollment.query.filter_by(id=invoice_id, student_id=parent.student_id).first()
    if enrollment is None:
        raise ApiError(404, "FEE_INVOICE_NOT_FOUND", "Fee invoice was not found.")
    return success_response(_fee_invoice_payload(enrollment))


@parent_bp.get("/fees/<int:invoice_id>/download")
@roles_required("parent")
def download_fee_invoice(invoice_id: int):
    parent = _get_parent()
    enrollment = CourseEnrollment.query.filter_by(id=invoice_id, student_id=parent.student_id).first()
    if enrollment is None:
        raise ApiError(404, "FEE_INVOICE_NOT_FOUND", "Fee invoice was not found.")
    
    pdf_buffer = _generate_fee_invoice_pdf(enrollment)
    filename = f"Invoice_CRS{invoice_id:05d}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return send_file(
        pdf_buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=filename
    )


@parent_bp.post("/fees/<int:invoice_id>/payment")
@roles_required("parent")
def record_fee_payment(invoice_id: int):
    parent = _get_parent()
    enrollment = CourseEnrollment.query.filter_by(id=invoice_id, student_id=parent.student_id).first()
    if enrollment is None:
        raise ApiError(404, "FEE_INVOICE_NOT_FOUND", "Fee invoice was not found.")
    payload = parse_json(CoursePaymentRequest, request.get_json())
    payment = record_course_payment(
        enrollment=enrollment,
        actor=g.current_user,
        amount=payload.amount,
        payment_method=payload.payment_method,
        reference_number=payload.reference_number,
    )
    db.session.commit()
    return success_response(
        {
            "invoice": _fee_invoice_payload(enrollment),
            "payment": payment.to_dict(),
        },
        status_code=201,
    )


def _format_date_for_pdf(date_value, format_str: str = '%B %d, %Y') -> str:
    """Safely format a date that could be a datetime object or string."""
    if date_value is None:
        return 'N/A'
    if isinstance(date_value, str):
        return date_value
    if hasattr(date_value, 'strftime'):
        return date_value.strftime(format_str)
    return str(date_value)


def _generate_fee_invoice_pdf(enrollment: CourseEnrollment) -> BytesIO:
    """Generate a professional PDF invoice for course enrollment fees."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#374151'),
        spaceAfter=8,
        spaceBefore=8,
        fontName='Helvetica-Bold'
    )
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#4b5563'),
        leading=12
    )
    
    # Header Section
    institute_name = Paragraph("CODE RED COACHING INSTITUTE", title_style)
    elements.append(institute_name)
    
    subtitle = Paragraph("Professional Development & Skill Enhancement", 
                        ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=9, 
                                     textColor=colors.HexColor('#6b7280'), alignment=TA_CENTER))
    elements.append(subtitle)
    elements.append(Spacer(1, 0.2*inch))
    
    # Divider line
    divider_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e5e7eb')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
    ])
    divider = Table([['']],colWidths=[7*inch])
    divider.setStyle(divider_style)
    elements.append(divider)
    elements.append(Spacer(1, 0.1*inch))
    
    # Invoice Details Header
    invoice_info_data = [
        [Paragraph(f"<b>INVOICE</b>", heading_style), '', 
         Paragraph(f"<b>Invoice #:</b> CRS{enrollment.id:05d}", normal_style)],
        ['', '', 
         Paragraph(f"<b>Invoice Date:</b> {_format_date_for_pdf(enrollment.created_at)}", normal_style)],
        ['', '', 
         Paragraph(f"<b>Due Date:</b> {_format_date_for_pdf(enrollment.course.start_date if enrollment.course.start_date else enrollment.created_at)}", normal_style)],
    ]
    invoice_info_table = Table(invoice_info_data, colWidths=[1.5*inch, 2*inch, 3.5*inch])
    invoice_info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
    ]))
    elements.append(invoice_info_table)
    elements.append(Spacer(1, 0.15*inch))
    
    # Student/Course Information Section
    student_name = f"{enrollment.student.user.first_name} {enrollment.student.user.last_name}".strip() if enrollment.student and enrollment.student.user else "N/A"
    student_email = enrollment.student.user.email if enrollment.student and enrollment.student.user else "N/A"
    
    student_course_data = [
        [
            Paragraph(f"<b>STUDENT INFORMATION</b><br/><br/>" +
                     f"<b>Name:</b> {student_name}<br/>" +
                     f"<b>ID:</b> {enrollment.student.id}<br/>" +
                     f"<b>Email:</b> {student_email}<br/>",
                     normal_style),
            Paragraph(f"<b>COURSE INFORMATION</b><br/><br/>" +
                     f"<b>Course:</b> {enrollment.course.name}<br/>" +
                     f"<b>Code:</b> {enrollment.course.code or 'N/A'}<br/>" +
                     f"<b>Mode:</b> {enrollment.course.mode or 'N/A'}<br/>",
                     normal_style)
        ]
    ]
    student_course_table = Table(student_course_data, colWidths=[3.5*inch, 3.5*inch])
    student_course_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(student_course_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Payment Breakdown Section
    elements.append(Paragraph("<b>PAYMENT BREAKDOWN</b>", heading_style))
    
    payment_data = [
        ['Description', 'Amount'],
        [enrollment.course.name, f"₹ {enrollment.total_fee:,.2f}"],
        ['', ''],
        ['<b>Total Amount Due:</b>', f"<b>₹ {enrollment.total_fee:,.2f}</b>"],
        ['<b>Amount Paid:</b>', f"<b>₹ {enrollment.amount_paid:,.2f}</b>"],
        ['<b>Balance Due:</b>', f"<b>₹ {enrollment.balance_due:,.2f}</b>"],
    ]
    
    payment_table = Table(payment_data, colWidths=[5*inch, 2*inch])
    payment_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 2), (-1, 2), colors.white),
        ('GRID', (0, 3), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#f3f4f6')),
        ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#f3f4f6')),
        ('BACKGROUND', (0, 5), (-1, 5), colors.HexColor('#dbeafe')),
        ('FONTNAME', (0, 3), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 3), (-1, -1), 10),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('RIGHTPADDING', (1, 0), (1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(payment_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Payment Status
    status_map = {
        'paid': ('PAID', colors.HexColor('#10b981')),
        'partially_paid': ('PARTIALLY PAID', colors.HexColor('#f59e0b')),
        'pending': ('PENDING', colors.HexColor('#ef4444'))
    }
    
    total_paid = float(enrollment.amount_paid)
    total_amount = float(enrollment.total_fee)
    if total_paid >= total_amount:
        status_text, status_color = status_map['paid']
    elif total_paid > 0:
        status_text, status_color = status_map['partially_paid']
    else:
        status_text, status_color = status_map['pending']
    
    status_para = Paragraph(f"<b>Payment Status: <font color='{status_color.hexval()}'>{status_text}</font></b>", normal_style)
    elements.append(status_para)
    elements.append(Spacer(1, 0.3*inch))
    
    # Footer
    footer_data = [
        [''],
        [Paragraph("Thank you for choosing CODE RED COACHING INSTITUTE!", 
                  ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, 
                               textColor=colors.HexColor('#6b7280'), alignment=TA_CENTER))],
        [Paragraph("For inquiries, contact: support@coderedcoaching.com | Phone: +91-XXX-XXXX-XXXX",
                  ParagraphStyle('FooterSmall', parent=styles['Normal'], fontSize=8,
                               textColor=colors.HexColor('#9ca3af'), alignment=TA_CENTER))],
    ]
    footer_table = Table(footer_data, colWidths=[7*inch])
    footer_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(footer_table)
    elements.append(Spacer(1, 0.1*inch))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer


# ============================================================================
# COMMUNICATION & MESSAGES ENDPOINTS
# ============================================================================

@parent_bp.get("/messages")
@roles_required("parent")
def get_parent_messages():
    """Get all messages for parent - including teacher communications"""
    parent = _get_parent()
    # TODO: Implement message fetching from database
    # For now, return empty list structure
    return success_response([])


@parent_bp.post("/messages")
@roles_required("parent")
def send_parent_message():
    """Send message to faculty/administration"""
    parent = _get_parent()
    payload = parse_json(dict, request.get_json())
    # TODO: Implement message sending
    return success_response({"status": "sent"}, status_code=201)


@parent_bp.get("/children/<int:child_id>/faculty-contacts")
@roles_required("parent")
def get_child_faculty_contacts(child_id: int):
    """Get all faculty contacts assigned to child's class"""
    parent = _get_parent()
    child = db.session.get(Student, child_id)
    if not child:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student not found")
    
    enrollment = child.current_enrollment()
    if not enrollment:
        return success_response([])
    
    # Get all faculty assignments for child's class
    assignments = FacultySubjectAssignment.query.filter_by(
        class_id=enrollment.class_id
    ).all()
    
    contacts = []
    for assignment in assignments:
        if assignment.faculty and assignment.faculty.user and assignment.subject:
            phone = "N/A"
            if assignment.faculty.user.contact_profile:
                phone = assignment.faculty.user.contact_profile.phone_number or "N/A"
            
            contacts.append({
                "id": str(assignment.id),
                "subject": assignment.subject.name,
                "faculty": f"{assignment.faculty.user.first_name} {assignment.faculty.user.last_name}".strip(),
                "email": assignment.faculty.user.email,
                "phone": phone,
            })
    
    return success_response(contacts)


# ============================================================================
# ENHANCED SUBJECT REPORT ENDPOINTS (COACHING INSTITUTE SPECIFIC)
# ============================================================================

@parent_bp.get("/children/<int:child_id>/subject/<int:subject_id>/detailed-report")
@roles_required("parent")
def get_detailed_subject_report(child_id: int, subject_id: int):
    """Get detailed coaching-institute style subject report"""
    parent = _get_parent()
    student = db.session.get(Student, child_id)
    if not student:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student not found")
    
    from ...models import Subject
    subject = db.session.get(Subject, subject_id)
    if not subject:
        raise ApiError(404, "SUBJECT_NOT_FOUND", "Subject not found")
    
    # Get marks for this student and subject
    marks = Mark.query.filter_by(student_id=child_id, subject_id=subject_id).all()
    
    # Calculate statistics
    total_marks = [m.marks_obtained for m in marks if m.marks_obtained]
    average_score = round(sum(total_marks) / len(total_marks), 2) if total_marks else 0
    highest_score = max(total_marks) if total_marks else 0
    lowest_score = min(total_marks) if total_marks else 0
    
    # Get improvement trend
    improvement_trend = 0
    if len(total_marks) > 1:
        improvement_trend = round((total_marks[-1] - total_marks[0]) / total_marks[0] * 100, 2) if total_marks[0] != 0 else 0
    
    # Get faculty info
    enrollment = student.current_enrollment()
    faculty_name = "TBD"
    if enrollment:
        assignment = FacultySubjectAssignment.query.filter_by(
            class_id=enrollment.class_id,
            subject_id=subject_id
        ).first()
        if assignment and assignment.faculty and assignment.faculty.user:
            faculty_name = f"{assignment.faculty.user.first_name} {assignment.faculty.user.last_name}".strip()
    
    # Coaching institute specific analytics
    performance_level = "Excellent" if average_score >= 85 else ("Good" if average_score >= 70 else ("Average" if average_score >= 50 else "Needs Improvement"))
    
    recommendations = []
    if average_score < 50:
        recommendations.append("Urgent attention required - Schedule session with faculty")
        recommendations.append("Practice previous year question papers")
        recommendations.append("Focus on concept clarity")
    elif average_score < 70:
        recommendations.append("Regular practice and revision recommended")
        recommendations.append("Attempt more practice tests")
        recommendations.append("Clarify doubts with faculty")
    else:
        recommendations.append("Maintain consistent performance")
        recommendations.append("Attempt advanced problem sets")
        recommendations.append("Help peer students to strengthen concepts")
    
    return success_response({
        "subjectId": str(subject_id),
        "subjectName": subject.name,
        "facultyName": faculty_name,
        "assessmentsCount": len(marks),
        "averageScore": average_score,
        "highestScore": highest_score,
        "lowestScore": lowest_score,
        "improvementTrend": improvement_trend,
        "performanceLevel": performance_level,
        "scoreHistory": [{"score": float(m.marks_obtained), "date": m.created_at.isoformat() if hasattr(m, 'created_at') else ""} for m in marks],
        "recommendations": recommendations,
        "report": [
            f"Average score in {subject.name} is {average_score}%.",
            f"Performance level: {performance_level}.",
            f"Total assessments: {len(marks)}.",
            f"Improvement trend: {'+' if improvement_trend > 0 else ''}{improvement_trend}%.",
        ],
    })


# ============================================================================
# TIMETABLE/SCHEDULE ENDPOINTS (COACHING INSTITUTE SPECIFIC)
# ============================================================================

@parent_bp.get("/children/<int:child_id>/timetable")
@roles_required("parent")
def get_child_timetable(child_id: int):
    """Get class timetable for child (coaching institute schedule)"""
    parent = _get_parent()
    student = db.session.get(Student, child_id)
    if not student:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student not found")
    
    enrollment = student.current_enrollment()
    if not enrollment:
        return success_response([])
    
    # TODO: Fetch from timetable/schedule model if available
    # For now, return a sample coaching institute timetable
    timetable = [
        {"day": "Monday", "time": "10:00 AM - 12:00 PM", "subject": "Mathematics", "room": "A-101"},
        {"day": "Monday", "time": "1:00 PM - 3:00 PM", "subject": "English", "room": "A-102"},
        {"day": "Tuesday", "time": "10:00 AM - 12:00 PM", "subject": "Physics", "room": "B-201"},
        {"day": "Tuesday", "time": "1:00 PM - 3:00 PM", "subject": "Chemistry", "room": "B-202"},
        {"day": "Wednesday", "time": "10:00 AM - 12:00 PM", "subject": "Mathematics", "room": "A-101"},
        {"day": "Wednesday", "time": "3:00 PM - 5:00 PM", "subject": "Biology", "room": "C-301"},
        {"day": "Thursday", "time": "10:00 AM - 12:00 PM", "subject": "English", "room": "A-102"},
        {"day": "Thursday", "time": "1:00 PM - 3:00 PM", "subject": "History", "room": "A-103"},
        {"day": "Friday", "time": "10:00 AM - 12:00 PM", "subject": "Physics", "room": "B-201"},
        {"day": "Friday", "time": "2:00 PM - 4:00 PM", "subject": "Doubts Session", "room": "Library"},
        {"day": "Saturday", "time": "10:00 AM - 1:00 PM", "subject": "Full Length Test", "room": "Exam Hall"},
    ]
    
    return success_response(timetable)


# ============================================================================
# COACHING INSTITUTE SPECIFIC ANALYTICS
# ============================================================================

@parent_bp.get("/children/<int:child_id>/coaching-analytics")
@roles_required("parent")
def get_coaching_analytics(child_id: int):
    """Get comprehensive coaching institute analytics for a student"""
    parent = _get_parent()
    student = db.session.get(Student, child_id)
    if not student:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student not found")
    
    # Get attendance percentage
    attendance_records = Attendance.query.filter_by(student_id=child_id).all()
    present_count = len([a for a in attendance_records if a.status in {"PRESENT", "LATE"}])
    total_attendance = len(attendance_records)
    attendance_percentage = round((present_count / total_attendance * 100) if total_attendance else 0, 2)
    
    # Get performance summary
    marks = Mark.query.filter_by(student_id=child_id).all()
    average_marks = round(sum(m.marks_obtained for m in marks) / len(marks), 2) if marks else 0
    
    # Overall coaching institute metrics
    subjects = get_student_subjects(child_id)
    total_subjects = len(subjects)
    
    # Calculate coaching metrics
    performance_grade = "A+" if average_marks >= 90 else ("A" if average_marks >= 80 else ("B" if average_marks >= 70 else ("C" if average_marks >= 60 else "D")))
    attendance_status = "Excellent" if attendance_percentage >= 95 else ("Good" if attendance_percentage >= 85 else ("Average" if attendance_percentage >= 75 else "Poor"))
    overall_rank = "Top 10%" if average_marks >= 85 and attendance_percentage >= 90 else ("Top 25%" if average_marks >= 75 else "Average")
    
    return success_response({
        "studentId": str(child_id),
        "attendancePercentage": attendance_percentage,
        "attendanceStatus": attendance_status,
        "averageMarks": average_marks,
        "performanceGrade": performance_grade,
        "totalSubjects": total_subjects,
        "assessmentsCompleted": len(marks),
        "overallRank": overall_rank,
        "strengths": [s["name"] for s in subjects[:2]],
        "improvements": [s["name"] for s in subjects[-2:]] if len(subjects) > 2 else [],
        "coachingRecommendations": [
            "Maintain attendance above 90% for exam eligibility",
            "Schedule regular doubt clearance sessions with faculty",
            "Attempt mock tests weekly",
            "Revise concepts before each class",
            "Focus on weak areas identified in reports",
        ]
    })


@parent_bp.get("/children/<int:child_id>/progress-card")
@roles_required("parent")
def get_coaching_progress_card(child_id: int):
    """Get coaching institute style progress card for student"""
    parent = _get_parent()
    student = db.session.get(Student, child_id)
    if not student:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student not found")
    
    # Get comprehensive data
    subjects = {s["id"]: s for s in get_student_subjects(child_id)}
    marks = Mark.query.filter_by(student_id=child_id).all()
    attendance = Attendance.query.filter_by(student_id=child_id).all()
    
    # Subject-wise performance
    subject_performance = {}
    for subject_id, subject_data in subjects.items():
        subject_marks = [m.marks_obtained for m in marks if m.subject_id == int(subject_id)]
        avg = round(sum(subject_marks) / len(subject_marks), 2) if subject_marks else 0
        subject_performance[subject_data["name"]] = {
            "average": avg,
            "assessments": len(subject_marks),
            "status": "Excellent" if avg >= 80 else ("Good" if avg >= 60 else "Average")
        }
    
    # Attendance by subject
    subject_attendance = {}
    for subject_id, subject_data in subjects.items():
        subject_att = [a for a in attendance if a.subject_id == int(subject_id)]
        total = len(subject_att)
        present = len([a for a in subject_att if a.status in {"PRESENT", "LATE"}])
        subject_attendance[subject_data["name"]] = {
            "present": present,
            "total": total,
            "percentage": round((present / total * 100) if total else 0, 2)
        }
    
    return success_response({
        "studentId": str(child_id),
        "studentName": f"{student.user.first_name} {student.user.last_name}".strip() if student.user else "",
        "subjectPerformance": subject_performance,
        "subjectAttendance": subject_attendance,
        "overallStats": {
            "totalAssessments": len(marks),
            "overallAverage": round(sum(m.marks_obtained for m in marks) / len(marks), 2) if marks else 0,
            "totalAttendance": len(attendance),
            "attendancePercentage": round(len([a for a in attendance if a.status in {"PRESENT", "LATE"}]) / len(attendance) * 100 if attendance else 0, 2),
        },
    })
