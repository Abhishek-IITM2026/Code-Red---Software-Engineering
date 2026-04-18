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


class VendorWriteRequest(StrictModel):
    name: str
    contact_person: str | None = Field(default=None, alias="contactPerson")
    email: str | None = None
    phone: str | None = None
    gst_number: str | None = Field(default=None, alias="gstNumber")
    address: str | None = None
    notes: str | None = None
    is_active: bool = Field(default=True, alias="isActive")


class InventoryProcurementWriteRequest(StrictModel):
    inventory_item_id: int = Field(alias="inventoryItemId")
    vendor_id: int = Field(alias="vendorId")
    quantity: int
    unit_price: float = Field(alias="unitPrice")
    tax_amount: float = Field(default=0, alias="taxAmount")
    shipping_cost: float = Field(default=0, alias="shippingCost")
    invoice_number: str | None = Field(default=None, alias="invoiceNumber")
    purchase_date: str = Field(alias="purchaseDate")
    payment_status: str = Field(default="pending", alias="paymentStatus")
    received_status: str = Field(default="received", alias="receivedStatus")
    notes: str | None = None
