"""Test cases for Inventory API endpoints."""
import pytest

BASE = "/api/v1/inventory"


class TestInventoryItemsList:
    """Tests for GET /inventory/items"""

    def test_list_items_success(self, client, admin_auth_header):
        """Test listing all inventory items."""
        response = client.get(f"{BASE}/items", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_list_items_forbidden_student(self, client, student_auth_header):
        """Test listing items as student is forbidden."""
        response = client.get(f"{BASE}/items", headers=student_auth_header)
        assert response.status_code == 403


class TestInventoryItemsCreate:
    """Tests for POST /inventory/items"""

    def test_create_item_success(self, client, admin_auth_header):
        """Test creating a new inventory item."""
        response = client.post(
            f"{BASE}/items",
            json={
                "name": "Whiteboard Markers",
                "category": "stationery",
                "quantity": 50,
                "available": 50,
                "reserved": 0,
                "unit": "piece",
                "minStock": 10,
                "price": 25.0,
                "supplier": "Stationery King",
                "location": "Store Room A",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["name"] == "Whiteboard Markers"

    def test_create_item_missing_required(self, client, admin_auth_header):
        """Test creating item with missing required fields."""
        response = client.post(
            f"{BASE}/items",
            json={"name": "Incomplete Item"},
            headers=admin_auth_header,
        )
        assert response.status_code == 422

    def test_create_item_forbidden_faculty(self, client, faculty_auth_header):
        """Test creating item as faculty is forbidden."""
        response = client.post(
            f"{BASE}/items",
            json={
                "name": "Forbidden Item",
                "category": "other",
                "quantity": 10,
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 403


class TestInventoryItemsUpdate:
    """Tests for PUT /inventory/items/{itemId}"""

    def test_update_item_success(self, client, admin_auth_header):
        """Test updating an inventory item."""
        response = client.put(
            f"{BASE}/items/1",
            json={
                "name": "Updated Item Name",
                "category": "stationery",
                "quantity": 100,
                "available": 100,
                "reserved": 0,
                "unit": "piece",
                "minStock": 20,
                "price": 30.0,
                "supplier": "Updated Supplier",
                "location": "Store Room B",
            },
            headers=admin_auth_header,
        )
        assert response.status_code in (200, 404)

    def test_update_item_not_found(self, client, admin_auth_header):
        """Test updating non-existent item."""
        response = client.put(
            f"{BASE}/items/99999",
            json={"name": "Updated Item", "category": "other", "quantity": 10},
            headers=admin_auth_header,
        )
        assert response.status_code == 404


class TestInventoryItemsDelete:
    """Tests for DELETE /inventory/items/{itemId}"""

    def test_delete_item_success(self, client, admin_auth_header):
        """Test deleting an inventory item."""
        response = client.delete(f"{BASE}/items/1", headers=admin_auth_header)
        assert response.status_code in (200, 404)

    def test_delete_item_not_found(self, client, admin_auth_header):
        """Test deleting non-existent item."""
        response = client.delete(f"{BASE}/items/99999", headers=admin_auth_header)
        assert response.status_code == 404


class TestInventoryRequestsList:
    """Tests for GET /inventory/requests"""

    def test_list_requests_success(self, client, admin_auth_header):
        """Test listing all material requests."""
        response = client.get(f"{BASE}/requests", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)


class TestInventoryRequestsCreate:
    """Tests for POST /inventory/requests"""

    def test_create_request_success(self, client, faculty_auth_header):
        """Test creating a material request."""
        response = client.post(
            f"{BASE}/requests",
            json={
                "department": "Science",
                "items": [{"itemId": "1", "quantity": 5}],
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 201

    def test_create_request_missing_department(self, client, faculty_auth_header):
        """Test creating request without department."""
        response = client.post(
            f"{BASE}/requests",
            json={"items": [{"itemId": "1", "quantity": 5}]},
            headers=faculty_auth_header,
        )
        assert response.status_code == 422

    def test_create_request_empty_items(self, client, faculty_auth_header):
        """Test creating request with empty items."""
        response = client.post(
            f"{BASE}/requests",
            json={"department": "Mathematics", "items": []},
            headers=faculty_auth_header,
        )
        assert response.status_code == 422


class TestInventoryRequestStatus:
    """Tests for PATCH /inventory/requests/{requestId}/status"""

    def test_update_request_status_success(self, client, admin_auth_header):
        """Test updating request status."""
        response = client.patch(
            f"{BASE}/requests/1/status",
            json={"status": "Approved"},
            headers=admin_auth_header,
        )
        assert response.status_code in (200, 404)

    def test_update_request_status_not_found(self, client, admin_auth_header):
        """Test updating non-existent request."""
        response = client.patch(
            f"{BASE}/requests/99999/status",
            json={"status": "Approved"},
            headers=admin_auth_header,
        )
        assert response.status_code == 404

    def test_update_request_status_forbidden_faculty(self, client, faculty_auth_header):
        """Test updating request status as faculty is forbidden."""
        response = client.patch(
            f"{BASE}/requests/1/status",
            json={"status": "Approved"},
            headers=faculty_auth_header,
        )
        assert response.status_code == 403