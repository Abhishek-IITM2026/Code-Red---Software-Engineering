"""Add week columns to assessments and assignments

Revision ID: 002_add_week_to_assessments_and_assignments
Revises: 001_add_leave_requests
Create Date: 2026-04-10 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "002_add_week_to_assessments_and_assignments"
down_revision = "001_add_leave_requests"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("assessments", sa.Column("week", sa.String(length=50), nullable=True))
    op.add_column("assignments", sa.Column("week", sa.String(length=50), nullable=True))


def downgrade():
    op.drop_column("assignments", "week")
    op.drop_column("assessments", "week")
