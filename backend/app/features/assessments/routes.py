from datetime import datetime

from flask import Blueprint, current_app, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db, limiter
from ...models import Assessment, AssessmentSubmission, Assignment, AssignmentSubmission, Subject
from ...schemas import (
    AssessmentCreateRequest,
    AssessmentListQuery,
    AssessmentSubmissionCreateRequest,
    AssessmentUpdateRequest,
    AssignmentListQuery,
    AssignmentSubmissionRequest,
    GenerateQuestionsRequest,
    ModifyQuestionsRequest,
    parse_json,
    parse_query,
)
from ...services.ai_settings import get_ai_rate_limit, get_ai_settings
from ...services.assessments import (
    create_assessment_with_questions,
    delete_assessment_questions,
    evaluate_submission,
    generate_assessment_questions,
    modify_assessment_questions,
    serialize_assessment,
    serialize_assessment_for_student,
    serialize_assessment_submission,
    update_assessment_questions,
)
from ...services.query import get_assignments, get_current_student, get_student_subjects
from ...repositories import AssessmentQuestionRepository, AssessmentSubmissionRepository


assessments_bp = Blueprint("assessments", __name__)


def _is_assessment_expired(due_date_str: str | None) -> bool:
    """Check if assessment due date has passed."""
    if not due_date_str:
        return False  # No due date means no expiration
    try:
        # Try parsing common formats
        for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                due_dt = datetime.strptime(due_date_str.strip(), fmt)
                return datetime.utcnow() > due_dt
            except ValueError:
                continue
        # If parsing fails, treat as not expired
        current_app.logger.warning(f"Could not parse due date: {due_date_str}")
        return False
    except Exception:
        return False


def _serialize_assessment_for_student_with_answers(assessment: Assessment, questions: list[dict]) -> dict:
    """Serialize assessment with correct answers (for after due date)."""
    return assessment.to_dict(questions=questions)


def _question_generation_limit() -> str:
    return get_ai_rate_limit("generate")


def _question_modification_limit() -> str:
    return get_ai_rate_limit("modify")


@assessments_bp.get("/ai/settings")
@roles_required("faculty", "administration")
def get_ai_runtime_settings():
    return success_response(get_ai_settings(include_secret=False))


@assessments_bp.post("/ai/generate-questions")
@roles_required("faculty", "administration")
@limiter.limit(_question_generation_limit)
def generate_questions():
    try:
        payload = parse_json(GenerateQuestionsRequest, request.get_json())
        questions = generate_assessment_questions(payload.model_dump(by_alias=True))
        return success_response(questions)
    except ApiError:
        raise  # Re-raise ApiErrors as-is
    except Exception as exc:
        current_app.logger.exception("Question generation failed with unexpected error")
        raise ApiError(
            500,
            "QUESTION_GENERATION_ERROR",
            f"Question generation failed: {str(exc)}",
            {"reason": str(exc)},
        )


@assessments_bp.post("/ai/modify-questions")
@roles_required("faculty", "administration")
@limiter.limit(_question_modification_limit)
def modify_questions():
    try:
        payload = parse_json(ModifyQuestionsRequest, request.get_json())
        questions = [question.model_dump(by_alias=True) for question in payload.questions]

        # Resolve subject name for context grounding when subject_id is provided
        subject_name = payload.subject_name
        materials = list(payload.materials or [])
        if payload.subject_id:
            subject = db.session.get(Subject, payload.subject_id)
            if subject:
                subject_name = subject.name
                from ...services.materials import get_materials_for_generation
                materials = get_materials_for_generation(
                    subject_id=payload.subject_id,
                    selected_materials=materials,
                )
        elif not subject_name:
            # Fallback if no subject_id and no subject_name provided
            subject_name = "General Subject"


        updated = modify_assessment_questions(
            questions=questions,
            modification_prompt=payload.modification_prompt.strip(),
            subject_id=payload.subject_id,
            subject_name=subject_name,
            week=payload.week,
            materials=materials if materials else None,
        )
        return success_response(updated)
    except ApiError:
        raise  # Re-raise ApiErrors as-is
    except Exception as exc:
        current_app.logger.exception("Question modification failed with unexpected error")
        raise ApiError(
            500,
            "QUESTION_MODIFICATION_ERROR",
            f"Question modification failed: {str(exc)}",
            {"reason": str(exc)},
        )


def _student_can_access_assessment(student, assessment: Assessment) -> bool:
    enrollment = student.current_enrollment() if student else None
    return bool(student and enrollment and assessment.class_id == enrollment.class_id and assessment.published)



@assessments_bp.get("/assessments/weekly")
@roles_required("student", "faculty", "administration")
def list_assessments_weekly():
    """Get assessments grouped by week for student subject view."""
    filters = parse_query(AssessmentListQuery, request.args.to_dict())
    current_student = None
    
    if getattr(g, "current_user", None) and g.current_user.student is not None:
        current_student = get_current_student()
        enrollment = current_student.current_enrollment()
        if enrollment is None:
            return success_response([])
    
    query = Assessment.query
    
    if current_student is not None:
        # Students see only published assessments for their class
        query = query.filter(
            Assessment.class_id == enrollment.class_id,
            Assessment.published.is_(True)
        )
    
    if filters.class_id:
        query = query.filter(Assessment.class_id == filters.class_id)
    if filters.subject_id:
        query = query.filter(Assessment.subject_id == filters.subject_id)
    if filters.published is not None:
        query = query.filter_by(published=filters.published)
    
    assessments = query.order_by(Assessment.week.asc().nullslast(), Assessment.due_date.asc().nullslast()).all()
    
    # Group by week
    weekly_groups: dict[str, list[dict]] = {}
    for assessment in assessments:
        week_key = assessment.week or "No Week Assigned"
        if week_key not in weekly_groups:
            weekly_groups[week_key] = []
        
        serializer = serialize_assessment_for_student if current_student is not None else serialize_assessment
        serialized = serializer(assessment)
        
        # Add submission status for students
        if current_student is not None:
            existing_submission = AssessmentSubmission.query.filter_by(
                assessment_id=assessment.id,
                student_id=current_student.id
            ).first()
            serialized["isExpired"] = _is_assessment_expired(assessment.due_date)
            serialized["submitted"] = existing_submission is not None
            serialized["submissionStatus"] = existing_submission.status if existing_submission else None
            serialized["score"] = existing_submission.score if existing_submission else None
            serialized["totalMarks"] = existing_submission.total_marks if existing_submission else None
        
        weekly_groups[week_key].append(serialized)
    
    # Convert to list format
    result = [
        {
            "week": week,
            "assessments": assessments_list,
            "count": len(assessments_list),
        }
        for week, assessments_list in weekly_groups.items()
    ]
    
    return success_response(result)


@assessments_bp.get("/assessments")
@roles_required("student", "faculty", "administration")
def list_assessments():
    filters = parse_query(AssessmentListQuery, request.args.to_dict())
    query = Assessment.query
    current_student = None
    if getattr(g, "current_user", None) and g.current_user.student is not None:
        current_student = get_current_student()
        enrollment = current_student.current_enrollment()
        if enrollment is None:
            return success_response([])
        query = query.filter(Assessment.class_id == enrollment.class_id).filter(Assessment.published.is_(True))
    if filters.class_id:
        query = query.filter(Assessment.class_id == filters.class_id)
    if filters.subject_id:
        query = query.filter(Assessment.subject_id == filters.subject_id)
    if filters.published is not None:
        query = query.filter_by(published=filters.published)
    serializer = serialize_assessment_for_student if current_student is not None else serialize_assessment
    return success_response([serializer(assessment) for assessment in query.all()])


@assessments_bp.post("/assessments")
@roles_required("faculty", "administration")
def create_assessment():
    payload = parse_json(AssessmentCreateRequest, request.get_json())
    assessment = create_assessment_with_questions(payload.model_dump(by_alias=True))
    return success_response(serialize_assessment(assessment), status_code=201)


@assessments_bp.get("/assessments/<int:assessment_id>")
@roles_required("student", "faculty", "administration")
def get_assessment(assessment_id: int):
    assessment = db.session.get(Assessment, assessment_id)
    if assessment is None:
        raise ApiError(404, "ASSESSMENT_NOT_FOUND", "Assessment was not found.")
    if getattr(g, "current_user", None) and g.current_user.student is not None:
        student = get_current_student()
        if not _student_can_access_assessment(student, assessment):
            raise ApiError(403, "FORBIDDEN", "You do not have permission to access this assessment.")
        return success_response(serialize_assessment_for_student(assessment))
    return success_response(serialize_assessment(assessment))


@assessments_bp.patch("/assessments/<int:assessment_id>")
@roles_required("faculty", "administration")
def update_assessment(assessment_id: int):
    assessment = db.session.get(Assessment, assessment_id)
    if assessment is None:
        raise ApiError(404, "ASSESSMENT_NOT_FOUND", "Assessment was not found.")
    payload = parse_json(AssessmentUpdateRequest, request.get_json())
    updates = payload.model_dump(by_alias=True, exclude_none=True)
    for field, attr in (("title", "title"), ("description", "description"), ("week", "week"), ("dueDate", "due_date"), ("published", "published")):
        if field in updates:
            setattr(assessment, attr, updates[field])
    if "questions" in updates:
        update_assessment_questions(assessment, updates["questions"])
    else:
        db.session.commit()
    return success_response(serialize_assessment(assessment))


@assessments_bp.post("/assessments/<int:assessment_id>/publish")
@roles_required("faculty", "administration")
def publish_assessment(assessment_id: int):
    assessment = db.session.get(Assessment, assessment_id)
    if assessment is None:
        raise ApiError(404, "ASSESSMENT_NOT_FOUND", "Assessment was not found.")
    assessment.published = True
    db.session.commit()
    return success_response(serialize_assessment(assessment), message="Assessment published successfully.")


@assessments_bp.get("/assessments/<int:assessment_id>/submissions")
@roles_required("faculty", "administration")
def list_assessment_submissions(assessment_id: int):
    assessment = db.session.get(Assessment, assessment_id)
    if assessment is None:
        raise ApiError(404, "ASSESSMENT_NOT_FOUND", "Assessment was not found.")
    submissions = AssessmentSubmission.query.filter_by(assessment_id=assessment_id).order_by(AssessmentSubmission.submitted_at.desc()).all()
    return success_response([serialize_assessment_submission(submission) for submission in submissions])


@assessments_bp.get("/assessments/<int:assessment_id>/my-submission")
@roles_required("student")
def get_my_assessment_submission(assessment_id: int):
    student = get_current_student()
    assessment = db.session.get(Assessment, assessment_id)
    if assessment is None:
        raise ApiError(404, "ASSESSMENT_NOT_FOUND", "Assessment was not found.")
    if not _student_can_access_assessment(student, assessment):
        raise ApiError(403, "FORBIDDEN", "You do not have permission to access this assessment.")
    submission = AssessmentSubmission.query.filter_by(assessment_id=assessment_id, student_id=student.id).first()
    if submission is None:
        return success_response({"submitted": False, "submission": None})
    return success_response({"submitted": True, "submission": serialize_assessment_submission(submission)})



@assessments_bp.get("/assessments/<int:assessment_id>/answers")
@roles_required("student")
def get_assessment_answers(assessment_id: int):
    """Get assessment with correct answers after due date has passed."""
    student = get_current_student()
    assessment = db.session.get(Assessment, assessment_id)
    if assessment is None:
        raise ApiError(404, "ASSESSMENT_NOT_FOUND", "Assessment was not found.")
    if not _student_can_access_assessment(student, assessment):
        raise ApiError(403, "FORBIDDEN", "You do not have permission to access this assessment.")
    
    is_expired = _is_assessment_expired(assessment.due_date)
    if not is_expired:
        raise ApiError(
            403,
            "ASSESSMENT_NOT_EXPIRED",
            "Correct answers are only available after the due date has passed.",
        )
    
    # Get questions with correct answers
    questions = AssessmentQuestionRepository().get_questions(
        assessment.questions_document_id,
        fallback=assessment.questions_json,
    )
    
    # Get student's submission if exists
    submission = AssessmentSubmission.query.filter_by(
        assessment_id=assessment_id,
        student_id=student.id
    ).first()
    
    return success_response({
        "assessment": assessment.to_dict(questions=questions),
        "submission": serialize_assessment_submission(submission) if submission else None,
        "answered": submission is not None,
    })


@assessments_bp.post("/assessments/<int:assessment_id>/submit")
@roles_required("student")
def submit_assessment(assessment_id: int):
    try:
        student = get_current_student()
        assessment = db.session.get(Assessment, assessment_id)
        if assessment is None:
            raise ApiError(404, "ASSESSMENT_NOT_FOUND", "Assessment was not found.")
        if not _student_can_access_assessment(student, assessment):
            raise ApiError(403, "FORBIDDEN", "You do not have permission to access this assessment.")

        # Check if due date has passed - block submission
        if _is_assessment_expired(assessment.due_date):
            raise ApiError(
                403,
                "ASSESSMENT_EXPIRED",
                "This assessment's due date has passed. Submissions are no longer accepted.",
                {"dueDate": assessment.due_date},
            )

        payload = parse_json(AssessmentSubmissionCreateRequest, request.get_json())
        questions = AssessmentQuestionRepository().get_questions(
            assessment.questions_document_id,
            fallback=assessment.questions_json,
        )
        answers = [answer.model_dump(by_alias=True) for answer in payload.answers]
        score, total_marks, evaluated_answers = evaluate_submission(questions, answers)

        submission = AssessmentSubmission.query.filter_by(assessment_id=assessment_id, student_id=student.id).first()
        if submission is None:
            submission = AssessmentSubmission(assessment_id=assessment_id, student_id=student.id)
            db.session.add(submission)
            db.session.flush()

        submission.status = payload.status
        submission.score = score
        submission.total_marks = total_marks
        submission.submitted_at = submission.submitted_at or datetime.utcnow()
        submission.evaluated_at = datetime.utcnow()
        submission.answers_document_id = AssessmentSubmissionRepository().update(
            submission.answers_document_id,
            submission.id,
            {
                "assessmentId": str(assessment_id),
                "studentId": str(student.id),
                "answers": evaluated_answers,
            },
        )
        db.session.commit()
        return success_response({"success": True, "submission": serialize_assessment_submission(submission)}, status_code=201)
    except ApiError:
        raise
    except Exception as exc:
        current_app.logger.exception("Assessment submission failed")
        raise ApiError(
            500,
            "SUBMISSION_ERROR",
            f"Failed to submit assessment: {str(exc)}",
        )


@assessments_bp.delete("/assessments/<int:assessment_id>")
@roles_required("faculty", "administration")
def delete_assessment(assessment_id: int):
    assessment = db.session.get(Assessment, assessment_id)
    if assessment is None:
        raise ApiError(404, "ASSESSMENT_NOT_FOUND", "Assessment was not found.")
    delete_assessment_questions(assessment)
    db.session.delete(assessment)
    db.session.commit()
    return "", 204


@assessments_bp.get("/assignments")
@roles_required("student", "faculty", "administration")
def list_assignments():
    filters = parse_query(AssignmentListQuery, request.args.to_dict())
    allowed_subject_ids: list[int] | None = None
    if getattr(g, "current_user", None) and g.current_user.student is not None:
        student = get_current_student()
        allowed_subject_ids = [int(subject["id"]) for subject in get_student_subjects(student.id)]

    return success_response(
        get_assignments(
            filters.subject_id,
            filters.status,
            allowed_subject_ids=allowed_subject_ids,
        )
    )


@assessments_bp.post("/assignments/<int:assignment_id>/submit")
@roles_required("student")
def submit_assignment(assignment_id: int):
    student = get_current_student()
    assignment = db.session.get(Assignment, assignment_id)
    if assignment is None:
        raise ApiError(404, "ASSIGNMENT_NOT_FOUND", "Assignment was not found.")
    enrollment = student.current_enrollment()
    if enrollment is None:
        raise ApiError(403, "FORBIDDEN", "You are not enrolled in a class.")
    assignment_subject = assignment.subject
    if assignment_subject is None or assignment_subject.class_id != enrollment.class_id:
        raise ApiError(403, "FORBIDDEN", "You do not have permission to submit this assignment.")
    payload = parse_json(AssignmentSubmissionRequest, request.get_json())
    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        student_id=student.id,
        submission_url=payload.submission_url,
    )
    db.session.add(submission)
    db.session.commit()
    return success_response({"success": True, "submittedAt": submission.submitted_at.isoformat()}, status_code=201)
