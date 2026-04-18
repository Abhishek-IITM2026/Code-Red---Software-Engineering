from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import inspect, text

from ..api.errors import ApiError
from ..extensions import db
from ..models import CourseEnrollment, CoursePayment, Parent, Student, Subject, User
from .email import send_email_message


def get_primary_parent(student_id: int) -> Parent | None:
    return Parent.query.filter_by(student_id=student_id, is_primary=True).first()


def sync_legacy_courses_if_needed() -> int:
    inspector = inspect(db.engine)
    tables = set(inspector.get_table_names())
    if "courses" not in tables:
        return 0

    inserted = 0
    max_course_id = int(db.session.execute(text("SELECT COALESCE(MAX(id), 0) FROM courses")).scalar() or 0)

    if "subjects" in tables:
        legacy_subjects = db.session.execute(
            text(
                """
                SELECT id, name, code, description, is_active, created_at
                FROM subjects
                ORDER BY id
                """
            )
        ).mappings()
        for row in legacy_subjects:
            existing = db.session.execute(text("SELECT 1 FROM courses WHERE id = :id"), {"id": row["id"]}).first()
            max_course_id = max(max_course_id, int(row["id"]))
            if existing is not None:
                continue

            created_at = row["created_at"] or datetime.now(timezone.utc).replace(tzinfo=None)
            db.session.execute(
                text(
                    """
                    INSERT INTO courses (
                        id, name, code, description, is_active, class_id, created_by, status,
                        course_type, level, credits, fee_amount, installment_available,
                        max_installments, start_date, end_date, instructor, mode, seats,
                        created_at, updated_at
                    ) VALUES (
                        :id, :name, :code, :description, :is_active, NULL, NULL, :status,
                        'core', NULL, 1, 0, 0,
                        1, NULL, NULL, NULL, 'Offline', 0,
                        :created_at, :updated_at
                    )
                    """
                ),
                {
                    "id": row["id"],
                    "name": row["name"],
                    "code": row["code"],
                    "description": row["description"],
                    "is_active": bool(row["is_active"]),
                    "status": "active" if row["is_active"] else "inactive",
                    "created_at": created_at,
                    "updated_at": created_at,
                },
            )
            inserted += 1

    if "upcoming_courses" in tables:
        legacy_courses = db.session.execute(
            text(
                """
                SELECT id, title, description, class_id, start_date, end_date, instructor, mode,
                       seats, created_by, status, created_at, updated_at
                FROM upcoming_courses
                ORDER BY id
                """
            )
        ).mappings()
        for row in legacy_courses:
            duplicate = db.session.execute(
                text(
                    """
                    SELECT id
                    FROM courses
                    WHERE course_type != 'core'
                      AND name = :name
                      AND COALESCE(class_id, -1) = COALESCE(:class_id, -1)
                      AND COALESCE(start_date, '') = COALESCE(:start_date, '')
                      AND COALESCE(end_date, '') = COALESCE(:end_date, '')
                    LIMIT 1
                    """
                ),
                {
                    "name": row["title"],
                    "class_id": row["class_id"],
                    "start_date": row["start_date"],
                    "end_date": row["end_date"],
                },
            ).first()
            if duplicate is not None:
                continue

            max_course_id += 1
            created_at = row["created_at"] or datetime.now(timezone.utc).replace(tzinfo=None)
            updated_at = row["updated_at"] or created_at
            status = (row["status"] or "upcoming").strip().lower()
            db.session.execute(
                text(
                    """
                    INSERT INTO courses (
                        id, name, code, description, is_active, class_id, created_by, status,
                        course_type, level, credits, fee_amount, installment_available,
                        max_installments, start_date, end_date, instructor, mode, seats,
                        created_at, updated_at
                    ) VALUES (
                        :id, :name, NULL, :description, :is_active, :class_id, :created_by, :status,
                        'program', NULL, 1, 0, 0,
                        1, :start_date, :end_date, :instructor, :mode, :seats,
                        :created_at, :updated_at
                    )
                    """
                ),
                {
                    "id": max_course_id,
                    "name": row["title"],
                    "description": row["description"],
                    "is_active": status != "inactive",
                    "class_id": row["class_id"],
                    "created_by": row["created_by"],
                    "status": status,
                    "start_date": row["start_date"],
                    "end_date": row["end_date"],
                    "instructor": row["instructor"],
                    "mode": row["mode"] or "Offline",
                    "seats": row["seats"] or 0,
                    "created_at": created_at,
                    "updated_at": updated_at,
                },
            )
            inserted += 1

    if inserted:
        db.session.commit()
    return inserted


def sync_schema_compatibility_if_needed() -> int:
    if db.engine.dialect.name != "sqlite":
        return 0

    inspector = inspect(db.engine)
    tables = set(inspector.get_table_names())
    statements: list[str] = []
    applied = 0

    expected_columns = {
        "assessments": {"week": "ALTER TABLE assessments ADD COLUMN week VARCHAR(50)"},
        "assignments": {"week": "ALTER TABLE assignments ADD COLUMN week VARCHAR(50)"},
        "salary_slips": {"user_id": "ALTER TABLE salary_slips ADD COLUMN user_id INTEGER"},
    }

    for table_name, column_map in expected_columns.items():
        if table_name not in tables:
            continue
        existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
        for column_name, statement in column_map.items():
            if column_name not in existing_columns:
                statements.append(statement)

    for statement in statements:
        db.session.execute(text(statement))
        applied += 1

    if {"users", "administration_staff", "salary_slips"} <= tables:
        admin_staff_columns = {column["name"] for column in inspector.get_columns("administration_staff")}
        salary_slip_columns = {column["name"] for column in inspector.get_columns("salary_slips")}
        if {"user_id", "employee_code"} <= admin_staff_columns and "user_id" in salary_slip_columns:
            linked_salary_slips = db.session.execute(
                text(
                    """
                    UPDATE salary_slips
                    SET user_id = (
                        SELECT a.user_id
                        FROM administration_staff a
                        WHERE a.employee_code = salary_slips.employee_code
                        LIMIT 1
                    )
                    WHERE user_id IS NULL
                      AND EXISTS (
                        SELECT 1
                        FROM administration_staff a
                        WHERE a.employee_code = salary_slips.employee_code
                    )
                    """
                )
            )
            applied += int(linked_salary_slips.rowcount or 0)
        if {"user_id", "employee_code"} <= admin_staff_columns and {"user_id", "employee_code"} <= salary_slip_columns:
            missing_staff_profiles = db.session.execute(
                text(
                    """
                    INSERT INTO administration_staff (user_id, department, designation, employee_code, created_at, updated_at)
                    SELECT
                        s.user_id,
                        COALESCE(MAX(NULLIF(s.department, '')), COALESCE(MAX(f.subject_specialization), 'General')),
                        COALESCE(MAX(NULLIF(s.role, '')), COALESCE(MAX(u.title), 'Staff')),
                        COALESCE(MAX(NULLIF(s.employee_code, '')), 'EMP-' || printf('%03d', s.user_id)),
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    FROM salary_slips s
                    JOIN users u ON u.id = s.user_id
                    LEFT JOIN faculties f ON f.user_id = u.id
                    LEFT JOIN administration_staff a ON a.user_id = s.user_id
                    WHERE s.user_id IS NOT NULL
                      AND a.user_id IS NULL
                    GROUP BY s.user_id
                    """
                )
            )
            applied += int(missing_staff_profiles.rowcount or 0)

    if applied:
        db.session.commit()
    return applied


def list_program_courses_for_class(
    class_id: int | list[int] | tuple[int, ...] | set[int] | None,
    *,
    statuses: tuple[str, ...] = ("upcoming", "active"),
):
    query = Subject.query.filter(Subject.course_type != "core")
    if class_id is not None:
        if isinstance(class_id, (list, tuple, set)):
            class_ids = {int(item) for item in class_id}
            if not class_ids:
                return []
            query = query.filter(Subject.class_id.in_(class_ids))
        else:
            query = query.filter(Subject.class_id == int(class_id))
    if statuses:
        query = query.filter(Subject.status.in_(statuses))
    return query.order_by(Subject.start_date.asc(), Subject.id.desc()).all()


def get_student_course_enrollments(student_id: int):
    return (
        CourseEnrollment.query.filter_by(student_id=student_id)
        .order_by(CourseEnrollment.created_at.desc(), CourseEnrollment.id.desc())
        .all()
    )


def get_student_course_enrollment(student_id: int, enrollment_id: int) -> CourseEnrollment:
    enrollment = CourseEnrollment.query.filter_by(id=enrollment_id, student_id=student_id).first()
    if enrollment is None:
        raise ApiError(404, "COURSE_ENROLLMENT_NOT_FOUND", "Course enrollment was not found.")
    return enrollment


def serialize_course_for_student(course: Subject, student: Student):
    payload = course.to_dict()
    enrollment = CourseEnrollment.query.filter_by(course_id=course.id, student_id=student.id).first()
    payload["enrollment"] = enrollment.to_dict() if enrollment is not None else None
    payload["enrollmentStatus"] = enrollment.status if enrollment is not None else "not_enrolled"
    return payload


def create_course_enrollment(
    *,
    student: Student,
    course: Subject,
    actor: User,
    payment_plan: str,
    installment_count: int | None = None,
) -> tuple[CourseEnrollment, bool]:
    existing = CourseEnrollment.query.filter_by(course_id=course.id, student_id=student.id).first()
    if existing is not None:
        return existing, False

    if course.course_type == "core":
        raise ApiError(422, "COURSE_ENROLLMENT_UNAVAILABLE", "Core academic courses are not available for paid enrollment.")
    if course.status not in {"upcoming", "active"}:
        raise ApiError(422, "COURSE_ENROLLMENT_CLOSED", "This course is not open for enrollment.")

    normalized_plan = payment_plan.strip().lower()
    if normalized_plan not in {"one_time", "installments"}:
        raise ApiError(422, "INVALID_PAYMENT_PLAN", "Unsupported payment plan was provided.")
    if normalized_plan == "installments" and not course.installment_available:
        raise ApiError(422, "INSTALLMENTS_NOT_AVAILABLE", "Installments are not enabled for this course.")

    resolved_installments = 1 if normalized_plan == "one_time" else max(int(installment_count or 2), 2)
    if resolved_installments > max(int(course.max_installments or 1), 1):
        raise ApiError(
            422,
            "INSTALLMENT_LIMIT_EXCEEDED",
            "Installment count exceeds the allowed maximum for this course.",
            {"maxInstallments": int(course.max_installments or 1)},
        )

    parent = get_primary_parent(student.id)
    enrollment = CourseEnrollment(
        course_id=course.id,
        student_id=student.id,
        parent_id=parent.id if parent is not None else None,
        payment_plan=normalized_plan,
        installment_count=resolved_installments,
        total_fee=float(course.fee_amount or 0),
        amount_paid=0,
        enrolled_by_user_id=actor.id,
    )
    enrollment.sync_status()
    db.session.add(enrollment)
    db.session.flush()
    return enrollment, True


def record_course_payment(
    *,
    enrollment: CourseEnrollment,
    actor: User,
    amount: float,
    payment_method: str,
    reference_number: str | None = None,
) -> CoursePayment:
    normalized_amount = round(float(amount or 0), 2)
    if normalized_amount <= 0:
        raise ApiError(422, "INVALID_PAYMENT_AMOUNT", "Payment amount must be greater than zero.")
    if normalized_amount > enrollment.balance_due:
        raise ApiError(
            422,
            "PAYMENT_EXCEEDS_BALANCE",
            "Payment amount cannot exceed the outstanding balance.",
            {"balanceDue": enrollment.balance_due},
        )

    if actor.role_scope == "student" and enrollment.parent_id is not None:
        raise ApiError(
            403,
            "PARENT_PAYMENT_REQUIRED",
            "A linked parent account must complete the payment for this student.",
        )

    if enrollment.payment_plan == "one_time" and normalized_amount < enrollment.balance_due:
        raise ApiError(
            422,
            "FULL_PAYMENT_REQUIRED",
            "One-time payment plans must be settled in a single payment.",
            {"balanceDue": enrollment.balance_due},
        )

    payment_count = len(enrollment.payments)
    installment_number = 1 if enrollment.payment_plan == "one_time" else payment_count + 1
    receipt_number = f"RCT-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{enrollment.id}-{installment_number}"
    parent = get_primary_parent(enrollment.student_id)
    payment = CoursePayment(
        enrollment_id=enrollment.id,
        course_id=enrollment.course_id,
        student_id=enrollment.student_id,
        parent_id=parent.id if parent is not None else None,
        paid_by_user_id=actor.id,
        amount=normalized_amount,
        payment_method=payment_method or "online",
        installment_number=installment_number,
        reference_number=reference_number,
        receipt_number=receipt_number,
        status="completed",
    )
    db.session.add(payment)

    enrollment.amount_paid = round(float(enrollment.amount_paid or 0) + normalized_amount, 2)
    enrollment.sync_status()
    db.session.flush()

    _send_payment_receipt_email(payment)
    return payment


def _send_payment_receipt_email(payment: CoursePayment) -> None:
    student = payment.student
    if student is None or student.user is None:
        return

    recipients = [student.user.email]
    if payment.parent is not None and payment.parent.user is not None and payment.parent.user.email:
        recipients.append(payment.parent.user.email)
    recipients = sorted({email for email in recipients if email})

    course_title = payment.course.name if payment.course is not None else "Course"
    text_body = (
        f"Payment receipt\n"
        f"Receipt: {payment.receipt_number}\n"
        f"Course: {course_title}\n"
        f"Amount: Rs. {payment.amount:,.2f}\n"
        f"Method: {payment.payment_method}\n"
        f"Paid at: {payment.paid_at.isoformat()}\n"
    )
    html_body = (
        "<html><body style=\"font-family: Arial, sans-serif;\">"
        f"<h2>Course Payment Receipt</h2><p><strong>Receipt:</strong> {payment.receipt_number}</p>"
        f"<p><strong>Course:</strong> {course_title}</p>"
        f"<p><strong>Amount:</strong> Rs. {payment.amount:,.2f}</p>"
        f"<p><strong>Method:</strong> {payment.payment_method}</p>"
        f"<p><strong>Paid at:</strong> {payment.paid_at.isoformat()}</p>"
        "</body></html>"
    )
    try:
        send_email_message(
            recipients=recipients,
            subject=f"Course payment receipt - {course_title}",
            text_body=text_body,
            html_body=html_body,
            category="course_payment_receipt",
            related_user_id=student.user_id,
            created_by=payment.paid_by_user_id,
        )
    except Exception:
        # Receipts should not fail the payment flow.
        pass
