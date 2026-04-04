"""Add leave_requests table

Revision ID: 001_add_leave_requests
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision = '001_add_leave_requests'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'leave_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('applicant_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('applicant_role', sa.String(20), nullable=False),
        sa.Column('applicant_context', sa.String(100), nullable=False),
        sa.Column('leave_type', sa.String(50), nullable=False),
        sa.Column('from_date', sa.Date(), nullable=False),
        sa.Column('to_date', sa.Date(), nullable=False),
        sa.Column('total_days', sa.Integer(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('contact_number', sa.String(20), nullable=False),
        sa.Column('supporting_note', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='Pending'),
        sa.Column('reviewer_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('reviewer_name', sa.String(100), nullable=True),
        sa.Column('reviewer_comment', sa.Text(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_leave_requests_applicant_id', 'leave_requests', ['applicant_id'])


def downgrade():
    op.drop_index('ix_leave_requests_applicant_id', 'leave_requests')
    op.drop_table('leave_requests')