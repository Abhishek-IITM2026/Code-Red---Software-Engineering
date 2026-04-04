from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import Faculty, InventoryItem, MaterialRequest, MaterialRequestItem
from ...schemas import (
    InventoryItemPatchRequest,
    InventoryItemWriteRequest,
    MaterialRequestCreateRequest,
    MaterialRequestStatusUpdateRequest,
    parse_json,
)


inventory_bp = Blueprint("inventory", __name__)


def _requested_item_map(material_request: MaterialRequest) -> dict[int, int]:
    totals: dict[int, int] = {}
    for item in material_request.items:
        totals[item.item_id] = totals.get(item.item_id, 0) + item.quantity
    return totals


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
        if requested_item.quantity <= 0:
            raise ApiError(422, "INVALID_QUANTITY", "Requested quantity must be greater than zero.")
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
    next_status = payload.status.strip().lower()
    current_status = material_request.status.strip().lower()
    allowed_transitions = {
        "pending": {"approved", "rejected"},
        "approved": {"fulfilled", "rejected"},
        "rejected": set(),
        "fulfilled": set(),
    }

    if next_status == current_status:
        material_request.review_notes = payload.review_notes
        material_request.reviewed_by = g.current_user.id
        db.session.commit()
        return success_response(material_request.to_dict())

    if next_status not in allowed_transitions.get(current_status, set()):
        raise ApiError(
            409,
            "INVALID_STATUS_TRANSITION",
            f"Cannot change request status from '{material_request.status}' to '{next_status}'.",
        )

    item_totals = _requested_item_map(material_request)
    if next_status == "approved":
        for item_id, requested_quantity in item_totals.items():
            inventory_item = db.session.get(InventoryItem, item_id)
            if inventory_item is None:
                raise ApiError(404, "ITEM_NOT_FOUND", "One of the requested inventory items was not found.")
            if inventory_item.available < requested_quantity:
                raise ApiError(
                    409,
                    "INSUFFICIENT_STOCK",
                    f"Not enough available stock for '{inventory_item.name}'.",
                )

    material_request.status = next_status
    material_request.review_notes = payload.review_notes
    material_request.reviewed_by = g.current_user.id
    if next_status == "approved":
        for item in material_request.items:
            if item.inventory_item is not None:
                item.inventory_item.reserved += item.quantity
                item.inventory_item.available = max(0, item.inventory_item.available - item.quantity)
    elif next_status == "fulfilled":
        for item in material_request.items:
            if item.inventory_item is not None:
                item.inventory_item.reserved = max(0, item.inventory_item.reserved - item.quantity)
                item.inventory_item.quantity = max(0, item.inventory_item.quantity - item.quantity)
    elif next_status == "rejected" and current_status == "approved":
        for item in material_request.items:
            if item.inventory_item is not None:
                item.inventory_item.reserved = max(0, item.inventory_item.reserved - item.quantity)
                item.inventory_item.available += item.quantity
    db.session.commit()
    return success_response(material_request.to_dict())
