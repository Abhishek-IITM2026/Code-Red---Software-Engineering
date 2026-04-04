from pydantic import Field

from .validation import StrictModel


class InventoryItemWriteRequest(StrictModel):
    name: str
    category: str = "other"
    quantity: int = 0
    available: int = 0
    reserved: int = 0
    unit: str = "piece"
    min_stock: int = Field(default=0, alias="minStock")
    price: float = 0
    supplier: str | None = None
    location: str | None = None
    description: str | None = None


class InventoryItemPatchRequest(StrictModel):
    name: str | None = None
    category: str | None = None
    quantity: int | None = None
    available: int | None = None
    reserved: int | None = None
    unit: str | None = None
    min_stock: int | None = Field(default=None, alias="minStock")
    price: float | None = None
    supplier: str | None = None
    location: str | None = None
    description: str | None = None


class MaterialRequestItemInput(StrictModel):
    item_id: int = Field(alias="itemId")
    quantity: int
    notes: str | None = None


class MaterialRequestCreateRequest(StrictModel):
    faculty_id: int | None = Field(default=None, alias="facultyId")
    department: str
    items: list[MaterialRequestItemInput]


class MaterialRequestStatusUpdateRequest(StrictModel):
    status: str
    review_notes: str | None = Field(default=None, alias="reviewNotes")
