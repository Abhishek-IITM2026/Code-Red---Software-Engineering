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
    phone = db.Column(db.String(20))
    profile_image_url = db.Column(db.String(500))
    title = db.Column(db.String(100))
    status = db.Column(db.Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    last_login_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    roles = db.relationship("Role", secondary=user_roles, back_populates="users", lazy="joined")
    student = db.relationship("Student", back_populates="user", uselist=False)
    faculty = db.relationship("Faculty", back_populates="user", uselist=False)

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
        return {
            "id": str(self.id),
            "email": self.email,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "role": self.primary_role_name,
            "roles": self.role_names,
            "roleScope": self.role_scope,
            "title": self.title,
            "phone": self.phone,
            "profilePicture": self.profile_image_url,
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
        return {
            "id": str(self.id),
            "firstName": self.user.first_name,
            "lastName": self.user.last_name,
            "email": self.user.email,
            "subjects": [assignment.subject.name for assignment in self.subject_assignments],
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
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), unique=True)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    def to_dict(self, faculty_id: int | None = None):
        payload = {"id": str(self.id), "name": self.name, "code": self.code}
        if faculty_id is not None:
            payload["teacherId"] = str(faculty_id)
            payload["facultyId"] = str(faculty_id)
            payload["credits"] = 1
        return payload


class FacultySubjectAssignment(db.Model):
    __tablename__ = "faculty_subject_assignments"

    id = db.Column(db.Integer, primary_key=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey("faculties.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
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
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
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
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
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
            "subject": subject.name if subject else None,
            "examType": self.exam_type,
            "marks": self.marks_obtained,
            "totalMarks": self.total_marks,
            "date": self.exam_date.isoformat(),
        }


class Schedule(db.Model):
    __tablename__ = "schedules"

    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
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
        return {
            "id": str(self.id),
            "classId": str(self.class_id),
            "className": self.institute_class.name,
            "sectionId": self.institute_class.section or "",
            "sectionName": self.institute_class.section or "",
            "dayOfWeek": self.day_of_week,
            "timeSlot": {
                "id": f"{self.day_of_week}-{self.start_time}-{self.end_time}",
                "startTime": self.start_time,
                "endTime": self.end_time,
            },
            "subject": self.subject.name,
            "subjectId": str(self.subject_id),
            "facultyId": str(self.faculty_id),
            "facultyName": f"{self.faculty.user.first_name} {self.faculty.user.last_name}",
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
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    unit = db.Column(db.String(50))
    week = db.Column(db.String(50))
    material_type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)

    subject = db.relationship("Subject")

    def to_dict(self):
        return {
            "id": str(self.id),
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
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
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
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.String(30), nullable=False)
    total_marks = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="open")

    subject = db.relationship("Subject")

    def to_dict(self):
        return {
            "id": str(self.id),
            "subjectId": str(self.subject_id),
            "title": self.title,
            "description": self.description,
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


class NotificationBatch(db.Model):
    __tablename__ = "notification_batches"

    id = db.Column(db.Integer, primary_key=True)
    batch_type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)


class OtpChallenge(db.Model):
    __tablename__ = "otp_challenges"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False)
    purpose = db.Column(db.String(50), nullable=False)
    otp_code = db.Column(db.String(6), nullable=False)
    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
