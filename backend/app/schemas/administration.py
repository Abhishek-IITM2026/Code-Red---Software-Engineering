import re
from typing import Literal

from pydantic import Field, field_validator

from .validation import StrictModel


RATE_LIMIT_PATTERN = re.compile(r"^\s*\d+\s+per\s+(second|minute|hour|day)s?\s*$", re.IGNORECASE)


class MaterialCreateRequest(StrictModel):
    title: str
    unit: str | None = None
    week: str | None = None
    material_type: str = Field(alias="type")
    class_name: str | None = Field(default=None, alias="className")
    section: str | None = None
    document_id: int | None = Field(default=None, alias="documentId")


class AISettingsWriteRequest(StrictModel):
    provider: Literal["grounded-rag", "openai-compatible-cloud", "openai-compatible-local", "gemini"] = "gemini"
    model: str = "grounded-rag-v1"
    base_url: str | None = Field(default=None, alias="baseUrl")
    api_key: str | None = Field(default=None, alias="apiKey")
    clear_api_key: bool = Field(default=False, alias="clearApiKey")
    temperature: float = 0.2
    max_tokens: int = Field(default=1200, alias="maxTokens")
    generation_rate_limit: str = Field(default="15 per minute", alias="generationRateLimit")
    modification_rate_limit: str = Field(default="15 per minute", alias="modificationRateLimit")
    fallback_to_grounded_rag: bool = Field(default=True, alias="fallbackToGroundedRag")
    notes: str | None = None

    @field_validator("model")
    @classmethod
    def validate_model(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("model must not be empty.")
        return normalized

    @field_validator("base_url")
    @classmethod
    def normalize_base_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().rstrip("/")
        return normalized or None

    @field_validator("api_key")
    @classmethod
    def normalize_api_key(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("generation_rate_limit", "modification_rate_limit")
    @classmethod
    def validate_rate_limit(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not RATE_LIMIT_PATTERN.match(normalized):
            raise ValueError("rate limit must look like '15 per minute' or '100 per hour'.")
        return normalized


class AuthorityAssignmentWriteRequest(StrictModel):
    user_id: int | str = Field(alias="id")
    roles: list[str]
    role_template: str = Field(alias="roleTemplate")
    authorities: dict[str, bool]
    user_id_dup: int | str | None = Field(default=None, alias="userId")  # Accept userId from frontend (duplicate of id field)


class PromotionActionRequest(StrictModel):
    target_class: str = Field(alias="targetClass")
    academic_year: str | None = Field(default=None, alias="academicYear")


class StudentWriteRequest(StrictModel):
    email: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    class_name: str = Field(alias="class")
    section: str
    enrollment_no: str = Field(alias="enrollmentNo")
    phone: str | None = None
    guardian_name: str | None = Field(default=None, alias="guardianName")
    status: Literal["active", "inactive", "suspended"] = "active"


class StudentStatusRequest(StrictModel):
    status: Literal["active", "inactive", "suspended"]


class StudentApprovalRequest(StrictModel):
    class_name: str = Field(alias="className")
    section: str
    enrollment_no: str | None = Field(default=None, alias="enrollmentNo")


class StaffWriteRequest(StrictModel):
    email: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    employee_code: str = Field(alias="employeeCode")
    category: Literal["Teaching", "Non-Teaching"]
    designation: str
    department: str
    phone: str | None = None
    joining_date: str = Field(alias="joiningDate")
    status: Literal["active", "inactive", "on-leave"] = "active"


class StaffStatusRequest(StrictModel):
    status: Literal["active", "inactive", "on-leave"]


class CourseWriteRequest(StrictModel):
    title: str
    description: str
    code: str | None = None
    class_name: str = Field(alias="className")
    section: str
    start_date: str = Field(alias="startDate")
    end_date: str = Field(alias="endDate")
    instructor: str
    mode: Literal["Online", "Offline", "Hybrid"]
    seats: int
    status: Literal["upcoming", "active", "inactive"] = "upcoming"
    level: str | None = None
    credits: int = 1
    fee_amount: float = Field(default=0, alias="feeAmount")
    installment_available: bool = Field(default=False, alias="installmentAvailable")
    max_installments: int = Field(default=1, alias="maxInstallments")
    course_type: Literal["core", "program", "elective"] = Field(default="program", alias="courseType")


class FinancialRecordCreateRequest(StrictModel):
    staff_id: int = Field(alias="staffId")
    base_pay: str = Field(alias="basePay")
    current_salary: str = Field(alias="currentSalary")
    last_increment: str = Field(alias="lastIncrement")
    next_review: str = Field(alias="nextReview")
    bank_account: str | None = Field(default=None, alias="bankAccount")
    earnings_breakdown: list[dict[str, str]] | None = Field(default=None, alias="earningsBreakdown")


class FinancialRecordWriteRequest(StrictModel):
    base_pay: str = Field(alias="basePay")
    current_salary: str = Field(alias="currentSalary")
    last_increment: str = Field(alias="lastIncrement")
    next_review: str = Field(alias="nextReview")
    bank_account: str | None = Field(default=None, alias="bankAccount")
    earnings_breakdown: list[dict[str, str]] | None = Field(default=None, alias="earningsBreakdown")
