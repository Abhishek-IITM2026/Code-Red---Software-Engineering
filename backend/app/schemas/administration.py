from pydantic import Field

from .validation import StrictModel


class MaterialCreateRequest(StrictModel):
    title: str
    unit: str | None = None
    week: str | None = None
    material_type: str = Field(alias="type")
    description: str | None = None


class AuthorityAssignmentWriteRequest(StrictModel):
    staff_id: str = Field(alias="staffId")
    roles: list[str]
    role_template: str = Field(alias="roleTemplate")
    authorities: dict[str, bool]


class PromotionActionRequest(StrictModel):
    target_class: str = Field(alias="targetClass")
    academic_year: str | None = Field(default=None, alias="academicYear")
