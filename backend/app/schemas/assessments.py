from pydantic import Field

from .validation import StrictModel


class GenerateQuestionsRequest(StrictModel):
    subject_id: int = Field(alias="subjectId")
    question_count: int = Field(default=1, alias="questionCount")
    total_marks: int = Field(default=1, alias="totalMarks")
    difficulty_level: str = Field(default="medium", alias="difficultyLevel")
    materials: list[dict] = Field(default_factory=list)
    question_types: dict[str, int] = Field(default_factory=dict, alias="questionTypes")
    custom_prompt: str | None = Field(default=None, alias="customPrompt")


class QuestionPayload(StrictModel):
    id: str
    question_text: str = Field(alias="questionText")
    question_type: str = Field(alias="questionType")
    options: list[str] | None = None
    correct_answer: str | None = Field(default=None, alias="correctAnswer")
    marks: int
    difficulty: str = "medium"


class ModifyQuestionsRequest(StrictModel):
    modification_prompt: str = Field(alias="modificationPrompt")
    questions: list[QuestionPayload]


class AssessmentCreateRequest(StrictModel):
    title: str
    description: str | None = None
    class_id: int = Field(alias="classId")
    subject_id: int = Field(alias="subjectId")
    questions: list[dict]
    total_marks: int = Field(alias="totalMarks")
    created_by: int | None = Field(default=2, alias="createdBy")
    due_date: str | None = Field(default=None, alias="dueDate")
    published: bool = False


class AssessmentUpdateRequest(StrictModel):
    title: str | None = None
    description: str | None = None
    due_date: str | None = Field(default=None, alias="dueDate")
    questions: list[dict] | None = None
    published: bool | None = None


class AssessmentListQuery(StrictModel):
    class_id: int | None = Field(default=None, alias="classId")
    subject_id: int | None = Field(default=None, alias="subjectId")
    published: bool | None = None


class AssignmentListQuery(StrictModel):
    subject_id: int | None = Field(default=None, alias="subjectId")
    status: str | None = None


class AssignmentSubmissionRequest(StrictModel):
    submission_url: str = Field(alias="submissionUrl")


class AssessmentAnswerRequest(StrictModel):
    question_id: str = Field(alias="questionId")
    answer: str | list[str] | None = None


class AssessmentSubmissionCreateRequest(StrictModel):
    answers: list[AssessmentAnswerRequest]
    status: str = "submitted"
