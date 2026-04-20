from datetime import date, datetime, timedelta, timezone
import logging
from flask import current_app

from ..extensions import db
from ..document_store.mongo import InMemoryDocumentStore, MongoDocumentStore
from ..models import (
    AdministrationStaff,
    Assignment,
    AssignmentSubmission,
    Assessment,
    AssessmentSubmission,
    Attendance,
    AuthorityAssignment,
    ClassEnrollment,
    CourseEnrollment,
    CoursePayment,
    Faculty,
    FacultySubjectAssignment,
    FinancialTransaction,
    InventoryItem,
    InventoryProcurement,
    InstituteClass,
    Mark,
    Material,
    MaterialRequest,
    MaterialRequestItem,
    NotificationBatch,
    OtpChallenge,
    Parent,
    Role,
    SalaryAccountChangeRequest,
    SalarySlip,
    SalaryStructure,
    Schedule,
    StaffFinancialProfile,
    StaffSalaryAccount,
    Student,
    Subject,
    User,
    UserContactProfile,
    Vendor,
    user_roles,
)


STAFF_COUNT = 8
FACULTY_COUNT = 12
STUDENT_COUNT = 150
PARENT_COUNT = STUDENT_COUNT

# Real-world coaching institute structure
INSTITUTE_NAME = "Apex Academy - Excellence in Education"
INSTITUTE_ADDRESS = "Plot No. 123, Tech Park, Bengaluru - 560001"
INSTITUTE_PHONE = "+91-80-4567-8900"

GRADE_SECTION_PLAN = [
    ("Class 8", "8", "A"),
    ("Class 8", "8", "B"),
    ("Class 9", "9", "A"),
    ("Class 9", "9", "B"),
    ("Class 10", "10", "A"),
    ("Class 10", "10", "B"),
    ("Class 11 (CBSE)", "11", "A"),
    ("Class 11 (CBSE)", "11", "B"),
    ("Class 12 (CBSE)", "12", "A"),
    ("Class 12 (CBSE)", "12", "B"),
]

SUBJECT_BLUEPRINTS = [
    ("Mathematics", "MATH", "Comprehensive mathematics covering algebra, geometry, and calculus concepts with practice problems"),
    ("Physics", "PHY", "Physics fundamentals including mechanics, thermodynamics, and modern physics"),
    ("Chemistry", "CHEM", "Chemistry theory with balanced numericals and practicals for competitive exams"),
    ("Biology", "BIO", "Life science and biology with diagrams, practicals, and conceptual clarity"),
    ("English", "ENG", "English language and literature with comprehension and creative writing"),
    ("Computer Science", "CS", "Computing and programming with hands-on coding practice and algorithms"),
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
    "Chemistry",
    "Biology",
    "English",
    "Computer Science",
]

# Indian names - realistic and authentic
FIRST_NAMES = [
    # Male names
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Krishna", "Rohan", "Karan", "Rahul",
    "Aryan", "Ishaan", "Nikunj", "Pranav", "Vedant", "Abhishek", "Aman", "Akshay", "Ankit", "Ashok",
    "Harshit", "Hardik", "Harsh", "Vikram", "Varun", "Manish", "Mohan", "Mukesh", "Neeraj", "Nitin",
    # Female names
    "Neha", "Diya", "Ananya", "Meera", "Kavya", "Ishita", "Riya", "Pooja", "Sneha", "Aditi",
    "Isha", "Avni", "Bhavna", "Chhavi", "Divya", "Ekta", "Farah", "Gitika", "Hema", "Ila",
    "Jyoti", "Kalpana", "Lakshmi", "Megha", "Nisha", "Ojasvi", "Priya", "Priyanka", "Rashmi", "Ria",
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Reddy", "Rao", "Singh", "Gupta", "Kapoor", "Nair", "Das",
    "Mehta", "Kumar", "Joshi", "Saxena", "Mishra", "Yadav", "Menon", "Pillai", "Bose", "Jain",
    "Agarwal", "Arora", "Bhatt", "Chopra", "Dutta", "Gill", "Iyer", "Kaur", "Malhotra", "Malik",
    "Namdev", "Oza", "Pandya", "Quadri", "Rastogi", "Sharma", "Thakur", "Unni", "Vaidya", "Vyas",
    "Walia", "Yadav", "Zondal", "Tripathi", "Tiwari", "Trivedi", "Bharat", "Bansal", "Bansode", "Bajaj",
]


def utc_today_plus(days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).date().isoformat()


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


def _seed_mongodb():
    """Seed MongoDB collections with assessment and material documents."""
    try:
        doc_store = current_app.document_store
        if doc_store is None:
            return
        
        # Seed assessment documents
        for i in range(10):
            doc_store.insert_one("assessments", {
                "title": f"Assessment Document {i+1}",
                "subject": f"Subject {i+1}",
                "class": f"Class {8 + (i % 5)}",
                "questions": [
                    {"id": f"q-{i+1}-1", "text": f"Question {i+1}-1", "type": "mcq"},
                    {"id": f"q-{i+1}-2", "text": f"Question {i+1}-2", "type": "short_answer"},
                ],
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        
        # Seed material documents
        for i in range(30):
            doc_store.insert_one("materials", {
                "title": f"Study Material {i+1}",
                "subject": f"Subject {(i % 6) + 1}",
                "grade": str(8 + (i % 5)),
                "unit": f"Unit {(i % 4) + 1}",
                "type": "notes" if i % 2 == 0 else "worksheet",
                "content": f"Structured content for material {i+1}",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        
        logging.getLogger(__name__).info(f"✓ MongoDB seeded successfully with 40 documents")
    except Exception as e:
        logging.getLogger(__name__).warning(f"MongoDB seeding skipped: {e}")


def _reset_seeded_data():
    # Clear SQL database
    db.session.execute(user_roles.delete())
    ordered_models = [
        AssignmentSubmission,
        AssessmentSubmission,
        FinancialTransaction,
        CoursePayment,
        CourseEnrollment,
        Attendance,
        Mark,
        Schedule,
        MaterialRequestItem,
        MaterialRequest,
        InventoryProcurement,
        Assessment,
        Assignment,
        Material,
        FacultySubjectAssignment,
        ClassEnrollment,
        Parent,
        Student,
        Faculty,
        SalaryAccountChangeRequest,
        StaffSalaryAccount,
        SalaryStructure,
        StaffFinancialProfile,
        AdministrationStaff,
        AuthorityAssignment,
        NotificationBatch,
        OtpChallenge,
        InventoryItem,
        Vendor,
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
    
    # Clear MongoDB collections
    try:
        doc_store = current_app.document_store
        if doc_store and isinstance(doc_store, (MongoDocumentStore, InMemoryDocumentStore)):
            for collection_name in ["assessments", "materials", "questions", "submissions"]:
                if hasattr(doc_store, 'database'):  # MongoDB
                    doc_store.database[collection_name].delete_many({})
                elif hasattr(doc_store, 'collections'):  # InMemory
                    doc_store.collections[collection_name] = {}
            logging.getLogger(__name__).info("✓ MongoDB collections cleared")
    except Exception as e:
        logging.getLogger(__name__).warning(f"MongoDB cleanup skipped: {e}")


def _name(index: int):
    return FIRST_NAMES[index % len(FIRST_NAMES)], LAST_NAMES[(index * 3) % len(LAST_NAMES)]


def _create_user(email: str, title: str, first_name: str, last_name: str, password: str, roles: tuple[Role, ...], phone: str):
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return existing_user
    
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
    users: dict[str, User] = {}

    # Director - Institute head
    users["director"] = _create_user(
        "director@example.in",
        "Director",
        "Rajesh",
        "Kumar",
        "admin123",
        (roles["director"], roles["administration"]),
        "+91 98765 43210",
    )

    # Principal/Administrator
    users["admin"] = _create_user(
        "admin@example.in",
        "Principal",
        "Priya",
        "Sharma",
        "admin123",
        (roles["admin"], roles["administration"]),
        "+91 98765 43211",
    )

    # Administration Staff
    admin_staff_users: list[User] = []
    admin_departments = [
        ("Operations", "Head of Operations", "+91 98765 4320"),
        ("Finance & Accounts", "Accounts Manager", "+91 98765 4321"),
        ("Admissions", "Admissions Coordinator", "+91 98765 4322"),
        ("HR & Compliance", "HR Manager", "+91 98765 4323"),
        ("Support Services", "Support Manager", "+91 98765 4324"),
        ("Academics", "Academic Coordinator", "+91 98765 4325"),
        ("Student Services", "Student Services Officer", "+91 98765 4326"),
        ("Technology", "IT Administrator", "+91 98765 4327"),
    ]
    
    for index in range(STAFF_COUNT):
        dept_name, designation, base_phone = admin_departments[index % len(admin_departments)]
        first_name, last_name = _name(index + 50)
        admin_staff_users.append(
            _create_user(
                f"staff{index + 1:03d}.{first_name.lower()}@example.in",
                designation,
                first_name,
                last_name,
                "admin123",
                (roles["admin"], roles["administration"]),
                f"{base_phone}{index + 1:02d}",
            )
        )

    # Faculty members - High quality teachers
    faculty_users: list[User] = []
    for index in range(FACULTY_COUNT):
        first_name, last_name = _name(index + 100)
        specialization = FACULTY_SPECIALIZATIONS[index]
        faculty_users.append(
            _create_user(
                f"faculty{index + 1:03d}.{first_name.lower()}@example.in",
                f"{specialization} Teacher",
                first_name,
                last_name,
                "faculty123",
                (roles["faculty"],),
                f"+91 97000 3{index + 1:04d}",
            )
        )

    # Students and Parents
    student_users: list[User] = []
    parent_users: list[User] = []
    for index in range(STUDENT_COUNT):
        first_name, last_name = _name(index)
        student_users.append(
            _create_user(
                f"student{index + 1:04d}.{first_name.lower()}@example.in",
                "Student",
                first_name,
                last_name,
                "student123",
                (roles["student"],),
                f"+91 92000 4{index + 1:04d}",
            )
        )
        # Parents with different relationships (Mother/Father/Guardian)
        parent_relation = ["Mother", "Father", "Guardian"][(index + index // 3) % 3]
        guardian_first, guardian_last = _name(index + 300)
        parent_users.append(
            _create_user(
                f"parent{index + 1:04d}.{guardian_first.lower()}@example.in",
                parent_relation,
                guardian_first,
                guardian_last,
                "parent123",
                (roles["parent"],),
                f"+91 93000 5{index + 1:04d}",
            )
        )

    db.session.add_all(
        [
            AdministrationStaff(
                user_id=user.id,
                department=admin_departments[index % len(admin_departments)][0],
                designation=admin_departments[index % len(admin_departments)][1],
                employee_code=f"ADM-{index + 1:03d}",
            )
            for index, user in enumerate(admin_staff_users)
        ]
    )
    db.session.add_all(
        [
            AdministrationStaff(
                user_id=user.id,
                department=FACULTY_SPECIALIZATIONS[index],
                designation=f"{FACULTY_SPECIALIZATIONS[index]} Teacher",
                employee_code=f"EMP-{index + 10:03d}",
            )
            for index, user in enumerate(faculty_users)
        ]
    )

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
                admission_date=date(2024, 6, 1) + timedelta(days=index % 30),
                roll_number=f"APX{date.today().year}-{index + 1:04d}",
            )
        )
    db.session.add_all(students)
    db.session.flush()

    db.session.add_all(
        [
            Parent(
                user_id=parent_users[index].id,
                student_id=students[index].id,
                relation=["Mother", "Father", "Guardian"][(index + index // 3) % 3],
                is_primary=True,
            )
            for index in range(PARENT_COUNT)
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
                room_number=f"{201 + index}",
                max_strength=40,
            )
        )
    db.session.add_all(classes)
    db.session.flush()

    # Enroll students across classes evenly
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
            subjects.append(
                Subject(
                    name=name,
                    code=f"{code}-{grade}",
                    description=description,
                    course_type="core",
                    status="active",
                    credits=1,
                    fee_amount=0,
                    created_by=users["admin"].id,
                    is_active=True,
                )
            )
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

    program_courses: list[Subject] = []
    program_names = {
        "8": "Class 8 Comprehensive Review",
        "9": "Class 9 Intensive Coaching",
        "10": "Class 10 Board Preparation",
        "11": "Class 11 Competitive Exam Prep",
        "12": "Class 12 Final Revision",
    }
    
    for index, institute_class in enumerate(classes):
        program_name = program_names.get(institute_class.grade, f"Class {institute_class.grade} Program")
        program_courses.append(
            Subject(
                name=f"{program_name} - Section {institute_class.section}",
                code=f"PRG-{institute_class.grade}-{institute_class.section}-{index + 1}",
                description=f"Intensive coaching and revision program for {institute_class.name} Section {institute_class.section}. Covers all key topics with practice tests and assignments.",
                class_id=institute_class.id,
                start_date=utc_today_plus(5 + index),
                end_date=utc_today_plus(60 + index),
                instructor=f"{faculties[index].user.first_name} {faculties[index].user.last_name}",
                mode=["Offline", "Online", "Hybrid"][index % 3],
                seats=35,
                created_by=users["admin"].id if index % 2 == 0 else users["director"].id,
                status="upcoming" if index % 3 == 0 else "active",
                course_type="program",
                level=institute_class.grade,
                credits=3,
                fee_amount=4500 + (index % 5) * 1000,
                installment_available=True,
                max_installments=3 if index % 2 == 0 else 1,
                is_active=True,
            )
        )
    db.session.add_all(program_courses)
    db.session.flush()

    program_course_by_class = {}
    for course in program_courses:
        program_course_by_class.setdefault(course.class_id, []).append(course)

    seeded_course_enrollments: list[CourseEnrollment] = []
    seeded_course_payments: list[CoursePayment] = []
    for index, student in enumerate(students[:12]):
        class_ref = classes[index % len(classes)]
        available_courses = program_course_by_class.get(class_ref.id) or []
        if not available_courses:
            continue
        course = available_courses[0]
        enrollment = CourseEnrollment(
            course_id=course.id,
            student_id=student.id,
            parent_id=Parent.query.filter_by(student_id=student.id, is_primary=True).first().id,
            payment_plan="installments" if index % 2 == 0 else "one_time",
            installment_count=3 if index % 2 == 0 else 1,
            total_fee=course.fee_amount,
            amount_paid=course.fee_amount / 3 if index % 2 == 0 else course.fee_amount,
            enrolled_by_user_id=(Parent.query.filter_by(student_id=student.id, is_primary=True).first().user_id),
            status="partial" if index % 2 == 0 else "paid",
        )
        enrollment.sync_status()
        seeded_course_enrollments.append(enrollment)
    db.session.add_all(seeded_course_enrollments)
    db.session.flush()

    for index, enrollment in enumerate(seeded_course_enrollments):
        amount = round(float(enrollment.amount_paid or 0), 2)
        if amount <= 0:
            continue
        seeded_course_payments.append(
            CoursePayment(
                enrollment_id=enrollment.id,
                course_id=enrollment.course_id,
                student_id=enrollment.student_id,
                parent_id=enrollment.parent_id,
                paid_by_user_id=enrollment.enrolled_by_user_id,
                amount=amount,
                payment_method="online",
                installment_number=1,
                reference_number=f"SEED-PAY-{index + 1:04d}",
                receipt_number=f"RCT-SEED-{index + 1:04d}",
                status="completed",
            )
        )
    db.session.add_all(seeded_course_payments)
    db.session.flush()

    db.session.add_all(
        [
            NotificationBatch(
                batch_type=batch_type,
                title=title,
                message=message,
                created_by=created_by,
            )
            for batch_type, title, message, created_by in [
                ("schedule", "Weekly Timetable Published", "Dear Students and Parents, the updated class schedule for this week has been published. Please refer to the class portal for details.", users["admin"].id),
                ("assessment", "Assessments Released", "New semester assessments have been released for Class 8-12. Students must complete all assessments by the given due dates.", users["director"].id),
                ("inventory", "Lab Equipment Status", "Inventory audit completed. New equipment has been procured for science and computer labs.", admin_staff_users[0].id),
                ("attendance", "Monthly Attendance Report", "Attendance below 75% detected for some students. Parents are requested to ensure regular attendance.", admin_staff_users[1].id),
                ("academics", "Revision Programs Available", "Enroll now for intensive revision programs to prepare for board exams. Limited seats available.", users["admin"].id),
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
        InventoryItem(name="Blue Ballpoint Pen (Box of 50)", category="stationery", quantity=200, available=160, reserved=40, unit="box", min_stock=50, price=180, supplier="Apex Stationery Supplies", location="Store Room A"),
        InventoryItem(name="A4 Paper Ream (500 sheets)", category="stationery", quantity=250, available=210, reserved=40, unit="ream", min_stock=50, price=320, supplier="Apex Stationery Supplies", location="Store Room B"),
        InventoryItem(name="Interactive LED Projector", category="electronics", quantity=12, available=10, reserved=2, unit="piece", min_stock=3, price=18000, supplier="Tech Education Solutions", location="Equipment Room"),
        InventoryItem(name="Compound Microscope (40x)", category="laboratory", quantity=15, available=12, reserved=3, unit="piece", min_stock=3, price=8500, supplier="Science Lab Equipment Co.", location="Biology Lab"),
        InventoryItem(name="Laser Printer Cartridge (Black)", category="electronics", quantity=30, available=24, reserved=6, unit="piece", min_stock=8, price=1600, supplier="Tech Education Solutions", location="Office Store"),
        InventoryItem(name="Chemistry Lab Kit (Reagents Bundle)", category="laboratory", quantity=20, available=16, reserved=4, unit="set", min_stock=5, price=3200, supplier="Science Lab Equipment Co.", location="Chemistry Lab"),
        InventoryItem(name="Register Notebook (100 pages)", category="stationery", quantity=500, available=420, reserved=80, unit="piece", min_stock=100, price=45, supplier="Apex Stationery Supplies", location="Library Storage"),
        InventoryItem(name="Extension Power Cord (10m)", category="electronics", quantity=25, available=20, reserved=5, unit="piece", min_stock=5, price=480, supplier="Tech Education Solutions", location="Equipment Room"),
        InventoryItem(name="Physics Apparatus Set (Mechanics)", category="laboratory", quantity=10, available=8, reserved=2, unit="set", min_stock=2, price=4500, supplier="Science Lab Equipment Co.", location="Physics Lab"),
        InventoryItem(name="Reference Book Bundle (Class 10)", category="library", quantity=50, available=45, reserved=5, unit="set", min_stock=10, price=2800, supplier="Scholar's Library Services", location="Library"),
    ]
    db.session.add_all(inventory_items)
    db.session.flush()

    material_requests: list[MaterialRequest] = []
    request_statuses = ["pending", "approved", "rejected"]
    review_comments = [
        "Awaiting approval from head of department",
        "Approved for procurement. Forwarding to vendor.",
        "Please reduce quantity to fit budget allocation",
    ]
    
    for index, faculty in enumerate(faculties):
        reviewer = users["admin"].id if index % 2 == 0 else users["director"].id
        request_status = request_statuses[index % 3]
        material_requests.append(
            MaterialRequest(
                faculty_id=faculty.id,
                department=faculty.subject_specialization or "Academics",
                status=request_status,
                review_notes=review_comments[index % 3],
                reviewed_by=reviewer if request_status != "pending" else None,
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
                "procurementManagement": True,
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
                "procurementManagement": True,
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
                    "procurementManagement": index < 2,
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
                    "procurementManagement": False,
                },
                updated_by="System",
            )
            for index, user in enumerate(faculty_users)
        ]
    )
    db.session.add_all(authority_rows)

    salary_rows: list[SalarySlip] = []
    for index, user in enumerate(admin_staff_users):
        salary_rows.append(
            SalarySlip(
                user_id=user.id,
                staff_id=f"STAFF-{index + 1:03d}",
                staff_name=f"{user.first_name} {user.last_name}",
                employee_code=f"ADM-{index + 1:03d}",
                role="Administration Staff",
                department=["Operations", "Finance", "Admissions", "HR", "Compliance"][index % 5],
                category="Non-Teaching",
                bank_account=f"XXXXXX7{index + 1:03d}",
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
    for index, user in enumerate(faculty_users):
        salary_rows.append(
            SalarySlip(
                user_id=user.id,
                staff_id=f"FAC-{index + 1:03d}",
                staff_name=f"{user.first_name} {user.last_name}",
                employee_code=f"EMP-{index + 10:03d}",
                role=f"{FACULTY_SPECIALIZATIONS[index]} Teacher",
                department=FACULTY_SPECIALIZATIONS[index],
                category="Teaching",
                bank_account=f"XXXXXX8{index + 1:03d}",
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
    db.session.flush()

    db.session.add_all(
        [
            StaffSalaryAccount(
                user_id=user.id,
                account_holder_name=f"{user.first_name} {user.last_name}",
                bank_name="State Bank of India",
                account_number=f"1002003004{index + 1:03d}",
                ifsc_code="SBIN0000456",
                branch_name="Main Campus Branch",
                account_type="Savings",
                upi_id=f"{user.first_name.lower()}.{index + 1}@sbi",
                proof_document_url="https://example.com/proof/passbook.pdf",
                proof_document_name="passbook.pdf",
                verification_status="approved",
                approved_by=users["admin"].id,
                approved_at=datetime.now(timezone.utc).replace(tzinfo=None),
            )
            for index, user in enumerate(admin_staff_users[:3] + faculty_users[:4])
        ]
    )

    db.session.add_all(
        [
            SalaryStructure(
                user_id=user.id,
                effective_from=date(2026, 4, 1),
                pay_frequency="monthly",
                currency="INR",
                base_salary=50000 + index * 1500,
                allowances_json=[
                    {"label": "Housing Allowance", "amount": 8000},
                    {"label": "Transport Allowance", "amount": 3000},
                ],
                deductions_json=[
                    {"label": "Provident Fund", "amount": 1800},
                ],
                overtime_rate_per_hour=300 + (index * 10),
                overtime_rate_per_day=2200 + (index * 50),
                notes="Seeded salary structure",
                status="active",
                created_by=users["admin"].id,
                approved_by=users["director"].id,
            )
            for index, user in enumerate(admin_staff_users[:2] + faculty_users[:4])
        ]
    )

    db.session.add(
        SalaryAccountChangeRequest(
            user_id=faculty_users[0].id,
            requested_data_json={
                "accountHolderName": f"{faculty_users[0].first_name} {faculty_users[0].last_name}",
                "bankName": "HDFC Bank",
                "accountNumber": "887766554433",
                "ifscCode": "HDFC0001234",
                "branchName": "City Branch",
                "accountType": "Savings",
                "proofDocumentUrl": "https://example.com/proof/cancelled-cheque.pdf",
                "proofDocumentName": "cancelled-cheque.pdf",
            },
            proof_document_url="https://example.com/proof/cancelled-cheque.pdf",
            proof_document_name="cancelled-cheque.pdf",
            proof_notes="Updated salary account after bank migration.",
            status="pending",
        )
    )

    vendors = [
        Vendor(
            name="Apex Stationery Supplies", 
            contact_person="Mr. Suresh Kumar", 
            email="orders@apexstationery.in", 
            phone="+91 98765 10001", 
            gst_number="29ABCDE1234F1Z5", 
            address="Rajajinagar, Bengaluru - 560010", 
            notes="Primary stationery supplier for all classes and offices"
        ),
        Vendor(
            name="Tech Education Solutions", 
            contact_person="Ms. Neha Kapoor", 
            email="sales@techedu.in", 
            phone="+91 98765 20001", 
            gst_number="29FGHIJ5678F1Z9", 
            address="Electronic City, Bengaluru - 560100", 
            notes="Laboratory equipment, projectors, and educational technology"
        ),
        Vendor(
            name="Scholar's Library Services", 
            contact_person="Mr. Vikas Sharma", 
            email="library@scholars.in", 
            phone="+91 98765 30001", 
            gst_number="29KLMNO9012F1Z3", 
            address="Whitefield, Bengaluru - 560066", 
            notes="Reference books, study materials, and library subscriptions"
        ),
        Vendor(
            name="Science Lab Equipment Co.", 
            contact_person="Dr. Rajesh Patel", 
            email="lab@scienceequip.in", 
            phone="+91 98765 40001", 
            gst_number="29PQRST3456F1Z7", 
            address="Marathahalli, Bengaluru - 560037", 
            notes="Laboratory apparatus, chemicals, and experiment kits"
        ),
    ]
    db.session.add_all(vendors)
    db.session.flush()

    procurements = [
        InventoryProcurement(
            inventory_item_id=inventory_items[0].id,
            vendor_id=vendors[0].id,
            quantity=60,
            unit_price=170,
            tax_amount=1836,
            shipping_cost=100,
            total_amount=12336,
            invoice_number="APX-SS-2603-001",
            purchase_date=date(2026, 4, 2),
            payment_status="completed",
            received_status="received",
            notes="Restocked ballpoint pens for classrooms and offices",
            created_by=users["admin"].id,
        ),
        InventoryProcurement(
            inventory_item_id=inventory_items[2].id,
            vendor_id=vendors[1].id,
            quantity=2,
            unit_price=17500,
            tax_amount=6300,
            shipping_cost=500,
            total_amount=41800,
            invoice_number="TES-EQ-2603-156",
            purchase_date=date(2026, 4, 5),
            payment_status="completed",
            received_status="received",
            notes="Two interactive LED projectors for senior classes and lecture halls",
            created_by=users["director"].id,
        ),
        InventoryProcurement(
            inventory_item_id=inventory_items[5].id,
            vendor_id=vendors[3].id,
            quantity=8,
            unit_price=3100,
            tax_amount=2976,
            shipping_cost=300,
            total_amount=28076,
            invoice_number="SLEC-CH-2603-089",
            purchase_date=date(2026, 4, 10),
            payment_status="pending",
            received_status="pending",
            notes="Chemistry lab reagent kits for practical sessions",
            created_by=admin_staff_users[0].id,
        ),
    ]
    db.session.add_all(procurements)
    db.session.flush()

    db.session.add_all(
        [
            FinancialTransaction(
                transaction_code="FTX-000001",
                transaction_type="course_payment",
                category="course_fee",
                direction="inflow",
                amount=seeded_course_payments[0].amount if seeded_course_payments else 0,
                payment_method="online",
                status="completed",
                reference_type="course_payment",
                reference_id=str(seeded_course_payments[0].id) if seeded_course_payments else None,
                related_user_id=students[0].user_id,
                counterparty_name=f"{parent_users[0].first_name} {parent_users[0].last_name}",
                description="Seeded course fee payment",
                metadata_json={"receiptNumber": seeded_course_payments[0].receipt_number if seeded_course_payments else None},
                occurred_at=datetime.now(timezone.utc).replace(tzinfo=None),
                created_by=parent_users[0].id,
            ),
            FinancialTransaction(
                transaction_code="FTX-000002",
                transaction_type="salary_payment",
                category="payroll",
                direction="outflow",
                amount=salary_rows[0].net_salary if salary_rows else 0,
                payment_method="bank_transfer",
                status="completed",
                reference_type="salary_slip",
                reference_id=str(salary_rows[0].id) if salary_rows else None,
                related_user_id=salary_rows[0].user_id if salary_rows else None,
                counterparty_name=salary_rows[0].staff_name if salary_rows else None,
                description="Seeded salary payment transaction",
                metadata_json={"monthKey": salary_rows[0].month_key if salary_rows else None},
                occurred_at=datetime.now(timezone.utc).replace(tzinfo=None),
                created_by=users["admin"].id,
            ),
            FinancialTransaction(
                transaction_code="FTX-000003",
                transaction_type="inventory_procurement",
                category="inventory_expense",
                direction="outflow",
                amount=procurements[0].total_amount,
                payment_method="vendor_invoice",
                status=procurements[0].payment_status,
                reference_type="inventory_procurement",
                reference_id=str(procurements[0].id),
                counterparty_name=vendors[0].name,
                description="Seeded procurement expense",
                metadata_json={"inventoryItemId": str(procurements[0].inventory_item_id)},
                occurred_at=datetime.now(timezone.utc).replace(tzinfo=None),
                created_by=users["admin"].id,
            ),
        ]
    )

    db.session.commit()
    
    # Seed MongoDB documents
    _seed_mongodb()
    
    logging.getLogger(__name__).info(f"✓ Database seeding completed: {STUDENT_COUNT} students, {FACULTY_COUNT} faculty, {STAFF_COUNT} staff")
