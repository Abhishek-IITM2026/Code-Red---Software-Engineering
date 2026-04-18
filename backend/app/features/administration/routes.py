import re
from datetime import date, datetime, timedelta

from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import (
    AdministrationStaff,
    Attendance,
    ClassEnrollment,
    CourseEnrollment,
    CoursePayment,
    Faculty,
    FacultySubjectAssignment,
    InstituteClass,
    Mark,
    Parent,
    Role,
    SalarySlip,
    StaffFinancialProfile,
    Student,
    Subject,
    User,
    UserContactProfile,
    UserStatus,
)
from ...schemas import (
    AISettingsWriteRequest,
    CourseWriteRequest,
    FinancialRecordCreateRequest,
    FinancialRecordWriteRequest,
    PromotionActionRequest,
    StaffStatusRequest,
    StaffWriteRequest,
    StudentApprovalRequest,
    StudentStatusRequest,
    StudentWriteRequest,
    parse_json,
)
from ...services.ai_settings import get_ai_settings, update_ai_settings
from ...services.query import get_attendance_stats, get_performance_summary


administration_bp = Blueprint("administration", __name__)


def _active_academic_year() -> str:
    year = datetime.utcnow().year
    return f"{year}-{year + 1}"


def _status_to_enum(status: str) -> UserStatus:
    normalized = status.strip().lower()
    mapping = {
        "active": UserStatus.ACTIVE,
        "inactive": UserStatus.INACTIVE,
        "suspended": UserStatus.SUSPENDED,
        "on-leave": UserStatus.ACTIVE,
    }
    return mapping.get(normalized, UserStatus.ACTIVE)


def _student_status_label(student: Student) -> str:
    if student.status == UserStatus.SUSPENDED:
        return "suspended"
    if student.status == UserStatus.INACTIVE:
        return "inactive"
    return "active"


def _staff_status_label(user: User) -> str:
    if user.status == UserStatus.INACTIVE:
        return "inactive"
    return "active"


def _get_role(name: str) -> Role:
    role = Role.query.filter_by(name=name).first()
    if role is None:
        raise ApiError(500, "ROLE_SETUP_ERROR", f"Role '{name}' is not configured.")
    return role


def _attach_role(user: User, role_name: str):
    role = _get_role(role_name)
    if role not in user.roles:
        user.roles.append(role)


def _detach_role(user: User, role_name: str):
    normalized = role_name.strip().lower()
    user.roles[:] = [role for role in user.roles if role.normalized_name() != normalized]


def _ensure_unique_employee_code(employee_code: str, user_id: int | None = None):
    query = AdministrationStaff.query.filter_by(employee_code=employee_code)
    if user_id is not None:
        query = query.filter(AdministrationStaff.user_id != user_id)
    if query.first() is not None:
        raise ApiError(409, "EMPLOYEE_CODE_EXISTS", "A staff member with this employee code already exists.")


def _sync_contact(user: User, phone: str | None):
    if phone is None:
        return
    if user.contact_profile is None:
        db.session.add(UserContactProfile(user_id=user.id, phone_number=phone))
    else:
        user.contact_profile.phone_number = phone


def _name_parts(full_name: str | None):
    if not full_name:
        return ("Guardian", "User")
    parts = full_name.strip().split()
    if len(parts) == 1:
        return (parts[0], "User")
    return (parts[0], " ".join(parts[1:]))


def _find_or_create_class(class_name: str, section: str) -> InstituteClass:
    academic_year = _active_academic_year()
    institute_class = InstituteClass.query.filter_by(
        name=class_name,
        section=section,
        academic_year=academic_year,
    ).first()
    if institute_class is not None:
        return institute_class

    grade = "".join(character for character in class_name if character.isdigit()) or "0"
    institute_class = InstituteClass(
        name=class_name,
        grade=grade,
        section=section,
        academic_year=academic_year,
    )
    db.session.add(institute_class)
    db.session.flush()
    return institute_class


def _student_payload(student: Student):
    enrollment = student.current_enrollment()
    parent = Parent.query.filter_by(student_id=student.id, is_primary=True).first()
    attendance = get_attendance_stats(student.id)
    performance = get_performance_summary(student.id)
    return {
        "id": str(student.id),
        "email": student.user.email,
        "firstName": student.user.first_name,
        "lastName": student.user.last_name,
        "class": enrollment.institute_class.name if enrollment else "",
        "section": enrollment.institute_class.section if enrollment else "",
        "enrollmentNo": student.roll_number or "",
        "phone": student.user.contact_profile.phone_number if student.user.contact_profile else None,
        "guardianName": (
            f"{parent.user.first_name} {parent.user.last_name}".strip() if parent and parent.user else None
        ),
        "status": _student_status_label(student),
        "createdAt": student.created_at.isoformat(),
        "updatedAt": student.updated_at.isoformat(),
        "attendance": attendance["percentage"],
        "average": performance["average"],
    }


def _is_student_pending_approval(student: Student) -> bool:
    return student.user.status == UserStatus.INACTIVE and student.current_enrollment() is None


def _student_approval_payload(student: Student):
    return {
        "id": str(student.id),
        "email": student.user.email,
        "firstName": student.user.first_name,
        "lastName": student.user.last_name,
        "phone": student.user.contact_profile.phone_number if student.user.contact_profile else None,
        "enrollmentNo": student.roll_number or "",
        "requestedAt": student.created_at.isoformat(),
        "status": "pending",
    }


def _staff_payload(user: User, category: str, designation: str, department: str, employee_code: str, joining_date: str | None):
    full_name = f"{user.first_name} {user.last_name}".strip()
    return {
        "id": str(user.id),
        "staffId": str(user.id),
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "name": full_name,
        "employeeCode": employee_code,
        "category": category,
        "role": designation,
        "designation": designation,
        "department": department,
        "phone": user.contact_profile.phone_number if user.contact_profile else None,
        "joiningDate": joining_date,
        "status": _staff_status_label(user),
        "createdAt": user.created_at.isoformat(),
        "updatedAt": user.updated_at.isoformat(),
    }


def _staff_payloads():
    payloads = []
    seen_user_ids: set[int] = set()

    for faculty in Faculty.query.all():
        user = faculty.user
        admin_profile = getattr(user, "administration_profile", None)
        payloads.append(
            _staff_payload(
                user=user,
                category="Teaching",
                designation=(
                    admin_profile.designation
                    if admin_profile and admin_profile.designation
                    else faculty.subject_specialization or user.title or "Faculty"
                ),
                department=(
                    admin_profile.department
                    if admin_profile and admin_profile.department
                    else faculty.subject_specialization or "Academics"
                ),
                employee_code=(
                    admin_profile.employee_code
                    if admin_profile and admin_profile.employee_code
                    else f"EMP-T-{faculty.id:03d}"
                ),
                joining_date=(
                    faculty.hire_date.isoformat()
                    if faculty.hire_date
                    else (admin_profile.created_at.date().isoformat() if admin_profile and admin_profile.created_at else None)
                ),
            )
        )
        seen_user_ids.add(user.id)

    for member in AdministrationStaff.query.all():
        if member.user_id in seen_user_ids:
            continue
        payloads.append(
            _staff_payload(
                user=member.user,
                category="Non-Teaching",
                designation=member.designation or member.user.title or "Administration Staff",
                department=member.department or "Operations",
                employee_code=member.employee_code or f"EMP-A-{member.id:03d}",
                joining_date=member.created_at.date().isoformat() if member.created_at else None,
            )
        )

    return payloads


def _parse_iso_date(value: str, field_name: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ApiError(422, "VALIDATION_ERROR", f"{field_name} must be a valid ISO date.") from exc


def _parse_currency_amount(value: str | int | float, field_name: str) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    normalized_value = str(value).replace(",", "")
    match = re.search(r"-?\d+(?:\.\d+)?", normalized_value)
    normalized = match.group(0) if match else ""
    if not normalized:
        raise ApiError(422, "VALIDATION_ERROR", f"{field_name} must contain a numeric amount.")
    try:
        return float(normalized)
    except ValueError as exc:
        raise ApiError(422, "VALIDATION_ERROR", f"{field_name} must contain a numeric amount.") from exc


def _format_currency(amount: float | int | None) -> str:
    return f"Rs. {int(round(float(amount or 0))):,}"


def _financial_history(employee_code: str):
    staff_profile = AdministrationStaff.query.filter_by(employee_code=employee_code).first()
    if staff_profile is not None:
        slips = (
            SalarySlip.query.filter_by(user_id=staff_profile.user_id)
            .order_by(SalarySlip.month_key.desc(), SalarySlip.id.desc())
            .all()
        )
    else:
        slips = (
            SalarySlip.query.filter_by(employee_code=employee_code)
            .order_by(SalarySlip.month_key.desc(), SalarySlip.id.desc())
            .all()
        )
    history = []
    for index, slip in enumerate(slips):
        previous_salary = slips[index + 1].gross_salary if index + 1 < len(slips) else slip.gross_salary
        history.append(
            {
                "month": slip.month_label,
                "previousSalary": _format_currency(previous_salary),
                "increment": _format_currency(max(slip.gross_salary - previous_salary, 0)),
                "revisedSalary": _format_currency(slip.gross_salary),
                "payoutStatus": slip.payout_status,
            }
        )
    return slips, history


def _default_earnings_breakdown(current_salary: float):
    if current_salary <= 0:
        return []
    basic_pay = round(current_salary * 0.75, 2)
    allowances = round(current_salary - basic_pay, 2)
    return [
        {"label": "Basic Pay", "amount": basic_pay},
        {"label": "Allowances", "amount": allowances},
    ]


def _sum_breakdown(items):
    return round(sum(float(item.get("amount", 0) or 0) for item in (items or [])), 2)


def _normalize_earnings_breakdown(items):
    normalized = []
    for item in items or []:
        label = item.get("label") if isinstance(item, dict) else None
        amount = item.get("amount") if isinstance(item, dict) else None
        if not label:
            continue
        normalized.append({"label": label, "amount": _parse_currency_amount(amount, f"{label} amount")})
    return normalized


def _resolve_base_pay(profile: StaffFinancialProfile | None, latest_slip: SalarySlip | None):
    if profile is not None and getattr(profile, "base_pay", None) is not None:
        return float(profile.base_pay or 0)
    if latest_slip is not None:
        return float(latest_slip.base_salary or 0)
    return 0.0


def _resolve_financial_breakdown(profile: StaffFinancialProfile | None, latest_slip: SalarySlip | None, current_salary: float):
    if profile is not None and profile.earnings_breakdown_json:
        return profile.earnings_breakdown_json
    if latest_slip is not None and latest_slip.allowances_json:
        return latest_slip.allowances_json
    fallback = _default_earnings_breakdown(current_salary)
    return fallback[1:] if len(fallback) > 1 else []


def _ensure_financial_profile(user: User, staff: dict[str, str] | None = None):
    profile = getattr(user, "financial_profile", None)
    if profile is not None:
        return profile
    resolved_staff = staff or _get_financial_staff_or_404(user.id)
    slips, _salary_history = _financial_history(resolved_staff["employeeCode"])
    latest_slip = slips[0] if slips else None
    base_pay = float(latest_slip.base_salary or 0) if latest_slip is not None else 0
    earnings_breakdown = (
        latest_slip.allowances_json
        if latest_slip is not None and latest_slip.allowances_json
        else _resolve_financial_breakdown(None, latest_slip, float(latest_slip.gross_salary or 0) if latest_slip else 0)
    )
    current_salary = base_pay + _sum_breakdown(earnings_breakdown)
    profile = StaffFinancialProfile(
        user_id=user.id,
        bank_account=latest_slip.bank_account if latest_slip is not None else None,
        base_pay=base_pay,
        current_salary=current_salary,
        last_increment=(max(slips[0].gross_salary - slips[1].gross_salary, 0) if len(slips) > 1 else 0),
        next_review=date.today() + timedelta(days=90),
        earnings_breakdown_json=earnings_breakdown,
    )
    db.session.add(profile)
    db.session.flush()
    return profile


def _financial_record_payload(staff: dict[str, str]):
    user = db.session.get(User, int(staff["id"]))
    if user is None:
        raise ApiError(404, "STAFF_NOT_FOUND", "Staff member was not found.")
    slips, salary_history = _financial_history(staff["employeeCode"])
    latest_slip = slips[0] if slips else None
    profile = _ensure_financial_profile(user, staff)
    base_pay = _resolve_base_pay(profile, latest_slip)
    raw_breakdown = _resolve_financial_breakdown(profile, latest_slip, profile.current_salary if profile is not None else 0)
    current_salary = base_pay + _sum_breakdown(raw_breakdown)
    last_increment = (
        profile.last_increment
        if profile is not None
        else (max(slips[0].gross_salary - slips[1].gross_salary, 0) if len(slips) > 1 else 0)
    )
    next_review = (
        profile.next_review.isoformat()
        if profile is not None and profile.next_review is not None
        else (date.today() + timedelta(days=90)).isoformat()
    )
    return {
        "id": staff["id"],
        "staffId": staff["id"],
        "staffName": staff["name"],
        "category": staff["category"],
        "role": staff["designation"],
        "department": staff["department"],
        "employeeCode": staff["employeeCode"],
        "bankAccount": (
            profile.bank_account
            if profile is not None and profile.bank_account
            else (latest_slip.bank_account if latest_slip is not None else "Not Added")
        ),
        "basePay": _format_currency(base_pay),
        "currentSalary": _format_currency(current_salary),
        "lastIncrement": _format_currency(last_increment),
        "nextReview": next_review,
        "earningsBreakdown": [
            {
                "label": item.get("label", "Component"),
                "amount": _format_currency(item.get("amount", 0)),
            }
            for item in raw_breakdown
        ],
        "salaryHistory": salary_history,
    }


def _get_financial_staff_or_404(user_id: int):
    staff = next((item for item in _staff_payloads() if item["id"] == str(user_id)), None)
    if staff is None:
        raise ApiError(404, "STAFF_NOT_FOUND", "Staff member was not found.")
    return staff


def _sync_payroll_slips_for_staff(staff: dict[str, str], profile: StaffFinancialProfile, earnings_breakdown_override=None):
    slips = (
        SalarySlip.query.filter_by(user_id=int(staff["id"]))
        .order_by(SalarySlip.month_key.desc(), SalarySlip.id.desc())
        .all()
    )
    if not slips:
        return
    target_slips = [slip for slip in slips if slip.payout_status == "Pending"] or [slips[0]]
    breakdown = (
        earnings_breakdown_override
        if earnings_breakdown_override is not None
        else (profile.earnings_breakdown_json or None)
    )
    bank_account = profile.bank_account
    for slip in target_slips:
        allowance_total = _sum_breakdown(breakdown)
        current_salary = float(profile.base_pay or 0) + allowance_total
        profile.current_salary = current_salary
        slip.base_salary = profile.base_pay
        if breakdown:
            slip.allowances_json = breakdown
        if bank_account:
            slip.bank_account = bank_account
        slip.gross_salary = current_salary + slip.overtime_amount
        slip.net_salary = slip.gross_salary - slip.total_deductions


def _promotion_candidate(student: Student):
    enrollment = student.current_enrollment()
    stats = get_attendance_stats(student.id)
    performance = get_performance_summary(student.id)
    grade = int(enrollment.institute_class.grade) if enrollment and enrollment.institute_class.grade.isdigit() else 0
    target_grade = grade + 1 if grade else grade
    parent = Parent.query.filter_by(student_id=student.id, is_primary=True).first()
    parent_phone = parent.user.contact_profile.phone_number if parent and parent.user.contact_profile else None
    return {
        "id": str(student.id),
        "admissionNo": student.roll_number,
        "name": f"{student.user.first_name} {student.user.last_name}",
        "className": enrollment.institute_class.name if enrollment else None,
        "section": enrollment.institute_class.section if enrollment else None,
        "guardian": f"{parent.user.first_name} {parent.user.last_name}" if parent else None,
        "parentPhone": parent_phone,
        "attendance": f"{stats['percentage']}%",
        "average": f"{performance['average']}%",
        "status": "Active" if student.status.value == "ACTIVE" else "Inactive",
        "resultStatus": "Eligible" if stats["percentage"] >= 75 and performance["average"] >= 50 else "Review Required",
        "targetClass": f"Class {target_grade}" if target_grade else None,
        "notes": "Promotion derived from attendance and marks summary.",
    }


def _dashboard_payload():
    total_students = Student.query.count()
    total_faculty = Faculty.query.count()
    total_staff = len(_staff_payloads())
    student_attendance = [get_attendance_stats(student.id)["percentage"] for student in Student.query.all()]
    upcoming_events = [
        course.to_dict()
        for course in Subject.query.filter(Subject.course_type != "core")
        .order_by(Subject.start_date.asc(), Subject.id.desc())
        .limit(5)
        .all()
    ]
    pending_approvals = len([student for student in Student.query.all() if _is_student_pending_approval(student)])
    return {
        "totalStudents": total_students,
        "totalFaculty": total_faculty,
        "totalStaff": total_staff,
        "attendanceRate": round(sum(student_attendance) / len(student_attendance), 2) if student_attendance else 0,
        "pendingApprovals": pending_approvals,
        "upcomingEvents": upcoming_events,
    }


def _attendance_audience_rows():
    rows = []
    for student in Student.query.all():
        enrollment = student.current_enrollment()
        attendance = get_attendance_stats(student.id)["percentage"]
        rows.append(
            {
                "id": str(student.id),
                "name": f"{student.user.first_name} {student.user.last_name}",
                "role": "Student",
                "departmentOrClass": (
                    f"{enrollment.institute_class.name} {enrollment.institute_class.section}".strip()
                    if enrollment
                    else "Unassigned"
                ),
                "attendance": f"{round(attendance)}%",
                "status": "Regular" if attendance >= 85 else "Needs follow-up",
                "audience": "students",
            }
        )

    for staff in _staff_payloads():
        reference_count = 0
        if staff["category"] == "Teaching":
            faculty = Faculty.query.filter_by(user_id=int(staff["id"])).first()
            if faculty is not None:
                reference_count = FacultySubjectAssignment.query.filter_by(faculty_id=faculty.id).count()
        else:
            reference_count = 1
        attendance_score = min(99, 82 + reference_count * 4)
        rows.append(
            {
                "id": staff["employeeCode"],
                "name": f"{staff['firstName']} {staff['lastName']}".strip(),
                "role": staff["designation"],
                "departmentOrClass": staff["department"],
                "attendance": f"{attendance_score}%",
                "status": "Regular" if attendance_score >= 90 else "Review",
                "audience": "faculty" if staff["category"] == "Teaching" else "staff",
            }
        )

    return rows


def _exam_participation_rows():
    rows = []
    for mark in Mark.query.order_by(Mark.exam_date.desc()).all():
        student = db.session.get(Student, mark.student_id)
        if student is None:
            continue
        enrollment = student.current_enrollment()
        rows.append(
            {
                "studentId": str(student.id),
                "studentName": f"{student.user.first_name} {student.user.last_name}",
                "class": enrollment.institute_class.name if enrollment else "Unassigned",
                "section": enrollment.institute_class.section if enrollment else "",
                "examName": mark.examination_name,
                "participationStatus": "participated",
                "marksObtained": mark.marks_obtained,
                "totalMarks": mark.total_marks,
            }
        )
    return rows


@administration_bp.get("/dashboard")
@roles_required("administration")
def get_dashboard():
    return success_response(_dashboard_payload())


@administration_bp.get("/students")
@roles_required("administration")
def list_students():
    records = [student for student in Student.query.all() if not _is_student_pending_approval(student)]
    return success_response([_student_payload(student) for student in records])


@administration_bp.get("/students/pending-approvals")
@roles_required("administration")
def list_pending_student_approvals():
    pending_students = [student for student in Student.query.order_by(Student.created_at.asc()).all() if _is_student_pending_approval(student)]
    return success_response([_student_approval_payload(student) for student in pending_students])


@administration_bp.get("/students/<int:student_id>")
@roles_required("administration")
def get_student(student_id: int):
    student = db.session.get(Student, student_id)
    if student is None:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student was not found.")
    return success_response(_student_payload(student))


@administration_bp.post("/students/<int:student_id>/approve")
@roles_required("administration")
def approve_student(student_id: int):
    student = db.session.get(Student, student_id)
    if student is None:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student was not found.")
    if not _is_student_pending_approval(student):
        raise ApiError(400, "STUDENT_ALREADY_APPROVED", "This student no longer requires approval.")

    payload = parse_json(StudentApprovalRequest, request.get_json())
    class_name = payload.class_name.strip()
    section = payload.section.strip()
    if not class_name or not section:
        raise ApiError(422, "VALIDATION_ERROR", "className and section are required for approval.")

    institute_class = _find_or_create_class(class_name, section)
    db.session.add(
        ClassEnrollment(
            student_id=student.id,
            class_id=institute_class.id,
            academic_year=institute_class.academic_year,
        )
    )

    enrollment_no = (payload.enrollment_no or "").strip()
    student.roll_number = enrollment_no or student.roll_number or f"STD-{student.id:05d}"
    student.status = UserStatus.ACTIVE
    student.user.status = UserStatus.ACTIVE
    db.session.commit()
    return success_response(_student_payload(student), message="Student approved and activated.")


@administration_bp.post("/students")
@roles_required("administration")
def create_student():
    payload = parse_json(StudentWriteRequest, request.get_json())
    if User.query.filter_by(email=payload.email.strip().lower()).first():
        raise ApiError(409, "EMAIL_ALREADY_EXISTS", "A user with this email already exists.")

    user = User(
        email=payload.email.strip().lower(),
        first_name=payload.first_name,
        last_name=payload.last_name,
        status=_status_to_enum(payload.status),
    )
    user.set_password("ChangeMe123!")
    _attach_role(user, "student")
    db.session.add(user)
    db.session.flush()
    _sync_contact(user, payload.phone)

    student = Student(
        user_id=user.id,
        roll_number=payload.enrollment_no,
        status=_status_to_enum(payload.status),
        admission_date=datetime.utcnow().date(),
    )
    db.session.add(student)
    db.session.flush()

    institute_class = _find_or_create_class(payload.class_name, payload.section)
    db.session.add(
        ClassEnrollment(
            student_id=student.id,
            class_id=institute_class.id,
            academic_year=institute_class.academic_year,
        )
    )

    if payload.guardian_name:
        first_name, last_name = _name_parts(payload.guardian_name)
        parent_user = User(
            email=f"parent-{student.id}@local.test",
            first_name=first_name,
            last_name=last_name,
        )
        parent_user.set_password("ChangeMe123!")
        _attach_role(parent_user, "parent")
        db.session.add(parent_user)
        db.session.flush()
        _sync_contact(parent_user, payload.phone)
        db.session.add(Parent(user_id=parent_user.id, student_id=student.id, relation="Guardian", is_primary=True))

    db.session.commit()
    return success_response(_student_payload(student), status_code=201)


@administration_bp.put("/students/<int:student_id>")
@roles_required("administration")
def update_student(student_id: int):
    student = db.session.get(Student, student_id)
    if student is None:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student was not found.")
    payload = parse_json(StudentWriteRequest, request.get_json())

    existing_user = User.query.filter(User.email == payload.email.strip().lower(), User.id != student.user_id).first()
    if existing_user is not None:
        raise ApiError(409, "EMAIL_ALREADY_EXISTS", "A user with this email already exists.")

    student.user.email = payload.email.strip().lower()
    student.user.first_name = payload.first_name
    student.user.last_name = payload.last_name
    student.user.status = _status_to_enum(payload.status)
    _sync_contact(student.user, payload.phone)
    student.roll_number = payload.enrollment_no
    student.status = _status_to_enum(payload.status)

    institute_class = _find_or_create_class(payload.class_name, payload.section)
    enrollment = student.current_enrollment()
    if enrollment is None:
        db.session.add(
            ClassEnrollment(
                student_id=student.id,
                class_id=institute_class.id,
                academic_year=institute_class.academic_year,
            )
        )
    else:
        enrollment.class_id = institute_class.id
        enrollment.academic_year = institute_class.academic_year

    parent = Parent.query.filter_by(student_id=student.id, is_primary=True).first()
    if payload.guardian_name:
        guardian_first_name, guardian_last_name = _name_parts(payload.guardian_name)
        if parent is None:
            parent_user = User(
                email=f"parent-{student.id}@local.test",
                first_name=guardian_first_name,
                last_name=guardian_last_name,
            )
            parent_user.set_password("ChangeMe123!")
            _attach_role(parent_user, "parent")
            db.session.add(parent_user)
            db.session.flush()
            parent = Parent(user_id=parent_user.id, student_id=student.id, relation="Guardian", is_primary=True)
            db.session.add(parent)
        else:
            parent.user.first_name = guardian_first_name
            parent.user.last_name = guardian_last_name
        _sync_contact(parent.user, payload.phone)

    db.session.commit()
    return success_response(_student_payload(student))


@administration_bp.patch("/students/<int:student_id>/status")
@roles_required("administration")
def update_student_status(student_id: int):
    student = db.session.get(Student, student_id)
    if student is None:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student was not found.")
    payload = parse_json(StudentStatusRequest, request.get_json())
    next_status = _status_to_enum(payload.status)
    student.status = next_status
    student.user.status = next_status
    db.session.commit()
    return success_response(_student_payload(student))


@administration_bp.delete("/students/<int:student_id>")
@roles_required("administration")
def delete_student(student_id: int):
    student = db.session.get(Student, student_id)
    if student is None:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student was not found.")

    parents = Parent.query.filter_by(student_id=student.id).all()
    for parent in parents:
        parent_user = parent.user
        db.session.delete(parent)
        if parent_user is not None:
            if parent_user.contact_profile is not None:
                db.session.delete(parent_user.contact_profile)
            db.session.delete(parent_user)

    enrollments = ClassEnrollment.query.filter_by(student_id=student.id).all()
    for enrollment in enrollments:
        db.session.delete(enrollment)

    user = student.user
    db.session.delete(student)
    if user.contact_profile is not None:
        db.session.delete(user.contact_profile)
    db.session.delete(user)
    db.session.commit()
    return success_response({"success": True})


@administration_bp.get("/staff")
@roles_required("administration")
def list_staff():
    return success_response(_staff_payloads())


@administration_bp.get("/staff/<int:user_id>")
@roles_required("administration")
def get_staff_member(user_id: int):
    staff = next((item for item in _staff_payloads() if item["id"] == str(user_id)), None)
    if staff is None:
        raise ApiError(404, "STAFF_NOT_FOUND", "Staff member was not found.")
    return success_response(staff)


@administration_bp.post("/staff")
@roles_required("administration")
def create_staff():
    payload = parse_json(StaffWriteRequest, request.get_json())
    if User.query.filter_by(email=payload.email.strip().lower()).first():
        raise ApiError(409, "EMAIL_ALREADY_EXISTS", "A user with this email already exists.")
    _ensure_unique_employee_code(payload.employee_code)
    joining_date = _parse_iso_date(payload.joining_date, "joiningDate")

    user = User(
        email=payload.email.strip().lower(),
        first_name=payload.first_name,
        last_name=payload.last_name,
        title=payload.designation,
        status=_status_to_enum(payload.status),
    )
    user.set_password("ChangeMe123!")
    _attach_role(user, "faculty" if payload.category == "Teaching" else "administration")
    db.session.add(user)
    db.session.flush()
    _sync_contact(user, payload.phone)

    if payload.category == "Teaching":
        faculty = Faculty(
            user_id=user.id,
            subject_specialization=payload.department,
            hire_date=joining_date,
        )
        db.session.add(faculty)

    db.session.add(
        AdministrationStaff(
            user_id=user.id,
            department=payload.department,
            designation=payload.designation,
            employee_code=payload.employee_code,
        )
    )

    db.session.flush()
    created_staff = next(item for item in _staff_payloads() if item["id"] == str(user.id))
    _ensure_financial_profile(user, created_staff)
    db.session.commit()
    return success_response(next(item for item in _staff_payloads() if item["id"] == str(user.id)), status_code=201)


@administration_bp.put("/staff/<int:user_id>")
@roles_required("administration")
def update_staff(user_id: int):
    user = db.session.get(User, user_id)
    if user is None:
        raise ApiError(404, "STAFF_NOT_FOUND", "Staff member was not found.")
    payload = parse_json(StaffWriteRequest, request.get_json())
    existing_user = User.query.filter(User.email == payload.email.strip().lower(), User.id != user_id).first()
    if existing_user is not None:
        raise ApiError(409, "EMAIL_ALREADY_EXISTS", "A user with this email already exists.")
    _ensure_unique_employee_code(payload.employee_code, user_id=user_id)
    joining_date = _parse_iso_date(payload.joining_date, "joiningDate")

    user.email = payload.email.strip().lower()
    user.first_name = payload.first_name
    user.last_name = payload.last_name
    user.title = payload.designation
    user.status = _status_to_enum(payload.status)
    _sync_contact(user, payload.phone)

    admin_profile = getattr(user, "administration_profile", None)
    if admin_profile is None:
        admin_profile = AdministrationStaff(user_id=user.id)
        db.session.add(admin_profile)
    admin_profile.department = payload.department
    admin_profile.designation = payload.designation
    admin_profile.employee_code = payload.employee_code

    faculty = user.faculty
    if payload.category == "Teaching":
        _attach_role(user, "faculty")
        _detach_role(user, "administration")
        _detach_role(user, "admin")
        if faculty is None:
            faculty = Faculty(user_id=user.id)
            db.session.add(faculty)
        faculty.subject_specialization = payload.department
        faculty.hire_date = joining_date
    else:
        _attach_role(user, "administration")
        _detach_role(user, "faculty")
        if faculty is not None:
            db.session.delete(faculty)

    db.session.flush()
    _ensure_financial_profile(user, next(item for item in _staff_payloads() if item["id"] == str(user.id)))
    db.session.commit()
    return success_response(next(item for item in _staff_payloads() if item["id"] == str(user.id)))


@administration_bp.patch("/staff/<int:user_id>/status")
@roles_required("administration")
def update_staff_status(user_id: int):
    user = db.session.get(User, user_id)
    if user is None:
        raise ApiError(404, "STAFF_NOT_FOUND", "Staff member was not found.")
    payload = parse_json(StaffStatusRequest, request.get_json())
    user.status = _status_to_enum(payload.status)
    db.session.commit()
    return success_response(next(item for item in _staff_payloads() if item["id"] == str(user.id)))


@administration_bp.delete("/staff/<int:user_id>")
@roles_required("administration")
def delete_staff(user_id: int):
    user = db.session.get(User, user_id)
    if user is None:
        raise ApiError(404, "STAFF_NOT_FOUND", "Staff member was not found.")
    if getattr(user, "financial_profile", None) is not None:
        db.session.delete(user.financial_profile)
    if user.faculty is not None:
        for assignment in FacultySubjectAssignment.query.filter_by(faculty_id=user.faculty.id).all():
            db.session.delete(assignment)
        db.session.delete(user.faculty)
    if getattr(user, "administration_profile", None) is not None:
        db.session.delete(user.administration_profile)
    if getattr(user, "authority_assignment", None) is not None:
        db.session.delete(user.authority_assignment)
    if user.contact_profile is not None:
        db.session.delete(user.contact_profile)
    db.session.delete(user)
    db.session.commit()
    return success_response({"success": True})


@administration_bp.get("/courses")
@roles_required("administration")
def list_courses():
    courses = (
        Subject.query.filter(Subject.course_type != "core")
        .order_by(Subject.start_date.desc(), Subject.id.desc())
        .all()
    )
    return success_response([course.to_dict() for course in courses])


@administration_bp.post("/courses")
@roles_required("administration")
def create_course():
    payload = parse_json(CourseWriteRequest, request.get_json())
    if _parse_iso_date(payload.end_date, "endDate") < _parse_iso_date(payload.start_date, "startDate"):
        raise ApiError(422, "VALIDATION_ERROR", "endDate must be on or after startDate.")
    if payload.seats < 1:
        raise ApiError(422, "VALIDATION_ERROR", "seats must be at least 1.")
    institute_class = _find_or_create_class(payload.class_name, payload.section)
    creator = getattr(g, "current_user", None) or User.query.first()
    if creator is None:
        raise ApiError(500, "USER_NOT_FOUND", "No creator user is available.")

    course_code = payload.code or f"{payload.title[:4].upper()}-{institute_class.grade}-{payload.section}"
    course = Subject(
        name=payload.title,
        code=course_code,
        description=payload.description,
        class_id=institute_class.id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        instructor=payload.instructor,
        mode=payload.mode,
        seats=payload.seats,
        created_by=creator.id,
        status=payload.status,
        course_type=payload.course_type,
        level=payload.level or institute_class.grade,
        credits=max(payload.credits, 1),
        fee_amount=max(float(payload.fee_amount or 0), 0),
        installment_available=payload.installment_available,
        max_installments=max(int(payload.max_installments or 1), 1),
        is_active=payload.status != "inactive",
    )
    db.session.add(course)
    db.session.commit()
    return success_response(course.to_dict(), status_code=201)


@administration_bp.put("/courses/<int:course_id>")
@roles_required("administration")
def update_course(course_id: int):
    course = db.session.get(Subject, course_id)
    if course is None:
        raise ApiError(404, "COURSE_NOT_FOUND", "Course was not found.")
    payload = parse_json(CourseWriteRequest, request.get_json())
    if _parse_iso_date(payload.end_date, "endDate") < _parse_iso_date(payload.start_date, "startDate"):
        raise ApiError(422, "VALIDATION_ERROR", "endDate must be on or after startDate.")
    if payload.seats < 1:
        raise ApiError(422, "VALIDATION_ERROR", "seats must be at least 1.")
    institute_class = _find_or_create_class(payload.class_name, payload.section)
    course.name = payload.title
    course.code = payload.code or course.code or f"{payload.title[:4].upper()}-{institute_class.grade}-{payload.section}"
    course.description = payload.description
    course.class_id = institute_class.id
    course.start_date = payload.start_date
    course.end_date = payload.end_date
    course.instructor = payload.instructor
    course.mode = payload.mode
    course.seats = payload.seats
    course.status = payload.status
    course.course_type = payload.course_type
    course.level = payload.level or institute_class.grade
    course.credits = max(payload.credits, 1)
    course.fee_amount = max(float(payload.fee_amount or 0), 0)
    course.installment_available = payload.installment_available
    course.max_installments = max(int(payload.max_installments or 1), 1)
    course.is_active = payload.status != "inactive"
    db.session.commit()
    return success_response(course.to_dict())


@administration_bp.delete("/courses/<int:course_id>")
@roles_required("administration")
def delete_course(course_id: int):
    course = db.session.get(Subject, course_id)
    if course is None:
        raise ApiError(404, "COURSE_NOT_FOUND", "Course was not found.")
    db.session.delete(course)
    db.session.commit()
    return success_response({"success": True})


@administration_bp.get("/ai-settings")
@roles_required("administration")
def get_ai_settings_configuration():
    return success_response(get_ai_settings(include_secret=False))


@administration_bp.put("/ai-settings")
@roles_required("administration")
def save_ai_settings_configuration():
    payload = parse_json(AISettingsWriteRequest, request.get_json())
    updated = update_ai_settings(payload.model_dump(by_alias=True))
    return success_response(updated, message="AI settings updated successfully.")


@administration_bp.get("/promotions/candidates")
@roles_required("administration")
def list_promotion_candidates():
    target_class = request.args.get("targetClass")
    candidates = [_promotion_candidate(student) for student in Student.query.all()]
    if target_class:
        candidates = [candidate for candidate in candidates if candidate["targetClass"] == target_class]
    return success_response(candidates)


@administration_bp.post("/promotions/<int:student_id>")
@roles_required("administration")
def promote_student(student_id: int):
    student = db.session.get(Student, student_id)
    if student is None:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student was not found.")
    payload = parse_json(PromotionActionRequest, request.get_json())
    enrollment = student.current_enrollment()
    target_academic_year = payload.academic_year or (enrollment.institute_class.academic_year if enrollment else _active_academic_year())
    if enrollment and enrollment.institute_class.name == payload.target_class and enrollment.academic_year == target_academic_year:
        raise ApiError(409, "ALREADY_PROMOTED", "Student is already enrolled in the target class.")
    target_section = enrollment.institute_class.section if enrollment and enrollment.institute_class.section else "A"
    existing_target = (
        ClassEnrollment.query.join(InstituteClass, ClassEnrollment.class_id == InstituteClass.id)
        .filter(
            ClassEnrollment.student_id == student.id,
            ClassEnrollment.academic_year == target_academic_year,
            InstituteClass.name == payload.target_class,
            InstituteClass.section == target_section,
        )
        .first()
    )
    if existing_target is not None:
        raise ApiError(409, "ALREADY_PROMOTED", "Student already has an enrollment for the target class and academic year.")
    target_class = _find_or_create_class(
        payload.target_class,
        target_section,
    )
    db.session.add(
        ClassEnrollment(
            student_id=student.id,
            class_id=target_class.id,
            academic_year=target_academic_year,
        )
    )
    db.session.commit()
    return success_response(
        {
            "studentId": str(student.id),
            "targetClass": target_class.name,
            "academicYear": target_academic_year,
            "promoted": True,
        }
    )


@administration_bp.post("/students/promote")
@roles_required("administration")
def promote_students_bulk():
    payload = request.get_json() or {}
    student_ids = payload.get("studentIds") or []
    promote_to_class = payload.get("promoteToClass")
    promote_to_section = payload.get("promoteToSection") or "A"
    if not promote_to_class or not student_ids:
        raise ApiError(400, "VALIDATION_ERROR", "studentIds and promoteToClass are required.")

    target_class = _find_or_create_class(promote_to_class, promote_to_section)
    for student_id in student_ids:
        student = db.session.get(Student, int(student_id))
        if student is None:
            continue
        existing_target = (
            ClassEnrollment.query.filter_by(
                student_id=student.id,
                class_id=target_class.id,
                academic_year=target_class.academic_year,
            ).first()
        )
        if existing_target is not None:
            continue
        db.session.add(
            ClassEnrollment(
                student_id=student.id,
                class_id=target_class.id,
                academic_year=target_class.academic_year,
            )
        )
    db.session.commit()
    return success_response({"success": True})


@administration_bp.get("/reports/attendance")
@roles_required("administration")
def get_attendance_reports():
    return success_response(_attendance_audience_rows())


@administration_bp.get("/reports/exam-participation")
@roles_required("administration")
def get_exam_participation_reports():
    return success_response(_exam_participation_rows())


@administration_bp.post("/reports/generate")
@roles_required("administration")
def generate_report():
    payload = request.get_json() or {}
    report_type = payload.get("reportType", "report")
    return success_response({"reportUrl": f"/api/administration/reports/{report_type}.csv"})

@administration_bp.get("/financial-records")
@roles_required("administration")
def list_financial_records():
    return success_response([_financial_record_payload(staff) for staff in _staff_payloads()])


@administration_bp.get("/financial-records/<int:user_id>")
@roles_required("administration")
def get_financial_record(user_id: int):
    return success_response(_financial_record_payload(_get_financial_staff_or_404(user_id)))


@administration_bp.post("/financial-records")
@roles_required("administration")
def create_financial_record():
    payload = parse_json(FinancialRecordCreateRequest, request.get_json())
    user_id = int(payload.staff_id)
    _get_financial_staff_or_404(user_id)
    user = db.session.get(User, user_id)
    if user is None:
        raise ApiError(404, "STAFF_NOT_FOUND", "Staff member was not found.")
    if getattr(user, "financial_profile", None) is not None:
        raise ApiError(409, "FINANCIAL_RECORD_EXISTS", "A financial record already exists for this staff member.")

    normalized_breakdown = (
        _normalize_earnings_breakdown([item for item in payload.earnings_breakdown])
        if payload.earnings_breakdown
        else []
    )
    base_pay = _parse_currency_amount(payload.base_pay, "basePay")
    current_salary = base_pay + _sum_breakdown(normalized_breakdown)
    profile = StaffFinancialProfile(
        user_id=user.id,
        base_pay=base_pay,
        current_salary=_parse_currency_amount(payload.current_salary, "currentSalary"),
        last_increment=_parse_currency_amount(payload.last_increment, "lastIncrement"),
        next_review=_parse_iso_date(payload.next_review, "nextReview"),
        bank_account=payload.bank_account,
        earnings_breakdown_json=normalized_breakdown,
    )
    profile.current_salary = current_salary
    db.session.add(profile)
    _sync_payroll_slips_for_staff(_get_financial_staff_or_404(user_id), profile, normalized_breakdown)
    db.session.commit()
    return success_response(_financial_record_payload(_get_financial_staff_or_404(user_id)), status_code=201)


@administration_bp.put("/financial-records/<int:user_id>")
@roles_required("administration")
def update_financial_record(user_id: int):
    staff = _get_financial_staff_or_404(user_id)
    payload = parse_json(FinancialRecordWriteRequest, request.get_json())
    user = db.session.get(User, user_id)
    if user is None:
        raise ApiError(404, "STAFF_NOT_FOUND", "Staff member was not found.")

    profile = _ensure_financial_profile(user, staff)
    profile.base_pay = _parse_currency_amount(payload.base_pay, "basePay")
    profile.last_increment = _parse_currency_amount(payload.last_increment, "lastIncrement")
    profile.next_review = _parse_iso_date(payload.next_review, "nextReview")
    if payload.bank_account is not None:
        profile.bank_account = payload.bank_account
    if payload.earnings_breakdown is not None:
        profile.earnings_breakdown_json = _normalize_earnings_breakdown(
            [item for item in payload.earnings_breakdown]
        )
    profile.current_salary = float(profile.base_pay or 0) + _sum_breakdown(profile.earnings_breakdown_json)

    _sync_payroll_slips_for_staff(staff, profile)
    db.session.commit()
    return success_response(_financial_record_payload(staff))
