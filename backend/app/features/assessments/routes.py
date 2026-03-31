from flask import Blueprint, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db, limiter
from ...models import Assessment, Assignment, AssignmentSubmission
from ...schemas import (
    AssessmentCreateRequest,
    AssessmentListQuery,
    AssessmentUpdateRequest,
    AssignmentListQuery,
    AssignmentSubmissionRequest,
    GenerateQuestionsRequest,
    ModifyQuestionsRequest,
    parse_json,
    parse_query,
)
from ...services.assessments import (
    create_assessment_with_questions,
    delete_assessment_questions,
    serialize_assessment,
    update_assessment_questions,
)
from ...services.query import get_assignments


assessments_bp = Blueprint("assessments", __name__)


@assessments_bp.post("/ai/generate-questions")
@roles_required("faculty", "administration")
@limiter.limit("15 per minute")
def generate_questions():
    payload = parse_json(GenerateQuestionsRequest, request.get_json())
    total = max(1, payload.question_count)
    marks = max(1, payload.total_marks)
    base_mark = max(1, marks // total)
    questions = []
    for index in range(total):
        questions.append(
            {
                "id": f"generated-{index + 1}",
                "questionText": f"Generated question {index + 1} for subject {payload.subject_id}",
                "questionType": "mcq" if index % 2 == 0 else "short",
                "options": ["Option A", "Option B", "Option C", "Option D"] if index % 2 == 0 else None,
                "correctAnswer": "Option A" if index % 2 == 0 else "",
                "marks": base_mark,
                "difficulty": payload.difficulty_level if payload.difficulty_level != "mixed" else "medium",
            }
        )
    return success_response(questions)


@assessments_bp.post("/ai/modify-questions")
@roles_required("faculty", "administration")
@limiter.limit("15 per minute")
def modify_questions():
    payload = parse_json(ModifyQuestionsRequest, request.get_json())
    prompt = payload.modification_prompt.strip()
    questions = [question.model_dump(by_alias=True) for question in payload.questions]
    updated = [{**question, "questionText": f"{question['questionText']} [{prompt}]"} for question in questions]
    return success_response(updated)


@assessments_bp.get("/assessments")
@roles_required("faculty", "administration")
def list_assessments():
    filters = parse_query(AssessmentListQuery, request.args.to_dict())
    query = Assessment.query
    if filters.class_id:
        query = query.filter(Assessment.class_id == filters.class_id)
    if filters.subject_id:
        query = query.filter(Assessment.subject_id == filters.subject_id)
    if filters.published is not None:
        query = query.filter_by(published=filters.published)
    return success_response([serialize_assessment(assessment) for assessment in query.all()])


@assessments_bp.post("/assessments")
@roles_required("faculty", "administration")
def create_assessment():
    payload = parse_json(AssessmentCreateRequest, request.get_json())
    assessment = create_assessment_with_questions(payload.model_dump(by_alias=True))
    return success_response(serialize_assessment(assessment), status_code=201)


@assessments_bp.get("/assessments/<int:assessment_id>")
@roles_required("faculty", "administration")
def get_assessment(assessment_id: int):
    assessment = db.session.get(Assessment, assessment_id)
    if assessment is None:
        raise ApiError(404, "ASSESSMENT_NOT_FOUND", "Assessment was not found.")
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
