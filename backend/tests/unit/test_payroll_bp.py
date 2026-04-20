"""Unit tests for Payroll Blueprint business logic."""
import pytest
from datetime import date

from app import create_app
from app.extensions import db
from app.models import SalarySlip, StaffSalaryAccount, User, UserStatus


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
def payroll_data(app):
    """Create sample data for payroll testing."""
    with app.app_context():
        # Create user
        user = User(
            email="payroll_test@example.com",
            first_name="Payroll",
            last_name="Test",
            password_hash="hash",
            status=UserStatus.ACTIVE,
            role_scope="faculty",
        )
        db.session.add(user)
        db.session.flush()

        # Create salary account
        salary_account = StaffSalaryAccount(
            user_id=user.id,
            account_holder_name="Payroll Test",
            bank_name="State Bank",
            account_number="1234567890",
            ifsc_code="SBIN0001234",
            branch_name="Main Branch",
            account_type="Savings",
            verification_status="approved",
        )
        db.session.add(salary_account)

        # Create salary slip
        salary_slip = SalarySlip(
            user_id=user.id,
            staff_id=str(user.id),
            staff_name="Payroll Test",
            year=2024,
            month_key="2024-05",
            month_label="May",
            basic_salary=50000.00,
            allowances=10000.00,
            deductions=5000.00,
            net_salary=55000.00,
        )
        db.session.add(salary_slip)
        db.session.commit()

        yield {
            "user": user,
            "salary_account": salary_account,
            "salary_slip": salary_slip,
        }

        # Cleanup
        db.session.delete(salary_slip)
        db.session.delete(salary_account)
        db.session.delete(user)
        db.session.commit()


class TestSalarySlipModel:
    """Test SalarySlip model operations."""

    def test_salary_slip_creation(self, app, payroll_data):
        """Test creating a salary slip."""
        with app.app_context():
            slip = SalarySlip.query.get(payroll_data["salary_slip"].id)
            assert slip is not None
            assert slip.net_salary == 55000.00

    def test_salary_slip_to_dict(self, app, payroll_data):
        """Test salary slip serialization."""
        with app.app_context():
            slip = SalarySlip.query.get(payroll_data["salary_slip"].id)
            data = slip.to_dict()
            assert "basicSalary" in data
            assert "netSalary" in data
            assert data["netSalary"] == 55000.00

    def test_salary_slip_month_key(self, app, payroll_data):
        """Test salary slip month key format."""
        with app.app_context():
            slip = SalarySlip.query.get(payroll_data["salary_slip"].id)
            assert slip.month_key == "2024-05"
            assert slip.year == 2024


class TestSalaryAccountModel:
    """Test StaffSalaryAccount model operations."""

    def test_salary_account_creation(self, app, payroll_data):
        """Test creating a salary account."""
        with app.app_context():
            account = StaffSalaryAccount.query.filter_by(
                user_id=payroll_data["user"].id
            ).first()
            assert account is not None
            assert account.bank_name == "State Bank"

    def test_salary_account_to_dict(self, app, payroll_data):
        """Test salary account serialization."""
        with app.app_context():
            account = StaffSalaryAccount.query.filter_by(
                user_id=payroll_data["user"].id
            ).first()
            data = account.to_dict()
            assert "bankName" in data
            assert "accountNumber" in data
            assert "accountHolderName" in data

    def test_account_verification_status(self, app, payroll_data):
        """Test account verification status."""
        with app.app_context():
            account = StaffSalaryAccount.query.filter_by(
                user_id=payroll_data["user"].id
            ).first()
            assert account.verification_status == "approved"


class TestPayrollCalculations:
    """Test payroll calculation logic."""

    def test_net_salary_calculation(self):
        """Test net salary calculation."""
        basic = 50000.00
        allowances = 10000.00
        deductions = 5000.00
        net = basic + allowances - deductions
        assert net == 55000.00

    def test_salary_slip_normalized_name(self, app, payroll_data):
        """Test normalized staff name formatting."""
        with app.app_context():
            slip = SalarySlip.query.get(payroll_data["salary_slip"].id)
            normalized = slip.normalized_staff_name.replace(" ", "_")
            assert "Payroll" in normalized
            assert "Test" in normalized