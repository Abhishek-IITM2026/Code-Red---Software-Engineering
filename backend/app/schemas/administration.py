from typing import Literal

from pydantic import Field

from .validation import StrictModel


class MaterialCreateRequest(StrictModel):
    title: str
    unit: str | None = None
    week: str | None = None
    material_type: str = Field(alias="type")
    description: str | None = None


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
    class_name: str = Field(alias="className")
    section: str
    start_date: str = Field(alias="startDate")
    end_date: str = Field(alias="endDate")
    instructor: str
    mode: Literal["Online", "Offline", "Hybrid"]
    seats: int
    status: Literal["active", "inactive"] = "active"


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
