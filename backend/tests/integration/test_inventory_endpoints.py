"""Integration tests for Inventory Blueprint API endpoints."""
import pytest

from app import create_app
from app.extensions import db
from app.seed import seed_database


SEEDED_ADMIN_EMAIL = "admin@example.in"


@pytest.fixture(scope="module")
def app():
    app = create_app("testing")
    with app.app_context():
        db.drop_all()
        db.create_all()
        seed_database(force=True)
    yield app
    with app.app_context():
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def admin_auth(client):
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_ADMIN_EMAIL,
        "password": "admin123"
    })
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.get_json()['token']}"}


class TestListInventoryItemsEndpoint:
    """Test GET /api/v1/inventory/items"""

    def test_list_items_as_admin(self, client, admin_auth):
        """Test admin can list inventory items."""
        response = client.get("/api/v1/inventory/items", headers=admin_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "data" in data
        assert isinstance(data["data"], list)

    def test_list_items_unauthenticated(self, client):
        """Test listing items without auth fails."""
        response = client.get("/api/v1/inventory/items")
        assert response.status_code == 401


class TestCreateInventoryItemEndpoint:
    """Test POST /api/v1/inventory/items"""

    def test_create_item_success(self, client, admin_auth):
        """Test admin can create inventory item."""
        response = client.post("/api/v1/inventory/items", headers=admin_auth, json={
            "name": "Test Item",
            "category": "Test",
            "quantity": 100,
            "available": 100,
            "unit": "pieces",
            "minStock": 10,
            "price": 50.00
        })
        assert response.status_code == 201

    def test_create_item_unauthenticated(self, client):
        """Test creating item without auth fails."""
        response = client.post("/api/v1/inventory/items", json={
            "name": "Test Item",
            "category": "Test"
        })
        assert response.status_code == 401

    def test_create_item_missing_fields(self, client, admin_auth):
        """Test creating item with missing required fields."""
        response = client.post("/api/v1/inventory/items", headers=admin_auth, json={
            "name": "Test Item"
        })
        assert response.status_code == 422


class TestInventoryRequestsEndpoint:
    """Test /api/v1/inventory/requests"""

    def test_list_requests_as_admin(self, client, admin_auth):
        """Test admin can list material requests."""
        response = client.get("/api/v1/inventory/requests", headers=admin_auth)
        assert response.status_code == 200

    def test_list_requests_with_status_filter(self, client, admin_auth):
        """Test listing requests with status filter."""
        response = client.get("/api/v1/inventory/requests?status=pending", headers=admin_auth)
        assert response.status_code == 200


class TestInventoryVendorsEndpoint:
    """Test /api/v1/inventory/vendors"""

    def test_list_vendors_as_admin(self, client, admin_auth):
        """Test admin can list vendors."""
        response = client.get("/api/v1/inventory/vendors", headers=admin_auth)
        assert response.status_code == 200

    def test_create_vendor_success(self, client, admin_auth):
        """Test admin can create vendor."""
        response = client.post("/api/v1/inventory/vendors", headers=admin_auth, json={
            "name": "Test Vendor",
            "email": "vendor@test.com",
            "phone": "+919876543210",
            "contactPerson": "John Doe"
        })
        assert response.status_code == 201


class TestInventoryProcurementsEndpoint:
    """Test /api/v1/inventory/procurements"""

    def test_list_procurements_as_admin(self, client, admin_auth):
        """Test admin can list procurements."""
        response = client.get("/api/v1/inventory/procurements", headers=admin_auth)
        assert response.status_code == 200