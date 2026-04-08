from typing import Any

from flask import g

from ..api.errors import ApiError
from ..extensions import db
from ..models import Assignment, Attendance, FacultySubjectAssignment, InstituteClass, Mark, Student, Subject


DEFAULT_WEEKLY_SUBJECT_CONTENT_TEMPLATE: list[dict[str, Any]] = [
    {
        "title": "{subject} Foundations",
        "summary": "Build the core concepts of {subject} for {class_label}.",
        "focus": "Understand fundamental ideas and classroom terminology clearly.",
        "keyPoints": [
            "Learn the baseline concepts that will be used in later chapters.",
            "Practice short examples linked to everyday academic scenarios.",
        ],
    },
    {
        "title": "{subject} Concept Building",
        "summary": "Strengthen concept-level understanding in {subject} for {grade_label}.",
        "focus": "Move from definitions to structured problem-solving and interpretation.",
        "keyPoints": [
            "Work through guided examples from class discussions.",
            "Connect theory with practical usage and exam-style patterns.",
        ],
    },
    {
        "title": "{subject} Practice and Application",
        "summary": "Apply {subject} concepts through weekly practice for {class_label}.",
        "focus": "Solve mixed problems and explain reasoning in clear steps.",
        "keyPoints": [
            "Use revision drills to improve speed and accuracy.",
            "Identify common mistakes and build correction strategies.",
        ],
    },
    {
        "title": "{subject} Revision and Readiness",
        "summary": "Consolidate all key ideas of {subject} and prepare for assessments.",
        "focus": "Revise high-priority topics and reflect on weak areas.",
        "keyPoints": [
            "Summarize key formulas, definitions, and principles in notes.",
            "Attempt quick checks and targeted revision questions.",
        ],
    },
]

SUBJECT_WEEKLY_CONTENT_TEMPLATES: dict[str, list[dict[str, Any]]] = {
    "mathematics": [
        {
            "title": "Numbers and Algebra Basics",
            "summary": "Develop algebraic thinking and number confidence in {subject}.",
            "focus": "Variables, expressions, and linear reasoning for {grade_label}.",
            "keyPoints": [
                "Convert word statements into algebraic expressions.",
                "Solve foundational problems with step-by-step methods.",
            ],
        },
        {
            "title": "Equations and Patterns",
            "summary": "Expand equation-solving skills and pattern recognition.",
            "focus": "Apply algebra rules to structured practice sets.",
            "keyPoints": [
                "Solve equations using balancing and substitution basics.",
                "Interpret patterns and justify each transformation step.",
            ],
        },
        {
            "title": "Geometry Connections",
            "summary": "Connect algebra and geometry concepts in classroom problems.",
            "focus": "Use formulas and visual reasoning for {class_label}.",
            "keyPoints": [
                "Solve coordinate and shape-based numerical problems.",
                "Link geometric properties with algebraic calculations.",
            ],
        },
        {
            "title": "Mixed Revision",
            "summary": "Revise mixed mathematics topics with exam-ready practice.",
            "focus": "Strengthen weak areas and improve time management.",
            "keyPoints": [
                "Complete timed practice with method-focused review.",
                "Create a quick revision checklist for final recap.",
            ],
        },
    ],
    "physics": [
        {
            "title": "Motion Fundamentals",
            "summary": "Understand motion, speed, and displacement clearly.",
            "focus": "Build concept clarity before moving to numericals.",
            "keyPoints": [
                "Differentiate scalar and vector quantities in examples.",
                "Interpret simple motion graphs and unit conversions.",
            ],
        },
        {
            "title": "Force and Laws",
            "summary": "Apply Newtonian concepts to everyday situations.",
            "focus": "Relate force, mass, and acceleration with correct logic.",
            "keyPoints": [
                "Solve force-based examples using standard formulas.",
                "Explain first, second, and third law contexts.",
            ],
        },
        {
            "title": "Work, Energy, and Power",
            "summary": "Explore energy transfer and power-based applications.",
            "focus": "Use conceptual reasoning with formula-driven practice.",
            "keyPoints": [
                "Calculate work and power in structured problems.",
                "Connect conservation ideas to real-life systems.",
            ],
        },
        {
            "title": "Physics Revision",
            "summary": "Consolidate physics units and prepare for assessment tasks.",
            "focus": "Review formulas, definitions, and conceptual traps.",
            "keyPoints": [
                "Create a chapter-wise formula sheet and recap notes.",
                "Attempt mixed-question revision for confidence building.",
            ],
        },
    ],
    "chemistry": [
        {
            "title": "Atomic Structure Basics",
            "summary": "Build clear understanding of atoms and their components.",
            "focus": "Atomic models, particles, and notation for {grade_label}.",
            "keyPoints": [
                "Practice writing atomic number and mass number relations.",
                "Understand shell structure and electronic arrangement basics.",
            ],
        },
        {
            "title": "Chemical Bonding",
            "summary": "Study how and why atoms form compounds.",
            "focus": "Ionic and covalent bonding with class examples.",
            "keyPoints": [
                "Compare electron transfer and electron sharing approaches.",
                "Classify compounds by their bond formation patterns.",
            ],
        },
        {
            "title": "Reactions and Balancing",
            "summary": "Interpret and balance common reaction equations.",
            "focus": "Equation writing, balancing rules, and reaction types.",
            "keyPoints": [
                "Practice balancing reactions with stepwise checks.",
                "Identify synthesis, decomposition, and displacement types.",
            ],
        },
        {
            "title": "Chemistry Revision",
            "summary": "Revise major chemistry concepts and strengthen retention.",
            "focus": "Quick recap of formulas, reactions, and terminology.",
            "keyPoints": [
                "Use flash-style revision for compounds and equations.",
                "Solve mixed reaction and concept questions.",
            ],
        },
    ],
    "biology": [
        {
            "title": "Cell and Life Basics",
            "summary": "Understand life processes starting from cell structure.",
            "focus": "Cell organelles, structure-function links, and terminology.",
            "keyPoints": [
                "Label and explain the role of key cell organelles.",
                "Differentiate plant and animal cell features.",
            ],
        },
        {
            "title": "Systems and Functions",
            "summary": "Explore body systems and their coordinated functioning.",
            "focus": "Organ-level interactions in {class_label}.",
            "keyPoints": [
                "Trace key pathways in major biological systems.",
                "Explain how structure supports biological function.",
            ],
        },
        {
            "title": "Genetics and Continuity",
            "summary": "Introduce heredity and variation in living organisms.",
            "focus": "Traits, inheritance patterns, and biological diversity.",
            "keyPoints": [
                "Define genes, traits, and simple inheritance concepts.",
                "Interpret variation examples across populations.",
            ],
        },
        {
            "title": "Biology Revision",
            "summary": "Review complete biology units with diagram practice.",
            "focus": "Quick recall and explanation-based revision.",
            "keyPoints": [
                "Revise diagrams and key definitions chapter-wise.",
                "Attempt short-answer practice with concept clarity.",
            ],
        },
    ],
    "english": [
        {
            "title": "Reading Skills",
            "summary": "Strengthen reading comprehension and idea extraction.",
            "focus": "Main idea, details, and tone identification.",
            "keyPoints": [
                "Practice evidence-based answers from short passages.",
                "Improve skimming and inference strategies.",
            ],
        },
        {
            "title": "Grammar and Usage",
            "summary": "Improve sentence accuracy and grammatical control.",
            "focus": "Tenses, agreement, and error correction patterns.",
            "keyPoints": [
                "Apply grammar rules in context-driven exercises.",
                "Edit and rewrite sentences for clarity.",
            ],
        },
        {
            "title": "Writing Practice",
            "summary": "Develop clear and structured writing responses.",
            "focus": "Paragraph flow, coherence, and formal expression.",
            "keyPoints": [
                "Practice guided writing in multiple formats.",
                "Use vocabulary and transitions effectively.",
            ],
        },
        {
            "title": "English Revision",
            "summary": "Revise literature, grammar, and writing formats.",
            "focus": "Balanced recap for exam-oriented preparation.",
            "keyPoints": [
                "Summarize chapter themes and key literary points.",
                "Solve mixed comprehension and grammar drills.",
            ],
        },
    ],
    "computer science": [
        {
            "title": "Programming Foundations",
            "summary": "Understand coding basics and logical structure.",
            "focus": "Variables, operators, and input-output flow.",
            "keyPoints": [
                "Write simple programs using foundational syntax.",
                "Trace execution flow for small code snippets.",
            ],
        },
        {
            "title": "Decision Logic",
            "summary": "Build conditional thinking in programs.",
            "focus": "If-else patterns and branching logic.",
            "keyPoints": [
                "Design condition-based solutions for scenario questions.",
                "Differentiate nested and sequential condition usage.",
            ],
        },
        {
            "title": "Loops and Problem Solving",
            "summary": "Use repetition to solve structured coding tasks.",
            "focus": "Iteration, counters, and loop-driven patterns.",
            "keyPoints": [
                "Implement for/while loops with control checks.",
                "Break down pattern problems into coding steps.",
            ],
        },
        {
            "title": "Coding Revision",
            "summary": "Consolidate core programming skills and debugging habits.",
            "focus": "Practice mixed logic and syntax correction tasks.",
            "keyPoints": [
                "Review common coding errors and fix strategies.",
                "Solve short coding exercises under time limits.",
            ],
        },
    ],
}


def _normalize_subject_key(value: str | None) -> str:
    return " ".join((value or "").strip().lower().split())


def _resolve_class_label(enrollment) -> str:
    institute_class = getattr(enrollment, "institute_class", None)
    if institute_class is None:
        return "your class"
    if institute_class.name and institute_class.section:
        return f"{institute_class.name} Section {institute_class.section}"
    return institute_class.name or "your class"


def _resolve_grade_label(subject: Subject, enrollment) -> str:
    subject_code_digits = "".join(ch for ch in (subject.code or "") if ch.isdigit())
    if subject_code_digits:
        return f"Class {subject_code_digits}"

    institute_class = getattr(enrollment, "institute_class", None)
    if institute_class is not None:
        if institute_class.grade:
            return f"Class {institute_class.grade}"
        if institute_class.name:
            return institute_class.name
    return "your class"


def build_subject_week_content(subject: Subject, enrollment) -> list[dict[str, Any]]:
    subject_name = (subject.name or "Subject").strip() or "Subject"
    subject_key = _normalize_subject_key(subject_name)
    class_label = _resolve_class_label(enrollment)
    grade_label = _resolve_grade_label(subject, enrollment)

    templates = SUBJECT_WEEKLY_CONTENT_TEMPLATES.get(subject_key, DEFAULT_WEEKLY_SUBJECT_CONTENT_TEMPLATE)
    content_blocks: list[dict[str, Any]] = []
    slug = subject_key.replace(" ", "-") or "subject"
    for index, template in enumerate(templates[:4], start=1):
        format_args = {
            "subject": subject_name,
            "class_label": class_label,
            "grade_label": grade_label,
        }
        content_blocks.append(
            {
                "id": f"{slug}-week-{index}",
                "week": f"Week {index}",
                "title": template["title"].format(**format_args),
                "summary": template["summary"].format(**format_args),
                "focus": template["focus"].format(**format_args),
                "keyPoints": [
                    point.format(**format_args) for point in (template.get("keyPoints") or [])
                ],
            }
        )
    return content_blocks


def get_current_student():
    if hasattr(g, "current_user") and g.current_user.student:
        return g.current_user.student
    raise ApiError(404, "STUDENT_PROFILE_NOT_FOUND", "No student profile is linked to the current user.")


def get_enrollment_class_scope_ids(enrollment) -> list[int]:
    if enrollment is None:
        return []

    class_ids: set[int] = {int(enrollment.class_id)}
    institute_class = getattr(enrollment, "institute_class", None)
    if institute_class is None:
        return sorted(class_ids)

    related_classes = InstituteClass.query.filter_by(
        name=institute_class.name,
        section=institute_class.section,
    ).all()
    class_ids.update(item.id for item in related_classes)
    return sorted(class_ids)


def _grade_tokens_for_enrollment(enrollment) -> set[str]:
    institute_class = getattr(enrollment, "institute_class", None)
    if institute_class is None:
        return set()

    tokens: set[str] = set()
    if institute_class.grade:
        grade_digits = "".join(ch for ch in institute_class.grade if ch.isdigit())
        if grade_digits:
            tokens.add(grade_digits)

    if institute_class.name:
        name_digits = "".join(ch for ch in institute_class.name if ch.isdigit())
        if name_digits:
            tokens.add(name_digits)
    return tokens


def _matches_grade_code(subject: Subject, grade_tokens: set[str]) -> bool:
    if not grade_tokens:
        return False
    subject_code = (subject.code or "").strip().upper()
    if not subject_code:
        return False
    return any(subject_code.endswith(f"-{token}") for token in grade_tokens)


def get_student_subjects(student_id: int):
    student = db.session.get(Student, student_id)
    enrollment = student.current_enrollment() if student else None
    if not enrollment:
        return []

    class_scope_ids = get_enrollment_class_scope_ids(enrollment)
    grade_tokens = _grade_tokens_for_enrollment(enrollment)
    assignments = FacultySubjectAssignment.query.filter(FacultySubjectAssignment.class_id.in_(class_scope_ids)).all()
    subject_faculty_ids: dict[int, int] = {}
    for assignment in assignments:
        subject_faculty_ids[assignment.subject_id] = assignment.faculty_id
        subject = assignment.subject
        if subject is None:
            continue
        is_class_match = subject.class_id is not None and subject.class_id in class_scope_ids
        if not is_class_match and not _matches_grade_code(subject, grade_tokens):
            continue
    subjects_by_id: dict[int, dict] = {}

    # Primary set: active core subjects mapped to the student's class scope or grade code.
    active_core_subjects = Subject.query.filter(
        Subject.course_type == "core",
        Subject.status.in_(["active", "upcoming"]),
    ).all()
    for subject in active_core_subjects:
        is_class_match = subject.class_id is not None and subject.class_id in class_scope_ids
        if not is_class_match and not _matches_grade_code(subject, grade_tokens):
            continue
        faculty_id = subject_faculty_ids.get(subject.id)
        subjects_by_id[subject.id] = (
            subject.to_dict(faculty_id=faculty_id) if faculty_id is not None else subject.to_dict()
        )

    # Keep explicit faculty assignments even if subject metadata is incomplete.
    for assignment in assignments:
        subject = assignment.subject
        if subject is None:
            continue
        if subject.id in subjects_by_id:
            continue
        subjects_by_id[subject.id] = subject.to_dict(faculty_id=assignment.faculty_id)

    return sorted(
        subjects_by_id.values(),
        key=lambda payload: ((payload.get("code") or ""), (payload.get("name") or "")),
    )


def get_attendance_stats(student_id: int):
    records = Attendance.query.filter_by(student_id=student_id).all()
    total = len(records)
    present = len([item for item in records if item.status == "PRESENT"])
    absent = len([item for item in records if item.status == "ABSENT"])
    return {
        "total": total,
        "present": present,
        "absent": absent,
        "percentage": round((present / total) * 100, 2) if total else 0,
    }


def get_performance_summary(student_id: int):
    marks = Mark.query.filter_by(student_id=student_id).all()
    total_students = Student.query.count() or 1
    average = round(sum(mark.marks_obtained for mark in marks) / len(marks), 2) if marks else 0
    return {"average": average, "rank": 1, "totalStudents": total_students}


def get_assignments(
    subject_id: int | None = None,
    status: str | None = None,
    allowed_subject_ids: set[int] | list[int] | None = None,
):
    query = Assignment.query
    if allowed_subject_ids is not None:
        scoped_subject_ids = {int(item) for item in allowed_subject_ids}
        if not scoped_subject_ids:
            return []
        query = query.filter(Assignment.subject_id.in_(scoped_subject_ids))
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if status:
        query = query.filter_by(status=status)
    return [assignment.to_dict() for assignment in query.all()]
