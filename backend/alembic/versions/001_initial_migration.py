"""Initial migration - Create meeting_digests table

Revision ID: 001
Revises: 
Create Date: 2025-01-26 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create meeting_digests table
    op.create_table(
        'meeting_digests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('public_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('original_transcript', sa.Text(), nullable=False),
        sa.Column('summary_overview', sa.Text(), nullable=True),
        sa.Column('key_decisions', sa.Text(), nullable=True),
        sa.Column('action_items', sa.Text(), nullable=True),
        sa.Column('full_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_meeting_digests_id'), 'meeting_digests', ['id'], unique=False)
    op.create_index(op.f('ix_meeting_digests_public_id'), 'meeting_digests', ['public_id'], unique=True)

def downgrade():
    op.drop_index(op.f('ix_meeting_digests_public_id'), table_name='meeting_digests')
    op.drop_index(op.f('ix_meeting_digests_id'), table_name='meeting_digests')
    op.drop_table('meeting_digests')
