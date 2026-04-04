from pydantic import Field

from .validation import StrictModel


class SalarySlipListQuery(StrictModel):
    staff_id: str | None = Field(default=None, alias="staffId")
    year: str | None = None
    month_key: str | None = Field(default=None, alias="monthKey")
