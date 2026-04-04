from datetime import date, datetime, timedelta, timezone

from flask import current_app, has_app_context

from ..extensions import db
from ..models import (
    AdministrationStaff,
    Assignment,
    AssignmentSubmission,
    Assessment,
    AssessmentSubmission,
    Attendance,
    AuthorityAssignment,
    ClassEnrollment,
    Faculty,
    FacultySubjectAssignment,
    InventoryItem,
    InstituteClass,
    Mark,
    Material,
    MaterialRequest,
    MaterialRequestItem,
    NotificationBatch,
    OtpChallenge,
    Parent,
    Role,
    SalarySlip,
    Schedule,
    StaffFinancialProfile,
    Student,
    Subject,
    UpcomingCourse,
    User,
    UserContactProfile,
    user_roles,
)


STAFF_COUNT = 5
FACULTY_COUNT = 10
STUDENT_COUNT = 200
PARENT_COUNT = STUDENT_COUNT

GRADE_SECTION_PLAN = [
    ("Class 8", "8", "A"),
    ("Class 8", "8", "B"),
    ("Class 9", "9", "A"),
    ("Class 9", "9", "B"),
    ("Class 10", "10", "A"),
    ("Class 10", "10", "B"),
    ("Class 11", "11", "A"),
    ("Class 11", "11", "B"),
    ("Class 12", "12", "A"),
    ("Class 12", "12", "B"),
]

SUBJECT_BLUEPRINTS = [
    ("Mathematics", "MATH", "Mathematics concepts and practice"),
    ("Physics", "PHY", "Physics fundamentals"),
    ("Chemistry", "CHEM", "Chemistry theory and numericals"),
    ("Biology", "BIO", "Life science and biology"),
    ("English", "ENG", "Language and literature"),
    ("Computer Science", "CS", "Computing and programming"),
]

FACULTY_SPECIALIZATIONS = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "Computer Science",
    "Mathematics",
    "Physics",
    "Biology",
    "English",
]

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Krishna", "Rohan", "Karan", "Rahul",
    "Neha", "Diya", "Ananya", "Meera", "Kavya", "Ishita", "Riya", "Pooja", "Sneha", "Aditi",
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Reddy", "Rao", "Singh", "Gupta", "Kapoor", "Nair", "Das",
    "Mehta", "Kumar", "Joshi", "Saxena", "Mishra", "Yadav", "Menon", "Pillai", "Bose", "Jain",
]


def utc_today_plus(days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).date().isoformat()


def _seed_count(config_key: str, default: int) -> int:
    if has_app_context():
        return int(current_app.config.get(config_key, default))
    return default


def ensure_roles():
    role_specs = [
        ("student", "Student self-service portal access"),
        ("faculty", "Faculty teaching and classroom operations access"),
        ("parent", "Parent portal access"),
        ("admin", "Administrative control access"),
        ("administration", "Administration workspace access"),
        ("director", "Director-level approvals and institute oversight"),
        ("superadmin", "Platform-level administration access"),
    ]
    role_map = {}
    for name, description in role_specs:
        role = Role.query.filter_by(name=name).first()
        if role is None:
            role = Role(name=name, description=description)
            db.session.add(role)
        role_map[name] = role
    db.session.flush()
    return role_map


def attach_roles(user: User, *roles: Role):
    for role in roles:
        if role not in user.roles:
            user.roles.append(role)


def _reset_seeded_data():
    db.session.execute(user_roles.delete())
    ordered_models = [
        AssignmentSubmission,
        AssessmentSubmission,
        Attendance,
        Mark,
        Schedule,
        MaterialRequestItem,
        MaterialRequest,
        Assessment,
        Assignment,
        Material,
        FacultySubjectAssignment,
        ClassEnrollment,
        UpcomingCourse,
        Parent,
        Student,
        Faculty,
        AdministrationStaff,
        AuthorityAssignment,
        NotificationBatch,
        OtpChallenge,
        InventoryItem,
        SalarySlip,
        Subject,
        InstituteClass,
        UserContactProfile,
        User,
        Role,
    ]
    for model in ordered_models:
        model.query.delete()
    db.session.commit()


def _name(index: int):
    return FIRST_NAMES[index % len(FIRST_NAMES)], LAST_NAMES[(index * 3) % len(LAST_NAMES)]


def _create_user(email: str, title: str, first_name: str, last_name: str, password: str, roles: tuple[Role, ...], phone: str):
    user = User(email=email, title=title, first_name=first_name, last_name=last_name)
    user.set_password(password)
    attach_roles(user, *roles)
    db.session.add(user)
    db.session.flush()
    db.session.add(UserContactProfile(user_id=user.id, phone_number=phone))
    return user


def seed_database(force: bool = False):
    if force:
        _reset_seeded_data()
    elif User.query.first():
        return

    roles = ensure_roles()
    staff_count = _seed_count("SEED_STAFF_COUNT", STAFF_COUNT)
    faculty_count = _seed_count("SEED_FACULTY_COUNT", FACULTY_COUNT)
    student_count = _seed_count("SEED_STUDENT_COUNT", STUDENT_COUNT)
    parent_count = student_count
    users: dict[str, User] = {}

    users["admin"] = _create_user(
        "admin@example.com",
        "Administration Staff",
        "Asha",
        "Admin",
        "admin123",
        (roles["admin"], roles["administration"]),
        "+91 99999 99999",
    )
    users["director"] = _create_user(
        "director@example.com",
        "Director",
        "Diya",
        "Kapoor",
        "director123",
        (roles["director"], roles["administration"]),
        "+91 66666 66666",
    )

    admin_staff_users: list[User] = []
    for index in range(staff_count):
        first_name, last_name = _name(index + 50)
        admin_staff_users.append(
            _create_user(
                f"staff{index + 1:02d}@example.com",
                "Administration Staff",
                first_name,
                last_name,
                "staff123",
                (roles["admin"], roles["administration"]),
                f"+91 90000 20{index + 1:03d}",
            )
        )

    faculty_users: list[User] = []
    faculty_users.append(
        _create_user(
            "faculty@example.com",
            "Mathematics Faculty",
            "Ravi",
            "Sharma",
            "faculty123",
            (roles["faculty"],),
            "+91 91000 30000",
        )
    )
    for index in range(max(0, faculty_count - 1)):
        first_name, last_name = _name(index + 100)
        specialization = FACULTY_SPECIALIZATIONS[(index + 1) % len(FACULTY_SPECIALIZATIONS)]
        faculty_users.append(
            _create_user(
                f"faculty{index + 2:02d}@example.com",
                f"{specialization} Faculty",
                first_name,
                last_name,
                "faculty123",
                (roles["faculty"],),
                f"+91 91000 30{index + 2:03d}",
            )
        )

    student_users: list[User] = []
    parent_users: list[User] = []
    student_users.append(
        _create_user(
            "student@example.com",
            "Student",
            "Neha",
            "Patel",
            "student123",
            (roles["student"],),
            "+91 92000 40000",
        )
    )
    parent_users.append(
        _create_user(
            "parent@example.com",
            "Parent",
            "Meera",
            "Patel",
            "parent123",
            (roles["parent"],),
            "+91 93000 50000",
        )
    )
    for index in range(max(0, student_count - 1)):
        first_name, last_name = _name(index)
        student_users.append(
            _create_user(
                f"student{index + 2:03d}@example.com",
                "Student",
                first_name,
                last_name,
                "student123",
                (roles["student"],),
                f"+91 92000 40{index + 2:03d}",
            )
        )
        guardian_first, guardian_last = _name(index + 300)
        parent_users.append(
            _create_user(
                f"parent{index + 2:03d}@example.com",
                "Parent",
                guardian_first,
                guardian_last,
                "parent123",
                (roles["parent"],),
                f"+91 93000 50{index + 2:03d}",
            )
        )

    db.session.add(
        AdministrationStaff(
            user_id=users["admin"].id,
            department="Operations",
            designation="Administration Officer",
            employee_code="ADM-000",
        )
    )
    db.session.add_all(
        [
            AdministrationStaff(
                user_id=user.id,
                department=["Operations", "Finance", "Admissions", "HR", "Compliance"][index % 5],
                designation=["Administration Officer", "Accountant", "Admissions Coordinator", "HR Executive", "Operations Lead"][index % 5],
                employee_code=f"ADM-{index + 1:03d}",
            )
            for index, user in enumerate(admin_staff_users, start=1)
        ]
    )
    db.session.flush()

    faculties: list[Faculty] = []
    for index, user in enumerate(faculty_users):
        specialization = FACULTY_SPECIALIZATIONS[index]
        faculty = Faculty(
            user_id=user.id,
            qualification=f"M.Sc {specialization}" if specialization != "English" else "M.A English",
            subject_specialization=specialization,
            hire_date=date(2021 + (index % 4), 6 + (index % 3), 5 + (index % 10)),
            is_class_faculty=index < len(GRADE_SECTION_PLAN),
        )
        faculties.append(faculty)
    db.session.add_all(faculties)
    db.session.flush()

    students: list[Student] = []
    for index, user in enumerate(student_users):
        students.append(
            Student(
                user_id=user.id,
                admission_date=date(2024, 4, 1) + timedelta(days=index % 30),
                roll_number=f"STU-{index + 1:04d}",
            )
        )
    db.session.add_all(students)
    db.session.flush()

    db.session.add_all(
        [
            Parent(
                user_id=parent_users[index].id,
                student_id=students[index].id,
                relation="Mother" if index % 2 == 0 else "Father",
                is_primary=True,
            )
            for index in range(parent_count)
        ]
    )

    classes: list[InstituteClass] = []
    for index, (name, grade, section) in enumerate(GRADE_SECTION_PLAN):
        classes.append(
            InstituteClass(
                name=name,
                grade=grade,
                section=section,
                academic_year="2025-2026",
                class_faculty_id=faculties[index].id,
                room_number=f"{101 + index}",
                max_strength=40,
            )
        )
    db.session.add_all(classes)
    db.session.flush()

    db.session.add_all(
        [
            ClassEnrollment(
                student_id=student.id,
                class_id=classes[index % len(classes)].id,
                academic_year="2025-2026",
            )
            for index, student in enumerate(students)
        ]
    )

    subjects: list[Subject] = []
    for name, code, description in SUBJECT_BLUEPRINTS:
        for grade in ("8", "9", "10", "11", "12"):
            subjects.append(Subject(name=name, code=f"{code}-{grade}", description=description))
    db.session.add_all(subjects)
    db.session.flush()

    subject_map = {(subject.name, subject.code.split("-")[-1]): subject for subject in subjects}
    assignments_by_class: dict[int, list[FacultySubjectAssignment]] = {}
    preferred_subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science"]
    faculty_by_specialization: dict[str, list[Faculty]] = {}
    for faculty in faculties:
        faculty_by_specialization.setdefault(faculty.subject_specialization or "Mathematics", []).append(faculty)

    for index, institute_class in enumerate(classes):
        grade = institute_class.grade
        class_subject_names = [preferred_subjects[(index + shift) % len(preferred_subjects)] for shift in range(3)]
        class_assignments: list[FacultySubjectAssignment] = []
        for shift, subject_name in enumerate(class_subject_names):
            subject = subject_map[(subject_name, grade)]
            matching_faculty = faculty_by_specialization.get(subject_name) or faculties
            faculty = matching_faculty[(index + shift) % len(matching_faculty)]
            class_assignments.append(
                FacultySubjectAssignment(
                    faculty_id=faculty.id,
                    subject_id=subject.id,
                    class_id=institute_class.id,
                    academic_year="2025-2026",
                )
            )
        assignments_by_class[institute_class.id] = class_assignments
        db.session.add_all(class_assignments)
    db.session.flush()

    attendance_rows: list[Attendance] = []
    mark_rows: list[Mark] = []
    for index, student in enumerate(students):
        class_ref = classes[index % len(classes)]
        class_assignments = assignments_by_class[class_ref.id]
        for day_offset in range(4):
            assignment = class_assignments[day_offset % len(class_assignments)]
            status = ["PRESENT", "PRESENT", "LATE", "ABSENT"][(index + day_offset) % 4]
            attendance_rows.append(
                Attendance(
                    student_id=student.id,
                    class_id=class_ref.id,
                    subject_id=assignment.subject_id,
                    attendance_date=date.today() - timedelta(days=day_offset),
                    status=status,
                    marked_by=assignment.faculty.user_id,
                )
            )
        for exam_index, exam_name in enumerate(("Unit Test", "Mid Term")):
            assignment = class_assignments[exam_index % len(class_assignments)]
            marks_obtained = 55 + ((index * 7 + exam_index * 11) % 41)
            mark_rows.append(
                Mark(
                    examination_name=exam_name,
                    exam_type="UNIT_TEST" if exam_index == 0 else "MID_TERM",
                    student_id=student.id,
                    subject_id=assignment.subject_id,
                    marks_obtained=marks_obtained,
                    total_marks=100,
                    entered_by=assignment.faculty.user_id,
                    exam_date=date.today() - timedelta(days=10 - exam_index * 3),
                )
            )
    db.session.add_all(attendance_rows)
    db.session.add_all(mark_rows)

    db.session.add_all(
        [
            Schedule(
                class_id=institute_class.id,
                subject_id=assignment.subject_id,
                faculty_id=assignment.faculty_id,
                day_of_week=((class_index + assignment_index) % 6) + 1,
                start_time=f"{9 + assignment_index:02d}:00",
                end_time=f"{10 + assignment_index:02d}:00",
                room_number=institute_class.room_number,
                academic_year="2025-2026",
            )
            for class_index, institute_class in enumerate(classes)
            for assignment_index, assignment in enumerate(assignments_by_class[institute_class.id])
        ]
    )

    db.session.add_all(
        [
            Material(
                subject_id=subject.id,
                title=f"{subject.name} Notes Pack {packet_index + 1}",
                unit=f"Unit {packet_index + 1}",
                week=f"Week {packet_index + 1}",
                material_type="Notes" if packet_index % 2 == 0 else "Worksheet",
                description=f"Structured {subject.name} material for grade {subject.code.split('-')[-1]}",
            )
            for subject in subjects
            for packet_index in range(2)
        ]
    )

    assessments: list[Assessment] = []
    for index, institute_class in enumerate(classes):
        assignment = assignments_by_class[institute_class.id][0]
        assessments.append(
            Assessment(
                title=f"{institute_class.name} {institute_class.section} Assessment {index + 1}",
                description=f"Assessment for {institute_class.name} Section {institute_class.section}",
                class_id=institute_class.id,
                subject_id=assignment.subject_id,
                due_date=utc_today_plus(7 + index),
                total_marks=30,
                created_by=assignment.faculty.user_id,
                published=index % 2 == 0,
                questions_json=[
                    {
                        "id": f"q-{index + 1}-1",
                        "questionText": f"Explain concept {index + 1}",
                        "questionType": "short",
                        "marks": 5,
                        "difficulty": "medium",
                    },
                    {
                        "id": f"q-{index + 1}-2",
                        "questionText": f"Choose the correct answer for topic {index + 1}",
                        "questionType": "mcq",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correctAnswer": "Option B",
                        "marks": 5,
                        "difficulty": "easy",
                    },
                ],
                questions_document_id=f"assessment-doc-{index + 1}",
            )
        )
    db.session.add_all(assessments)

    assignments: list[Assignment] = []
    for index, institute_class in enumerate(classes):
        for variant in range(2):
            assignment_ref = assignments_by_class[institute_class.id][variant % len(assignments_by_class[institute_class.id])]
            assignments.append(
                Assignment(
                    subject_id=assignment_ref.subject_id,
                    title=f"{institute_class.name} {institute_class.section} Assignment {variant + 1}",
                    description=f"Practice work for {institute_class.name} Section {institute_class.section}",
                    due_date=utc_today_plus(3 + variant + index),
                    total_marks=20 + variant * 5,
                    status="open" if variant == 0 else "closed",
                )
            )
    db.session.add_all(assignments)
    db.session.flush()

    submissions: list[AssignmentSubmission] = []
    for index, assignment in enumerate(assignments[:20]):
        class_ref = classes[index % len(classes)]
        enrolled_students = students[index * 10:(index + 1) * 10] if index < 20 else []
        for student in enrolled_students:
            if classes[students.index(student) % len(classes)].id != class_ref.id:
                continue
            submissions.append(
                AssignmentSubmission(
                    assignment_id=assignment.id,
                    student_id=student.id,
                    submission_url=f"https://example.com/submissions/{student.roll_number.lower()}-{assignment.id}.pdf",
                )
            )
    db.session.add_all(submissions)

    db.session.add_all(
        [
            UpcomingCourse(
                title=f"{institute_class.name} {institute_class.section} Revision Program",
                description=f"Guided support program for {institute_class.name} Section {institute_class.section}.",
                class_id=institute_class.id,
                start_date=utc_today_plus(5 + index),
                end_date=utc_today_plus(20 + index),
                instructor=f"{faculties[index].user.first_name} {faculties[index].user.last_name}",
                mode=["Offline", "Online", "Hybrid"][index % 3],
                seats=30 + (index % 3) * 5,
                created_by=users["admin"].id if index % 2 == 0 else users["director"].id,
                status="active",
            )
            for index, institute_class in enumerate(classes)
        ]
    )

    db.session.add_all(
        [
            NotificationBatch(
                batch_type=batch_type,
                title=title,
                message=message,
                created_by=created_by,
            )
            for batch_type, title, message, created_by in [
                ("schedule", "Weekly Timetable Updated", "Updated schedules are available for all classes.", users["admin"].id),
                ("assessment", "Assessments Published", "New assessments have been published for multiple classes.", users["director"].id),
                ("inventory", "Inventory Status Review", "Inventory review meeting is scheduled for Friday.", admin_staff_users[0].id),
                ("attendance", "Attendance Follow-up", "Attendance below threshold requires review.", admin_staff_users[1].id),
                ("academics", "Upcoming Course Releases", "New revision programs have been published.", users["admin"].id),
            ]
        ]
    )

    db.session.add_all(
        [
            OtpChallenge(
                email=users["admin"].email,
                purpose="profile_update",
                otp_code="123456",
                is_verified=True,
                expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10),
            ),
            OtpChallenge(
                email=faculty_users[0].email,
                purpose="password_change",
                otp_code="654321",
                is_verified=False,
                expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10),
            ),
            OtpChallenge(
                email=student_users[0].email,
                purpose="login",
                otp_code="111222",
                is_verified=False,
                expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=5),
            ),
        ]
    )

    inventory_items = [
        InventoryItem(name="White Board Marker", category="stationery", quantity=150, available=120, reserved=30, unit="piece", min_stock=20, price=25, supplier="Stationery Co", location="Store Room A"),
        InventoryItem(name="A4 Paper Ream", category="stationery", quantity=200, available=180, reserved=20, unit="ream", min_stock=30, price=350, supplier="Paper Mart", location="Store Room B"),
        InventoryItem(name="Projector", category="electronics", quantity=10, available=8, reserved=2, unit="piece", min_stock=2, price=15000, supplier="Tech Solutions", location="Equipment Room"),
        InventoryItem(name="Lab Microscope", category="laboratory", quantity=12, available=9, reserved=3, unit="piece", min_stock=2, price=9000, supplier="Lab Equip", location="Lab 1"),
        InventoryItem(name="Printer Cartridge", category="electronics", quantity=25, available=20, reserved=5, unit="piece", min_stock=5, price=1800, supplier="Office Supply Hub", location="Store Room C"),
        InventoryItem(name="Chemistry Kit", category="laboratory", quantity=18, available=14, reserved=4, unit="set", min_stock=3, price=2500, supplier="Science Traders", location="Lab 2"),
        InventoryItem(name="Library Register", category="stationery", quantity=40, available=35, reserved=5, unit="piece", min_stock=8, price=120, supplier="Stationery Co", location="Library Storage"),
        InventoryItem(name="Extension Cord", category="electronics", quantity=20, available=16, reserved=4, unit="piece", min_stock=4, price=450, supplier="Tech Solutions", location="Equipment Room"),
    ]
    db.session.add_all(inventory_items)
    db.session.flush()

    material_requests: list[MaterialRequest] = []
    for index, faculty in enumerate(faculties):
        reviewer = users["admin"].id if index % 2 == 0 else users["director"].id
        material_requests.append(
            MaterialRequest(
                faculty_id=faculty.id,
                department=faculty.subject_specialization or "Academics",
                status=["pending", "approved", "rejected"][index % 3],
                review_notes=["Awaiting review", "Approved for dispatch", "Please reduce quantity"][index % 3],
                reviewed_by=reviewer if index % 3 != 0 else None,
            )
        )
    db.session.add_all(material_requests)
    db.session.flush()

    db.session.add_all(
        [
            MaterialRequestItem(
                request_id=request.id,
                item_id=inventory_items[(index + item_index) % len(inventory_items)].id,
                quantity=1 + ((index + item_index) % 5),
                notes=f"Needed for week {item_index + 1}",
            )
            for index, request in enumerate(material_requests)
            for item_index in range(2)
        ]
    )

    authority_rows: list[AuthorityAssignment] = [
        AuthorityAssignment(
            user_id=users["admin"].id,
            roles_json=["Administration Staff"],
            role_template="Administration Staff",
            authorities_json={
                "leaveApproval": True,
                "admissionApproval": True,
                "staffCreation": True,
                "studentPromotion": True,
                "scheduleCreation": True,
            },
            updated_by="System",
        ),
        AuthorityAssignment(
            user_id=users["director"].id,
            roles_json=["Director"],
            role_template="Director",
            authorities_json={
                "leaveApproval": True,
                "admissionApproval": True,
                "staffCreation": True,
                "studentPromotion": True,
                "scheduleCreation": True,
            },
            updated_by="System",
        ),
    ]
    authority_rows.extend(
        [
            AuthorityAssignment(
                user_id=user.id,
                roles_json=["Administration Staff"],
                role_template="Administration Staff",
                authorities_json={
                    "leaveApproval": index % 2 == 0,
                    "admissionApproval": True,
                    "staffCreation": index == 0,
                    "studentPromotion": index < 2,
                    "scheduleCreation": True,
                },
                updated_by="System",
            )
            for index, user in enumerate(admin_staff_users)
        ]
    )
    authority_rows.extend(
        [
            AuthorityAssignment(
                user_id=user.id,
                roles_json=[f"{FACULTY_SPECIALIZATIONS[index]} Teacher"],
                role_template=f"{FACULTY_SPECIALIZATIONS[index]} Teacher",
                authorities_json={
                    "leaveApproval": False,
                    "admissionApproval": False,
                    "staffCreation": False,
                    "studentPromotion": index % 2 == 0,
                    "scheduleCreation": True,
                },
                updated_by="System",
            )
            for index, user in enumerate(faculty_users)
        ]
    )
    db.session.add_all(authority_rows)

    salary_rows: list[SalarySlip] = []
    admin_profiles = AdministrationStaff.query.order_by(AdministrationStaff.id.asc()).all()
    for index, profile in enumerate(admin_profiles):
        user = profile.user
        salary_rows.append(
            SalarySlip(
                staff_id=f"STAFF-{profile.id:03d}",
                staff_name=f"{user.first_name} {user.last_name}",
                employee_code=profile.employee_code,
                role=profile.designation or "Administration Staff",
                department=profile.department or "Operations",
                category="Non-Teaching",
                bank_account=f"XXXXXX7{profile.id:03d}",
                year="2026",
                month_key="2026-03",
                month_label="March 2026",
                working_days=26,
                payable_days=25,
                paid_leave_days=1,
                unpaid_leave_days=0,
                overtime_hours=2 + index,
                overtime_rate=250,
                payment_mode="Bank Transfer",
                generated_on="2026-03-31",
                payout_status="Released" if index % 2 == 0 else "Pending",
                base_salary=42000 + index * 1500,
                allowances_json=[
                    {"label": "Basic Pay", "amount": 32000 + index * 1000},
                    {"label": "Operations Allowance", "amount": 5000},
                    {"label": "Transport Allowance", "amount": 3000},
                ],
                overtime_amount=(2 + index) * 250,
                unpaid_leave_deduction=0,
                gross_salary=40000 + index * 1500 + ((2 + index) * 250),
                total_deductions=0,
                net_salary=40000 + index * 1500 + ((2 + index) * 250),
            )
        )
    for index, faculty in enumerate(faculties):
        user = faculty.user
        salary_rows.append(
            SalarySlip(
                staff_id=f"FAC-{faculty.id:03d}",
                staff_name=f"{user.first_name} {user.last_name}",
                employee_code=f"EMP-{faculty.id + 9:03d}",
                role=f"{faculty.subject_specialization or 'General'} Teacher",
                department=faculty.subject_specialization or "Academics",
                category="Teaching",
                bank_account=f"XXXXXX8{faculty.id:03d}",
                year="2026",
                month_key="2026-03",
                month_label="March 2026",
                working_days=26,
                payable_days=26,
                paid_leave_days=1 + (index % 2),
                unpaid_leave_days=0,
                overtime_hours=4 + (index % 5),
                overtime_rate=350,
                payment_mode="Bank Transfer",
                generated_on="2026-03-31",
                payout_status="Released" if index % 3 != 0 else "Pending",
                base_salary=52000 + index * 1200,
                allowances_json=[
                    {"label": "Basic Pay", "amount": 39000 + index * 900},
                    {"label": "Academic Allowance", "amount": 7000},
                    {"label": "Transport Allowance", "amount": 5000},
                ],
                overtime_amount=(4 + (index % 5)) * 350,
                unpaid_leave_deduction=0,
                gross_salary=51000 + index * 1200 + ((4 + (index % 5)) * 350),
                total_deductions=0,
                net_salary=51000 + index * 1200 + ((4 + (index % 5)) * 350),
            )
        )
    db.session.add_all(salary_rows)

    profile_rows: list[StaffFinancialProfile] = []
    for slip in salary_rows:
        user = None
        admin_profile = AdministrationStaff.query.filter_by(employee_code=slip.employee_code).first()
        if admin_profile is not None:
            user = admin_profile.user
        elif slip.staff_id.startswith("FAC-"):
            faculty = faculties[int(slip.staff_id.split("-", 1)[1]) - 1]
            user = faculty.user
        if user is None:
            continue
        if any(profile.user_id == user.id for profile in profile_rows):
            continue
        profile_rows.append(
            StaffFinancialProfile(
                user_id=user.id,
                bank_account=slip.bank_account,
                base_pay=slip.base_salary,
                current_salary=slip.base_salary + sum(float(item.get("amount", 0)) for item in (slip.allowances_json or [])),
                last_increment=0,
                next_review=date(2026, 6, 30),
                earnings_breakdown_json=slip.allowances_json or [],
            )
        )
    db.session.add_all(profile_rows)

    db.session.commit()
