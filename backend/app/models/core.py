import enum
from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from ..extensions import db


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class UserStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


user_roles = db.Table(
    "user_roles",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
    db.Column("role_id", db.Integer, db.ForeignKey("roles.id"), primary_key=True),
)


ROLE_PRIORITY = [
    "director",
    "superadmin",
    "administration",
    "admin",
    "faculty",
    "teacher",
    "student",
    "parent",
]


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    users = db.relationship("User", secondary=user_roles, back_populates="roles")

    def normalized_name(self) -> str:
        return self.name.strip().lower()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    profile_image_url = db.Column(db.String(500))
    title = db.Column(db.String(100))
    status = db.Column(db.Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    last_login_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    roles = db.relationship("Role", secondary=user_roles, back_populates="users", lazy="joined")
    student = db.relationship("Student", back_populates="user", uselist=False)
    faculty = db.relationship("Faculty", back_populates="user", uselist=False)
    contact_profile = db.relationship("UserContactProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    @property
    def role_names(self) -> list[str]:
        return [role.normalized_name() for role in self.roles]

    @property
    def primary_role_name(self) -> str:
        role_set = set(self.role_names)
        for role_name in ROLE_PRIORITY:
            if role_name in role_set:
                return role_name
        return self.role_names[0] if self.role_names else "user"

    @property
    def role_scope(self) -> str:
        role_set = set(self.role_names)
        if role_set & {"admin", "administration", "director", "superadmin"}:
            return "administration"
        if role_set & {"faculty", "teacher"}:
            return "faculty"
        if "parent" in role_set:
            return "parent"
        if "student" in role_set:
            return "student"
        return self.primary_role_name

    def has_any_role(self, *role_names: str) -> bool:
        owned = set(self.role_names)
        return any(role.strip().lower() in owned for role in role_names)

    def to_dict(self):
        from ..upload_storage import build_public_file_url

        return {
            "id": str(self.id),
            "email": self.email,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "role": self.primary_role_name,
            "roles": self.role_names,
            "roleScope": self.role_scope,
            "title": self.title,
            "phone": self.contact_profile.phone_number if self.contact_profile else None,
            "profilePicture": build_public_file_url(self.profile_image_url),
        }


class UserContactProfile(db.Model):
    __tablename__ = "user_contact_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    phone_number = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = db.relationship("User", back_populates="contact_profile")


class UploadedDocument(db.Model):
    __tablename__ = "uploaded_documents"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    category = db.Column(db.String(100), nullable=False, default="general")
    original_filename = db.Column(db.String(255), nullable=False)
    storage_path = db.Column(db.String(500), nullable=False, unique=True)
    content_type = db.Column(db.String(150))
    size_bytes = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    user = db.relationship("User", backref=db.backref("uploaded_documents", lazy="dynamic"))

    def to_dict(self):
        from ..upload_storage import build_public_file_url

        return {
            "id": str(self.id),
            "userId": str(self.user_id),
            "category": self.category,
            "originalName": self.original_filename,
            "contentType": self.content_type,
            "sizeBytes": self.size_bytes,
            "storagePath": self.storage_path,
            "url": build_public_file_url(self.storage_path),
            "createdAt": self.created_at.isoformat(),
        }


class AdministrationStaff(db.Model):
    __tablename__ = "administration_staff"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    department = db.Column(db.String(100))
    designation = db.Column(db.String(100))
    employee_code = db.Column(db.String(50), unique=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = db.relationship("User", backref=db.backref("administration_profile", uselist=False))


class Faculty(db.Model):
    __tablename__ = "faculties"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    qualification = db.Column(db.String(255))
    subject_specialization = db.Column(db.String(255))
    hire_date = db.Column(db.Date)
    is_class_faculty = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = db.relationship("User", back_populates="faculty")

    def to_dict(self):
        subject_names = []
        for assignment in self.subject_assignments:
            subject = assignment.subject or db.session.get(Subject, assignment.subject_id)
            if subject is not None:
                subject_names.append(subject.name)
        return {
            "id": str(self.id),
            "firstName": self.user.first_name,
            "lastName": self.user.last_name,
            "email": self.user.email,
            "subjects": subject_names,
        }


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(20))
    address = db.Column(db.Text)
    blood_group = db.Column(db.String(10))
    emergency_contact = db.Column(db.String(20))
    admission_date = db.Column(db.Date)
    roll_number = db.Column(db.String(50))
    status = db.Column(db.Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = db.relationship("User", back_populates="student")

    def current_enrollment(self):
        return (
            ClassEnrollment.query.filter_by(student_id=self.id)
            .order_by(ClassEnrollment.id.desc())
            .first()
        )

    def to_dict(self):
        enrollment = self.current_enrollment()
        class_name = enrollment.institute_class.name if enrollment else None
        section = enrollment.institute_class.section if enrollment else None
        return {
            "id": str(self.id),
            "email": self.user.email,
            "firstName": self.user.first_name,
            "lastName": self.user.last_name,
            "role": self.user.primary_role_name,
            "roles": self.user.role_names,
            "roleScope": self.user.role_scope,
            "class": class_name,
            "section": section,
            "rollNumber": self.roll_number,
            "enrollmentNo": self.roll_number,
            "classId": str(enrollment.class_id) if enrollment else None,
        }


class Parent(db.Model):
    __tablename__ = "parents"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    relation = db.Column(db.String(50), nullable=False, default="Guardian")
    is_primary = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = db.relationship("User", backref=db.backref("parent_profile", uselist=False))
    student = db.relationship("Student")


class InstituteClass(db.Model):
    __tablename__ = "classes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    grade = db.Column(db.String(20), nullable=False)
    section = db.Column(db.String(10))
    academic_year = db.Column(db.String(20), nullable=False)
    class_faculty_id = db.Column(db.Integer, db.ForeignKey("faculties.id"))
    room_number = db.Column(db.String(20))
    max_strength = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    enrollments = db.relationship("ClassEnrollment", back_populates="institute_class", cascade="all, delete-orphan")
    class_faculty = db.relationship("Faculty")

    def to_dict(self):
        return {"id": str(self.id), "name": self.name, "level": int(self.grade), "section": self.section}


class ClassEnrollment(db.Model):
    __tablename__ = "class_enrollments"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)
    academic_year = db.Column(db.String(20), nullable=False)
    enrolled_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    institute_class = db.relationship("InstituteClass", back_populates="enrollments")


class Subject(db.Model):
    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), unique=True)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"))
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    status = db.Column(db.String(20), nullable=False, default="active")
    course_type = db.Column(db.String(30), nullable=False, default="core")
    level = db.Column(db.String(50))
    credits = db.Column(db.Integer, nullable=False, default=1)
    fee_amount = db.Column(db.Float, nullable=False, default=0)
    installment_available = db.Column(db.Boolean, nullable=False, default=False)
    max_installments = db.Column(db.Integer, nullable=False, default=1)
    start_date = db.Column(db.String(30))
    end_date = db.Column(db.String(30))
    instructor = db.Column(db.String(200))
    mode = db.Column(db.String(30), nullable=False, default="Offline")
    seats = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    def to_dict(self, faculty_id: int | None = None):
        class_name = self.institute_class.name if self.institute_class else None
        section = self.institute_class.section if self.institute_class else ""
        creator_name = None
        if self.creator is not None:
            creator_name = f"{self.creator.first_name} {self.creator.last_name}".strip()

        payload = {
            "id": str(self.id),
            "name": self.name,
            "title": self.name,
            "code": self.code,
            "description": self.description,
            "status": self.status,
            "courseType": self.course_type,
            "classId": str(self.class_id) if self.class_id is not None else None,
            "className": class_name,
            "section": section,
            "level": self.level,
            "credits": self.credits,
            "feeAmount": self.fee_amount,
            "installmentAvailable": self.installment_available,
            "maxInstallments": self.max_installments,
            "startDate": self.start_date,
            "endDate": self.end_date,
            "instructor": self.instructor,
            "mode": self.mode,
            "seats": self.seats,
            "createdBy": creator_name,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
        if faculty_id is not None:
            payload["teacherId"] = str(faculty_id)
            payload["facultyId"] = str(faculty_id)
        return payload

    institute_class = db.relationship("InstituteClass")
    creator = db.relationship("User")


class CourseEnrollment(db.Model):
    __tablename__ = "course_enrollments"
    __table_args__ = (
        db.UniqueConstraint("course_id", "student_id", name="uq_course_enrollment_course_student"),
    )

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False, index=True)
    parent_id = db.Column(db.Integer, db.ForeignKey("parents.id"))
    payment_plan = db.Column(db.String(20), nullable=False, default="one_time")
    installment_count = db.Column(db.Integer, nullable=False, default=1)
    total_fee = db.Column(db.Float, nullable=False, default=0)
    amount_paid = db.Column(db.Float, nullable=False, default=0)
    status = db.Column(db.String(20), nullable=False, default="pending_payment")
    enrolled_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    course = db.relationship("Subject")
    student = db.relationship("Student")
    parent = db.relationship("Parent")
    enrolled_by = db.relationship("User")

    @property
    def balance_due(self) -> float:
        return round(max(float(self.total_fee or 0) - float(self.amount_paid or 0), 0), 2)

    @property
    def installment_amount(self) -> float:
        count = max(int(self.installment_count or 1), 1)
        return round(float(self.total_fee or 0) / count, 2)

    def sync_status(self) -> None:
        if self.amount_paid <= 0:
            self.status = "pending_payment"
        elif self.balance_due <= 0:
            self.status = "paid"
        else:
            self.status = "partial"

    def to_dict(self):
        student_name = ""
        if self.student and self.student.user:
            student_name = f"{self.student.user.first_name} {self.student.user.last_name}".strip()

        return {
            "id": str(self.id),
            "courseId": str(self.course_id),
            "course": self.course.to_dict() if self.course is not None else None,
            "studentId": str(self.student_id),
            "studentName": student_name,
            "parentId": str(self.parent_id) if self.parent_id is not None else None,
            "paymentPlan": self.payment_plan,
            "installmentCount": self.installment_count,
            "installmentAmount": self.installment_amount,
            "totalFee": self.total_fee,
            "amountPaid": self.amount_paid,
            "balanceDue": self.balance_due,
            "status": self.status,
            "enrolledByUserId": str(self.enrolled_by_user_id),
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }


class CoursePayment(db.Model):
    __tablename__ = "course_payments"

    id = db.Column(db.Integer, primary_key=True)
    enrollment_id = db.Column(db.Integer, db.ForeignKey("course_enrollments.id"), nullable=False, index=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False, index=True)
    parent_id = db.Column(db.Integer, db.ForeignKey("parents.id"))
    paid_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False, default=0)
    payment_method = db.Column(db.String(50), nullable=False, default="online")
    installment_number = db.Column(db.Integer)
    reference_number = db.Column(db.String(100))
    receipt_number = db.Column(db.String(100), nullable=False, unique=True)
    status = db.Column(db.String(20), nullable=False, default="completed")
    paid_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    enrollment = db.relationship("CourseEnrollment", backref=db.backref("payments", lazy=True, order_by="CoursePayment.id.asc()"))
    course = db.relationship("Subject")
    student = db.relationship("Student")
    parent = db.relationship("Parent")
    paid_by = db.relationship("User")

    def to_dict(self):
        payer_name = ""
        if self.paid_by is not None:
            payer_name = f"{self.paid_by.first_name} {self.paid_by.last_name}".strip()
        course_title = self.course.name if self.course is not None else None
        return {
            "id": str(self.id),
            "enrollmentId": str(self.enrollment_id),
            "courseId": str(self.course_id),
            "courseTitle": course_title,
            "studentId": str(self.student_id),
            "parentId": str(self.parent_id) if self.parent_id is not None else None,
            "paidByUserId": str(self.paid_by_user_id),
            "paidByName": payer_name,
            "amount": self.amount,
            "paymentMethod": self.payment_method,
            "installmentNumber": self.installment_number,
            "referenceNumber": self.reference_number,
            "receiptNumber": self.receipt_number,
            "status": self.status,
            "paidAt": self.paid_at.isoformat(),
            "createdAt": self.created_at.isoformat(),
        }


Course = Subject
UpcomingCourse = Subject


class FacultySubjectAssignment(db.Model):
    __tablename__ = "faculty_subject_assignments"

    id = db.Column(db.Integer, primary_key=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey("faculties.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)
    academic_year = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    faculty = db.relationship("Faculty", backref=db.backref("subject_assignments", lazy=True))
    subject = db.relationship("Subject")
    institute_class = db.relationship("InstituteClass")


class Attendance(db.Model):
    __tablename__ = "attendance"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    attendance_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False)
    marked_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    student = db.relationship("Student")
    institute_class = db.relationship("InstituteClass")
    subject = db.relationship("Subject")

    def to_dict(self):
        return {
            "id": str(self.id),
            "studentId": str(self.student_id),
            "subjectId": str(self.subject_id),
            "courseId": str(self.subject_id),
            "date": self.attendance_date.isoformat(),
            "status": self.status.lower(),
            "markedBy": str(self.marked_by),
        }


class Mark(db.Model):
    __tablename__ = "marks"

    id = db.Column(db.Integer, primary_key=True)
    examination_name = db.Column(db.String(200), nullable=False)
    exam_type = db.Column(db.String(50), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    marks_obtained = db.Column(db.Float, nullable=False)
    total_marks = db.Column(db.Float, nullable=False)
    entered_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    exam_date = db.Column(db.Date, nullable=False)
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    def to_dict(self):
        subject = db.session.get(Subject, self.subject_id)
        return {
            "id": str(self.id),
            "studentId": str(self.student_id),
            "subjectId": str(self.subject_id),
            "courseId": str(self.subject_id),
            "subject": subject.name if subject else None,
            "courseTitle": subject.name if subject else None,
            "examType": self.exam_type,
            "marks": self.marks_obtained,
            "totalMarks": self.total_marks,
            "date": self.exam_date.isoformat(),
        }


class Schedule(db.Model):
    __tablename__ = "schedules"

    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey("faculties.id"), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)
    start_time = db.Column(db.String(10), nullable=False)
    end_time = db.Column(db.String(10), nullable=False)
    room_number = db.Column(db.String(20))
    academic_year = db.Column(db.String(20), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    institute_class = db.relationship("InstituteClass")
    subject = db.relationship("Subject")
    faculty = db.relationship("Faculty")

    def to_dict(self):
        class_name = self.institute_class.name if self.institute_class else None
        section_name = self.institute_class.section if self.institute_class else ""
        subject_name = self.subject.name if self.subject else None
        faculty_user = self.faculty.user if self.faculty and self.faculty.user else None
        faculty_name = (
            f"{faculty_user.first_name} {faculty_user.last_name}".strip()
            if faculty_user is not None
            else None
        )

        return {
            "id": str(self.id),
            "classId": str(self.class_id),
            "className": class_name,
            "sectionId": section_name or "",
            "sectionName": section_name or "",
            "dayOfWeek": self.day_of_week,
            "timeSlot": {
                "id": f"{self.day_of_week}-{self.start_time}-{self.end_time}",
                "startTime": self.start_time,
                "endTime": self.end_time,
            },
            "subject": subject_name,
            "subjectId": str(self.subject_id),
            "courseId": str(self.subject_id),
            "facultyId": str(self.faculty_id),
            "facultyName": faculty_name,
            "roomNumber": self.room_number,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
            "startTime": self.start_time,
            "endTime": self.end_time,
            "roomNo": self.room_number,
        }


class Material(db.Model):
    __tablename__ = "materials"

    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    unit = db.Column(db.String(50))
    week = db.Column(db.String(50))
    material_type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)

    subject = db.relationship("Subject")

    def to_dict(self):
        return {
            "id": str(self.id),
            "subjectId": str(self.subject_id),
            "courseId": str(self.subject_id),
            "title": self.title,
            "unit": self.unit,
            "week": self.week,
            "type": self.material_type,
            "description": self.description,
        }


class Assessment(db.Model):
    __tablename__ = "assessments"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    week = db.Column(db.String(50))
    due_date = db.Column(db.String(30))
    total_marks = db.Column(db.Integer, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    published = db.Column(db.Boolean, default=False, nullable=False)
    questions_json = db.Column(db.JSON, nullable=False, default=list)
    questions_document_id = db.Column(db.String(128), unique=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    institute_class = db.relationship("InstituteClass")
    subject = db.relationship("Subject")
    creator = db.relationship("User")

    def to_dict(self, questions=None):
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "classId": str(self.class_id),
            "subjectId": str(self.subject_id),
            "courseId": str(self.subject_id),
            "week": self.week,
            "questions": self.questions_json if questions is None else questions,
            "totalMarks": self.total_marks,
            "createdBy": str(self.created_by),
            "createdAt": self.created_at.isoformat(),
            "dueDate": self.due_date,
            "published": self.published,
            "questionsDocumentId": self.questions_document_id,
        }

class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    week = db.Column(db.String(50))
    due_date = db.Column(db.String(30), nullable=False)
    total_marks = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="open")

    subject = db.relationship("Subject")

    def to_dict(self):
        return {
            "id": str(self.id),
            "subjectId": str(self.subject_id),
            "courseId": str(self.subject_id),
            "title": self.title,
            "description": self.description,
            "week": self.week,
            "dueDate": self.due_date,
            "totalMarks": self.total_marks,
            "status": self.status,
        }


class AssignmentSubmission(db.Model):
    __tablename__ = "assignment_submissions"

    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey("assignments.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    submission_url = db.Column(db.String(500), nullable=False)
    submitted_at = db.Column(db.DateTime, nullable=False, default=utcnow)


class AssessmentSubmission(db.Model):
    __tablename__ = "assessment_submissions"

    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey("assessments.id"), nullable=False, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False, index=True)
    answers_document_id = db.Column(db.String(128), unique=True)
    status = db.Column(db.String(20), nullable=False, default="submitted")
    score = db.Column(db.Float, nullable=False, default=0)
    total_marks = db.Column(db.Float, nullable=False, default=0)
    submitted_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    evaluated_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    assessment = db.relationship("Assessment")
    student = db.relationship("Student")

    def to_dict(self, answers=None):
        student_name = ""
        if self.student and self.student.user:
            student_name = f"{self.student.user.first_name} {self.student.user.last_name}".strip()
        return {
            "id": str(self.id),
            "assessmentId": str(self.assessment_id),
            "studentId": str(self.student_id),
            "studentName": student_name,
            "status": self.status,
            "score": self.score,
            "totalMarks": self.total_marks,
            "submittedAt": self.submitted_at.isoformat() if self.submitted_at else None,
            "evaluatedAt": self.evaluated_at.isoformat() if self.evaluated_at else None,
            "answersDocumentId": self.answers_document_id,
            "answers": answers or [],
        }


class NotificationBatch(db.Model):
    __tablename__ = "notification_batches"

    id = db.Column(db.Integer, primary_key=True)
    batch_type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)


class EmailMessage(db.Model):
    __tablename__ = "email_messages"

    id = db.Column(db.Integer, primary_key=True)
    direction = db.Column(db.String(20), nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False, default="general")
    subject = db.Column(db.String(255))
    sender = db.Column(db.String(255))
    recipients = db.Column(db.JSON, nullable=False, default=list)
    cc = db.Column(db.JSON, nullable=False, default=list)
    bcc = db.Column(db.JSON, nullable=False, default=list)
    text_body = db.Column(db.Text)
    html_body = db.Column(db.Text)
    status = db.Column(db.String(30), nullable=False, default="pending")
    provider_message_id = db.Column(db.String(255), index=True)
    imap_uid = db.Column(db.String(128), unique=True)
    mailbox = db.Column(db.String(100))
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    related_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    batch_id = db.Column(db.Integer, db.ForeignKey("notification_batches.id"))
    error_message = db.Column(db.Text)
    sent_at = db.Column(db.DateTime)
    received_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    creator = db.relationship("User", foreign_keys=[created_by])
    related_user = db.relationship("User", foreign_keys=[related_user_id])
    batch = db.relationship("NotificationBatch")

    def to_dict(self):
        return {
            "id": str(self.id),
            "direction": self.direction,
            "category": self.category,
            "subject": self.subject,
            "sender": self.sender,
            "recipients": self.recipients or [],
            "cc": self.cc or [],
            "bcc": self.bcc or [],
            "textBody": self.text_body,
            "htmlBody": self.html_body,
            "status": self.status,
            "providerMessageId": self.provider_message_id,
            "imapUid": self.imap_uid,
            "mailbox": self.mailbox,
            "createdBy": str(self.created_by) if self.created_by is not None else None,
            "relatedUserId": str(self.related_user_id) if self.related_user_id is not None else None,
            "batchId": str(self.batch_id) if self.batch_id is not None else None,
            "errorMessage": self.error_message,
            "sentAt": self.sent_at.isoformat() if self.sent_at else None,
            "receivedAt": self.received_at.isoformat() if self.received_at else None,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }


class OtpChallenge(db.Model):
    __tablename__ = "otp_challenges"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False)
    purpose = db.Column(db.String(50), nullable=False)
    otp_code = db.Column(db.String(6), nullable=False)
    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)


class InventoryItem(db.Model):
    __tablename__ = "inventory_items"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False, default="other")
    quantity = db.Column(db.Integer, nullable=False, default=0)
    available = db.Column(db.Integer, nullable=False, default=0)
    reserved = db.Column(db.Integer, nullable=False, default=0)
    unit = db.Column(db.String(30), nullable=False, default="piece")
    min_stock = db.Column(db.Integer, nullable=False, default=0)
    price = db.Column(db.Float, nullable=False, default=0)
    supplier = db.Column(db.String(200))
    location = db.Column(db.String(200))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "category": self.category,
            "quantity": self.quantity,
            "available": self.available,
            "reserved": self.reserved,
            "unit": self.unit,
            "minStock": self.min_stock,
            "price": self.price,
            "supplier": self.supplier,
            "location": self.location,
            "description": self.description,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }


class MaterialRequest(db.Model):
    __tablename__ = "material_requests"

    id = db.Column(db.Integer, primary_key=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey("faculties.id"), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")
    review_notes = db.Column(db.Text)
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    requested_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    faculty = db.relationship("Faculty")
    reviewer = db.relationship("User")
    items = db.relationship("MaterialRequestItem", back_populates="request", cascade="all, delete-orphan")

    def to_dict(self):
        faculty_name = f"{self.faculty.user.first_name} {self.faculty.user.last_name}"
        return {
            "id": str(self.id),
            "facultyId": str(self.faculty_id),
            "facultyName": faculty_name,
            "department": self.department,
            "items": [item.to_dict() for item in self.items],
            "status": self.status,
            "requestedAt": self.requested_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
            "reviewedBy": (
                f"{self.reviewer.first_name} {self.reviewer.last_name}" if self.reviewer is not None else None
            ),
            "reviewNotes": self.review_notes,
        }


class MaterialRequestItem(db.Model):
    __tablename__ = "material_request_items"

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey("material_requests.id"), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey("inventory_items.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    notes = db.Column(db.Text)

    request = db.relationship("MaterialRequest", back_populates="items")
    inventory_item = db.relationship("InventoryItem")

    def to_dict(self):
        return {
            "itemId": str(self.item_id),
            "itemName": self.inventory_item.name if self.inventory_item else None,
            "quantity": self.quantity,
            "notes": self.notes,
        }


class AuthorityAssignment(db.Model):
    __tablename__ = "authority_assignments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    roles_json = db.Column(db.JSON, nullable=False, default=list)
    role_template = db.Column(db.String(100), nullable=False, default="Custom")
    authorities_json = db.Column(db.JSON, nullable=False, default=dict)
    updated_by = db.Column(db.String(100), nullable=False, default="System")
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = db.relationship("User", backref=db.backref("authority_assignment", uselist=False))

    def to_dict(self):
        return {
            "staffId": str(self.user_id),
            "userId": str(self.user_id),
            "roles": self.roles_json or [],
            "roleTemplate": self.role_template,
            "authorities": self.authorities_json or {},
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "updatedBy": self.updated_by,
        }


class SalarySlip(db.Model):
    __tablename__ = "salary_slips"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    staff_id = db.Column(db.String(50), nullable=False, index=True)  # Legacy field, kept for compatibility
    staff_name = db.Column(db.String(200), nullable=False)
    employee_code = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(30), nullable=False)
    bank_account = db.Column(db.String(100), nullable=False)
    year = db.Column(db.String(4), nullable=False, index=True)
    month_key = db.Column(db.String(10), nullable=False, index=True)
    month_label = db.Column(db.String(50), nullable=False)
    working_days = db.Column(db.Integer, nullable=False)
    payable_days = db.Column(db.Integer, nullable=False)
    paid_leave_days = db.Column(db.Integer, nullable=False, default=0)
    unpaid_leave_days = db.Column(db.Integer, nullable=False, default=0)
    overtime_hours = db.Column(db.Float, nullable=False, default=0)
    overtime_rate = db.Column(db.Float, nullable=False, default=0)
    payment_mode = db.Column(db.String(50), nullable=False, default="Bank Transfer")
    generated_on = db.Column(db.String(20), nullable=False)
    payout_status = db.Column(db.String(20), nullable=False, default="Pending")
    base_salary = db.Column(db.Float, nullable=False, default=0)
    allowances_json = db.Column(db.JSON, nullable=False, default=list)
    overtime_amount = db.Column(db.Float, nullable=False, default=0)
    unpaid_leave_deduction = db.Column(db.Float, nullable=False, default=0)
    gross_salary = db.Column(db.Float, nullable=False, default=0)
    total_deductions = db.Column(db.Float, nullable=False, default=0)
    net_salary = db.Column(db.Float, nullable=False, default=0)

    user = db.relationship("User", backref=db.backref("salary_slips", lazy=True))

    @property
    def normalized_staff_id(self) -> str:
        return str(self.user_id) if self.user_id is not None else self.staff_id

    @property
    def normalized_staff_name(self) -> str:
        if self.user is not None:
            full_name = f"{self.user.first_name} {self.user.last_name}".strip()
            if full_name:
                return full_name
        return self.staff_name

    @property
    def normalized_employee_code(self) -> str:
        admin_profile = getattr(self.user, "administration_profile", None) if self.user is not None else None
        if admin_profile is not None and admin_profile.employee_code:
            return admin_profile.employee_code
        return self.employee_code

    @property
    def normalized_role(self) -> str:
        admin_profile = getattr(self.user, "administration_profile", None) if self.user is not None else None
        if admin_profile is not None and admin_profile.designation:
            return admin_profile.designation
        if self.user is not None and self.user.title:
            return self.user.title
        return self.role

    @property
    def normalized_department(self) -> str:
        admin_profile = getattr(self.user, "administration_profile", None) if self.user is not None else None
        if admin_profile is not None and admin_profile.department:
            return admin_profile.department
        if self.user is not None and self.user.faculty is not None and self.user.faculty.subject_specialization:
            return self.user.faculty.subject_specialization
        return self.department

    def to_dict(self):
        return {
            "id": str(self.id),
            "userId": str(self.user_id) if self.user_id else None,
            "staffId": self.normalized_staff_id,
            "staffName": self.normalized_staff_name,
            "employeeCode": self.normalized_employee_code,
            "role": self.normalized_role,
            "department": self.normalized_department,
            "category": self.category,
            "bankAccount": self.bank_account,
            "year": self.year,
            "monthKey": self.month_key,
            "monthLabel": self.month_label,
            "workingDays": self.working_days,
            "payableDays": self.payable_days,
            "paidLeaveDays": self.paid_leave_days,
            "unpaidLeaveDays": self.unpaid_leave_days,
            "overtimeHours": self.overtime_hours,
            "overtimeRate": self.overtime_rate,
            "paymentMode": self.payment_mode,
            "generatedOn": self.generated_on,
            "payoutStatus": self.payout_status,
            "baseSalary": self.base_salary,
            "allowances": self.allowances_json or [],
            "overtimeAmount": self.overtime_amount,
            "unpaidLeaveDeduction": self.unpaid_leave_deduction,
            "grossSalary": self.gross_salary,
            "totalDeductions": self.total_deductions,
            "netSalary": self.net_salary,
        }


class StaffFinancialProfile(db.Model):
    __tablename__ = "staff_financial_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    bank_account = db.Column(db.String(100), nullable=True)
    base_pay = db.Column(db.Float, nullable=True)
    current_salary = db.Column(db.Float, nullable=False, default=0)
    last_increment = db.Column(db.Float, nullable=False, default=0)
    next_review = db.Column(db.Date, nullable=True)
    earnings_breakdown_json = db.Column(db.JSON, nullable=False, default=list)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = db.relationship("User", backref=db.backref("financial_profile", uselist=False))


class StaffSalaryAccount(db.Model):
    __tablename__ = "staff_salary_accounts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    account_holder_name = db.Column(db.String(200), nullable=False)
    bank_name = db.Column(db.String(200), nullable=False)
    account_number = db.Column(db.String(64), nullable=False)
    ifsc_code = db.Column(db.String(20), nullable=False)
    branch_name = db.Column(db.String(200))
    account_type = db.Column(db.String(50), nullable=False, default="Savings")
    upi_id = db.Column(db.String(100))
    proof_document_url = db.Column(db.String(500))
    proof_document_name = db.Column(db.String(255))
    verification_status = db.Column(db.String(20), nullable=False, default="approved")
    approved_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    approved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = db.relationship("User", foreign_keys=[user_id], backref=db.backref("salary_account", uselist=False))
    approver = db.relationship("User", foreign_keys=[approved_by])

    def masked_account_number(self) -> str:
        digits = self.account_number or ""
        if len(digits) <= 4:
            return digits
        return f"{'*' * max(len(digits) - 4, 0)}{digits[-4:]}"

    def to_dict(self):
        return {
            "id": str(self.id),
            "userId": str(self.user_id),
            "staffId": str(self.user_id),
            "accountHolderName": self.account_holder_name,
            "bankName": self.bank_name,
            "accountNumber": self.account_number,
            "maskedAccountNumber": self.masked_account_number(),
            "ifscCode": self.ifsc_code,
            "branchName": self.branch_name,
            "accountType": self.account_type,
            "upiId": self.upi_id,
            "proofDocumentUrl": self.proof_document_url,
            "proofDocumentName": self.proof_document_name,
            "verificationStatus": self.verification_status,
            "approvedBy": (
                f"{self.approver.first_name} {self.approver.last_name}".strip()
                if self.approver is not None
                else None
            ),
            "approvedAt": self.approved_at.isoformat() if self.approved_at else None,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }


class SalaryStructure(db.Model):
    __tablename__ = "salary_structures"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    effective_from = db.Column(db.Date, nullable=False)
    effective_to = db.Column(db.Date)
    pay_frequency = db.Column(db.String(30), nullable=False, default="monthly")
    currency = db.Column(db.String(10), nullable=False, default="INR")
    base_salary = db.Column(db.Float, nullable=False, default=0)
    allowances_json = db.Column(db.JSON, nullable=False, default=list)
    deductions_json = db.Column(db.JSON, nullable=False, default=list)
    overtime_rate_per_hour = db.Column(db.Float, nullable=False, default=0)
    overtime_rate_per_day = db.Column(db.Float, nullable=False, default=0)
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default="active")
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    approved_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = db.relationship("User", foreign_keys=[user_id], backref=db.backref("salary_structures", lazy=True))
    creator = db.relationship("User", foreign_keys=[created_by])
    approver = db.relationship("User", foreign_keys=[approved_by])

    def to_dict(self):
        return {
            "id": str(self.id),
            "userId": str(self.user_id),
            "staffId": str(self.user_id),
            "effectiveFrom": self.effective_from.isoformat() if self.effective_from else None,
            "effectiveTo": self.effective_to.isoformat() if self.effective_to else None,
            "payFrequency": self.pay_frequency,
            "currency": self.currency,
            "baseSalary": self.base_salary,
            "allowances": self.allowances_json or [],
            "deductions": self.deductions_json or [],
            "overtimeRatePerHour": self.overtime_rate_per_hour,
            "overtimeRatePerDay": self.overtime_rate_per_day,
            "notes": self.notes,
            "status": self.status,
            "createdBy": (
                f"{self.creator.first_name} {self.creator.last_name}".strip()
                if self.creator is not None
                else None
            ),
            "approvedBy": (
                f"{self.approver.first_name} {self.approver.last_name}".strip()
                if self.approver is not None
                else None
            ),
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }


class SalaryAccountChangeRequest(db.Model):
    __tablename__ = "salary_account_change_requests"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    requested_data_json = db.Column(db.JSON, nullable=False, default=dict)
    proof_document_url = db.Column(db.String(500))
    proof_document_name = db.Column(db.String(255))
    proof_notes = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default="pending")
    requested_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    reviewed_at = db.Column(db.DateTime)
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    review_notes = db.Column(db.Text)

    user = db.relationship("User", foreign_keys=[user_id], backref=db.backref("salary_account_change_requests", lazy=True))
    reviewer = db.relationship("User", foreign_keys=[reviewed_by])

    def to_dict(self):
        return {
            "id": str(self.id),
            "userId": str(self.user_id),
            "staffId": str(self.user_id),
            "requestedData": self.requested_data_json or {},
            "proofDocumentUrl": self.proof_document_url,
            "proofDocumentName": self.proof_document_name,
            "proofNotes": self.proof_notes,
            "status": self.status,
            "requestedAt": self.requested_at.isoformat() if self.requested_at else None,
            "reviewedAt": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "reviewedBy": (
                f"{self.reviewer.first_name} {self.reviewer.last_name}".strip()
                if self.reviewer is not None
                else None
            ),
            "reviewNotes": self.review_notes,
        }


class FinancialTransaction(db.Model):
    __tablename__ = "financial_transactions"

    id = db.Column(db.Integer, primary_key=True)
    transaction_code = db.Column(db.String(100), nullable=False, unique=True, index=True)
    transaction_type = db.Column(db.String(50), nullable=False, index=True)
    category = db.Column(db.String(100), nullable=False)
    direction = db.Column(db.String(20), nullable=False, default="outflow")
    amount = db.Column(db.Float, nullable=False, default=0)
    currency = db.Column(db.String(10), nullable=False, default="INR")
    payment_method = db.Column(db.String(50), nullable=False, default="bank_transfer")
    status = db.Column(db.String(20), nullable=False, default="completed")
    reference_type = db.Column(db.String(100))
    reference_id = db.Column(db.String(100))
    related_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    counterparty_name = db.Column(db.String(200))
    description = db.Column(db.Text)
    metadata_json = db.Column(db.JSON, nullable=False, default=dict)
    occurred_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    related_user = db.relationship("User", foreign_keys=[related_user_id])
    creator = db.relationship("User", foreign_keys=[created_by])

    def to_dict(self):
        return {
            "id": str(self.id),
            "transactionCode": self.transaction_code,
            "transactionType": self.transaction_type,
            "category": self.category,
            "direction": self.direction,
            "amount": self.amount,
            "currency": self.currency,
            "paymentMethod": self.payment_method,
            "status": self.status,
            "referenceType": self.reference_type,
            "referenceId": self.reference_id,
            "relatedUserId": str(self.related_user_id) if self.related_user_id is not None else None,
            "counterpartyName": self.counterparty_name,
            "description": self.description,
            "metadata": self.metadata_json or {},
            "occurredAt": self.occurred_at.isoformat() if self.occurred_at else None,
            "createdBy": (
                f"{self.creator.first_name} {self.creator.last_name}".strip()
                if self.creator is not None
                else None
            ),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class Vendor(db.Model):
    __tablename__ = "vendors"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    contact_person = db.Column(db.String(200))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(50))
    gst_number = db.Column(db.String(50))
    address = db.Column(db.Text)
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "contactPerson": self.contact_person,
            "email": self.email,
            "phone": self.phone,
            "gstNumber": self.gst_number,
            "address": self.address,
            "notes": self.notes,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }


class InventoryProcurement(db.Model):
    __tablename__ = "inventory_procurements"

    id = db.Column(db.Integer, primary_key=True)
    inventory_item_id = db.Column(db.Integer, db.ForeignKey("inventory_items.id"), nullable=False, index=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey("vendors.id"), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    unit_price = db.Column(db.Float, nullable=False, default=0)
    tax_amount = db.Column(db.Float, nullable=False, default=0)
    shipping_cost = db.Column(db.Float, nullable=False, default=0)
    total_amount = db.Column(db.Float, nullable=False, default=0)
    invoice_number = db.Column(db.String(100))
    purchase_date = db.Column(db.Date, nullable=False)
    payment_status = db.Column(db.String(20), nullable=False, default="pending")
    received_status = db.Column(db.String(20), nullable=False, default="received")
    notes = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    inventory_item = db.relationship("InventoryItem", backref=db.backref("procurements", lazy=True))
    vendor = db.relationship("Vendor", backref=db.backref("procurements", lazy=True))
    creator = db.relationship("User", foreign_keys=[created_by])

    def to_dict(self):
        return {
            "id": str(self.id),
            "inventoryItemId": str(self.inventory_item_id),
            "inventoryItemName": self.inventory_item.name if self.inventory_item is not None else None,
            "vendorId": str(self.vendor_id),
            "vendorName": self.vendor.name if self.vendor is not None else None,
            "quantity": self.quantity,
            "unitPrice": self.unit_price,
            "taxAmount": self.tax_amount,
            "shippingCost": self.shipping_cost,
            "totalAmount": self.total_amount,
            "invoiceNumber": self.invoice_number,
            "purchaseDate": self.purchase_date.isoformat() if self.purchase_date else None,
            "paymentStatus": self.payment_status,
            "receivedStatus": self.received_status,
            "notes": self.notes,
            "createdBy": (
                f"{self.creator.first_name} {self.creator.last_name}".strip()
                if self.creator is not None
                else None
            ),
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }
