"""Unit tests for Inventory Blueprint business logic."""
import pytest
from datetime import date

from app import create_app
from app.extensions import db
from app.models import InventoryItem, Vendor, MaterialRequest, Faculty, User, UserStatus


@pytest.fixture(scope="module")
def app():
    """Create application for unit testing."""
    app = create_app("testing")
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.drop_all()


@pytest.fixture
def inventory_data(app):
    """Create sample data for inventory testing."""
    with app.app_context():
        # Create inventory item
        item = InventoryItem(
            name="Whiteboard Markers",
            category="Stationery",
            quantity=100,
            available=80,
            reserved=20,
            unit="pieces",
            min_stock=10,
            price=50.00,
            supplier="Office Supplies Co.",
            location="Storage Room A",
            description="Blue whiteboard markers",
        )
        db.session.add(item)

        # Create vendor
        vendor = Vendor(
            name="Office Supplies Co.",
            contact_person="John Doe",
            email="john@officesupplies.com",
            phone="+919876543210",
            gst_number="09AABCU9603R1ZM",
            address="123 Main Street, Delhi",
            is_active=True,
        )
        db.session.add(vendor)
        db.session.commit()

        yield {
            "item": item,
            "vendor": vendor,
        }

        # Cleanup
        db.session.delete(item)
        db.session.delete(vendor)
        db.session.commit()


class TestInventoryItemModel:
    """Test InventoryItem model operations."""

    def test_item_creation(self, app, inventory_data):
        """Test creating an inventory item."""
        with app.app_context():
            item = InventoryItem.query.get(inventory_data["item"].id)
            assert item is not None
            assert item.name == "Whiteboard Markers"
            assert item.quantity == 100

    def test_item_to_dict(self, app, inventory_data):
        """Test inventory item serialization."""
        with app.app_context():
            item = InventoryItem.query.get(inventory_data["item"].id)
            data = item.to_dict()
            assert "name" in data
            assert "quantity" in data
            assert "available" in data
            assert data["name"] == "Whiteboard Markers"

    def test_item_stock_status(self, app, inventory_data):
        """Test checking if item needs reorder."""
        with app.app_context():
            item = InventoryItem.query.get(inventory_data["item"].id)
            needs_reorder = item.available <= item.min_stock
            assert needs_reorder is False  # 80 > 10


class TestVendorModel:
    """Test Vendor model operations."""

    def test_vendor_creation(self, app, inventory_data):
        """Test creating a vendor."""
        with app.app_context():
            vendor = Vendor.query.get(inventory_data["vendor"].id)
            assert vendor is not None
            assert vendor.name == "Office Supplies Co."

    def test_vendor_to_dict(self, app, inventory_data):
        """Test vendor serialization."""
        with app.app_context():
            vendor = Vendor.query.get(inventory_data["vendor"].id)
            data = vendor.to_dict()
            assert "name" in data
            assert "email" in data
            assert data["name"] == "Office Supplies Co."

    def test_vendor_active_status(self, app, inventory_data):
        """Test vendor active status."""
        with app.app_context():
            vendor = Vendor.query.get(inventory_data["vendor"].id)
            assert vendor.is_active is True


class TestInventoryOperations:
    """Test inventory operations."""

    def test_update_item_quantity(self, app, inventory_data):
        """Test updating item quantity."""
        with app.app_context():
            item = InventoryItem.query.get(inventory_data["item"].id)
            item.quantity += 50
            item.available += 50
            db.session.commit()
            
            updated_item = InventoryItem.query.get(inventory_data["item"].id)
            assert updated_item.quantity == 150
            assert updated_item.available == 130

    def test_reserve_stock(self, app, inventory_data):
        """Test reserving inventory stock."""
        with app.app_context():
            item = InventoryItem.query.get(inventory_data["item"].id)
            reserve_qty = 10
            item.available -= reserve_qty
            item.reserved += reserve_qty
            db.session.commit()
            
            updated_item = InventoryItem.query.get(inventory_data["item"].id)
            assert updated_item.available == 70
            assert updated_item.reserved == 30

    def test_item_delete(self, app):
        """Test deleting an inventory item."""
        with app.app_context():
            item = InventoryItem(
                name="Test Item",
                category="Test",
                quantity=10,
                available=10,
                unit="units",
                min_stock=5,
                price=100,
            )
            db.session.add(item)
            db.session.commit()
            item_id = item.id
            db.session.delete(item)
            db.session.commit()
            
            deleted_item = InventoryItem.query.get(item_id)
            assert deleted_item is None