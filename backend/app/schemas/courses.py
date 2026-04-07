from typing import Literal

from pydantic import AliasChoices, Field

from .validation import StrictModel


class CourseEnrollmentRequest(StrictModel):
    course_id: int = Field(alias="courseId")
    payment_plan: Literal["one_time", "installments"] = Field(default="one_time", alias="paymentPlan")
    installment_count: int | None = Field(default=None, alias="installmentCount")


class CoursePaymentRequest(StrictModel):
    amount: float = Field(validation_alias=AliasChoices("amount", "amountPaid"))
    payment_method: str = Field(default="online", alias="paymentMethod")
    reference_number: str | None = Field(default=None, alias="referenceNumber")
