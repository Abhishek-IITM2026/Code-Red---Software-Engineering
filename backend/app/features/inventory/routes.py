from datetime import date

from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import Faculty, InventoryItem, InventoryProcurement, MaterialRequest, MaterialRequestItem, Vendor
from ...schemas import (
    InventoryItemPatchRequest,
    InventoryProcurementWriteRequest,
    InventoryItemWriteRequest,
    MaterialRequestCreateRequest,
    MaterialRequestStatusUpdateRequest,
    VendorWriteRequest,
    parse_json,
)
from ...services.finance import create_financial_transaction


inventory_bp = Blueprint("inventory", __name__)


def _has_procurement_access() -> bool:
    if not hasattr(g, "current_user"):
        return False
    if g.current_user.has_any_role("director", "superadmin"):
        return True
    assignment = getattr(g.current_user, "authority_assignment", None)
    authorities = assignment.authorities_json if assignment is not None else {}
    return bool(authorities.get("procurementManagement") or authorities.get("inventoryProcurement"))


@inventory_bp.get("/items")
@roles_required("faculty", "administration")
def list_inventory_items():
    return success_response([item.to_dict() for item in InventoryItem.query.order_by(InventoryItem.id.asc()).all()])


@inventory_bp.post("/items")
@roles_required("administration")
def create_inventory_item():
    payload = parse_json(InventoryItemWriteRequest, request.get_json())
    item = InventoryItem(
        name=payload.name,
        category=payload.category,
        quantity=payload.quantity,
        available=payload.available,
        reserved=payload.reserved,
        unit=payload.unit,
        min_stock=payload.min_stock,
        price=payload.price,
        supplier=payload.supplier,
        location=payload.location,
        description=payload.description,
    )
    db.session.add(item)
    db.session.commit()
    return success_response(item.to_dict(), status_code=201)


@inventory_bp.put("/items/<int:item_id>")
@roles_required("administration")
def update_inventory_item(item_id: int):
    item = db.session.get(InventoryItem, item_id)
    if item is None:
        raise ApiError(404, "ITEM_NOT_FOUND", "Inventory item was not found.")
    payload = parse_json(InventoryItemPatchRequest, request.get_json())
    updates = payload.model_dump(by_alias=True, exclude_none=True)
    attribute_map = {
        "name": "name",
        "category": "category",
        "quantity": "quantity",
        "available": "available",
        "reserved": "reserved",
        "unit": "unit",
        "minStock": "min_stock",
        "price": "price",
        "supplier": "supplier",
        "location": "location",
        "description": "description",
    }
    for field, attr in attribute_map.items():
        if field in updates:
            setattr(item, attr, updates[field])
    db.session.commit()
    return success_response(item.to_dict())


@inventory_bp.delete("/items/<int:item_id>")
@roles_required("administration")
def delete_inventory_item(item_id: int):
    item = db.session.get(InventoryItem, item_id)
    if item is None:
        raise ApiError(404, "ITEM_NOT_FOUND", "Inventory item was not found.")
    db.session.delete(item)
    db.session.commit()
    return "", 204


@inventory_bp.get("/requests")
@roles_required("faculty", "administration")
def list_material_requests():
    query = MaterialRequest.query
    if request.args.get("facultyId"):
        query = query.filter_by(faculty_id=int(request.args["facultyId"]))
    if request.args.get("status"):
        query = query.filter_by(status=request.args["status"])
    return success_response([material_request.to_dict() for material_request in query.order_by(MaterialRequest.id.desc()).all()])


@inventory_bp.post("/requests")
@roles_required("faculty", "administration")
def create_material_request():
    payload = parse_json(MaterialRequestCreateRequest, request.get_json())
    faculty_id = payload.faculty_id
    if faculty_id is None:
        faculty_id = g.current_user.faculty.id if g.current_user.faculty else None
    faculty = db.session.get(Faculty, faculty_id) if faculty_id is not None else None
    if faculty is None:
        raise ApiError(404, "FACULTY_NOT_FOUND", "Faculty profile was not found.")
    material_request = MaterialRequest(
        faculty_id=faculty.id,
        department=payload.department,
        status="pending",
    )
    db.session.add(material_request)
    db.session.flush()
    for requested_item in payload.items:
        inventory_item = db.session.get(InventoryItem, requested_item.item_id)
        if inventory_item is None:
            raise ApiError(404, "ITEM_NOT_FOUND", "One of the requested inventory items was not found.")
        db.session.add(
            MaterialRequestItem(
                request_id=material_request.id,
                item_id=requested_item.item_id,
                quantity=requested_item.quantity,
                notes=requested_item.notes,
            )
        )
    db.session.commit()
    return success_response(material_request.to_dict(), status_code=201)


@inventory_bp.patch("/requests/<int:request_id>/status")
@roles_required("administration")
def update_material_request_status(request_id: int):
    material_request = db.session.get(MaterialRequest, request_id)
    if material_request is None:
        raise ApiError(404, "REQUEST_NOT_FOUND", "Material request was not found.")
    payload = parse_json(MaterialRequestStatusUpdateRequest, request.get_json())
    material_request.status = payload.status
    material_request.review_notes = payload.review_notes
    material_request.reviewed_by = g.current_user.id
    if payload.status == "approved":
        for item in material_request.items:
            if item.inventory_item is not None:
                item.inventory_item.reserved += item.quantity
                item.inventory_item.available = max(0, item.inventory_item.available - item.quantity)
    elif payload.status == "fulfilled":
        for item in material_request.items:
            if item.inventory_item is not None:
                item.inventory_item.reserved = max(0, item.inventory_item.reserved - item.quantity)
                item.inventory_item.quantity = max(0, item.inventory_item.quantity - item.quantity)
    db.session.commit()
    return success_response(material_request.to_dict())


@inventory_bp.get("/vendors")
@roles_required("administration")
def list_vendors():
    if not _has_procurement_access():
        raise ApiError(403, "FORBIDDEN", "You do not have permission to manage procurement vendors.")
    return success_response([vendor.to_dict() for vendor in Vendor.query.order_by(Vendor.name.asc()).all()])


@inventory_bp.post("/vendors")
@roles_required("administration")
def create_vendor():
    if not _has_procurement_access():
        raise ApiError(403, "FORBIDDEN", "You do not have permission to create vendors.")
    payload = parse_json(VendorWriteRequest, request.get_json())
    vendor = Vendor(
        name=payload.name,
        contact_person=payload.contact_person,
        email=payload.email,
        phone=payload.phone,
        gst_number=payload.gst_number,
        address=payload.address,
        notes=payload.notes,
        is_active=payload.is_active,
    )
    db.session.add(vendor)
    db.session.commit()
    return success_response(vendor.to_dict(), status_code=201)


@inventory_bp.get("/procurements")
@roles_required("administration")
def list_procurements():
    if not _has_procurement_access():
        raise ApiError(403, "FORBIDDEN", "You do not have permission to view procurement records.")
    return success_response(
        [item.to_dict() for item in InventoryProcurement.query.order_by(InventoryProcurement.purchase_date.desc()).all()]
    )


@inventory_bp.post("/procurements")
@roles_required("administration")
def create_procurement():
    if not _has_procurement_access():
        raise ApiError(403, "FORBIDDEN", "You do not have permission to create procurement records.")
    payload = parse_json(InventoryProcurementWriteRequest, request.get_json())
    inventory_item = db.session.get(InventoryItem, payload.inventory_item_id)
    if inventory_item is None:
        raise ApiError(404, "ITEM_NOT_FOUND", "Inventory item was not found.")
    vendor = db.session.get(Vendor, payload.vendor_id)
    if vendor is None:
        raise ApiError(404, "VENDOR_NOT_FOUND", "Vendor was not found.")
    total_amount = round(
        (float(payload.unit_price or 0) * int(payload.quantity or 0))
        + float(payload.tax_amount or 0)
        + float(payload.shipping_cost or 0),
        2,
    )
    procurement = InventoryProcurement(
        inventory_item_id=inventory_item.id,
        vendor_id=vendor.id,
        quantity=payload.quantity,
        unit_price=payload.unit_price,
        tax_amount=payload.tax_amount,
        shipping_cost=payload.shipping_cost,
        total_amount=total_amount,
        invoice_number=payload.invoice_number,
        purchase_date=date.fromisoformat(payload.purchase_date),
        payment_status=payload.payment_status,
        received_status=payload.received_status,
        notes=payload.notes,
        created_by=g.current_user.id,
    )
    db.session.add(procurement)
    inventory_item.quantity += payload.quantity
    inventory_item.available += payload.quantity
    create_financial_transaction(
        transaction_type="inventory_procurement",
        category="inventory_expense",
        direction="outflow",
        amount=total_amount,
        payment_method="vendor_invoice",
        status=payload.payment_status,
        reference_type="inventory_procurement",
        reference_id=None,
        counterparty_name=vendor.name,
        description=f"Procurement for {inventory_item.name}",
        metadata={
            "inventoryItemId": str(inventory_item.id),
            "vendorId": str(vendor.id),
            "invoiceNumber": payload.invoice_number,
            "quantity": payload.quantity,
        },
        created_by=g.current_user.id,
    )
    db.session.commit()
    return success_response(procurement.to_dict(), status_code=201)
