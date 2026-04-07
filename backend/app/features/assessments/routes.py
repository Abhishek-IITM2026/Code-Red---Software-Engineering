from datetime import datetime

from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db, limiter
from ...models import Assessment, AssessmentSubmission, Assignment, AssignmentSubmission
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
    serialize_assessment,
    serialize_assessment_for_student,
    serialize_assessment_submission,
    update_assessment_questions,
)
from ...services.query import get_assignments, get_current_student
from ...repositories import AssessmentQuestionRepository, AssessmentSubmissionRepository


assessments_bp = Blueprint("assessments", __name__)


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
    payload = parse_json(GenerateQuestionsRequest, request.get_json())
    questions = generate_assessment_questions(payload.model_dump(by_alias=True))
    return success_response(questions)


@assessments_bp.post("/ai/modify-questions")
@roles_required("faculty", "administration")
@limiter.limit(_question_modification_limit)
def modify_questions():
    payload = parse_json(ModifyQuestionsRequest, request.get_json())
    prompt = payload.modification_prompt.strip()
    questions = [question.model_dump(by_alias=True) for question in payload.questions]
    updated = [{**question, "questionText": f"{question['questionText']} [{prompt}]"} for question in questions]
    return success_response(updated)


def _student_can_access_assessment(student, assessment: Assessment) -> bool:
    enrollment = student.current_enrollment() if student else None
    return bool(student and enrollment and assessment.class_id == enrollment.class_id and assessment.published)


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
    for field, attr in (("title", "title"), ("description", "description"), ("dueDate", "due_date"), ("published", "published")):
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


@assessments_bp.post("/assessments/<int:assessment_id>/submit")
@roles_required("student")
def submit_assessment(assessment_id: int):
    student = get_current_student()
    assessment = db.session.get(Assessment, assessment_id)
    if assessment is None:
        raise ApiError(404, "ASSESSMENT_NOT_FOUND", "Assessment was not found.")
    if not _student_can_access_assessment(student, assessment):
        raise ApiError(403, "FORBIDDEN", "You do not have permission to access this assessment.")

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
    return success_response(get_assignments(filters.subject_id, filters.status))


@assessments_bp.post("/assignments/<int:assignment_id>/submit")
@roles_required("student")
def submit_assignment(assignment_id: int):
    assignment = db.session.get(Assignment, assignment_id)
    if assignment is None:
        raise ApiError(404, "ASSIGNMENT_NOT_FOUND", "Assignment was not found.")
    payload = parse_json(AssignmentSubmissionRequest, request.get_json())
    submission = AssignmentSubmission(assignment_id=assignment_id, student_id=1, submission_url=payload.submission_url)
    db.session.add(submission)
    db.session.commit()
    return success_response({"success": True, "submittedAt": submission.submitted_at.isoformat()}, status_code=201)
