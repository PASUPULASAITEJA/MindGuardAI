"""Create consent_records table

Revision ID: 2a8c3d7e1f4b
Revises: 10ad2ab0a723
Create Date: 2026-09-16 14:12:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Revision identifiers, used by Alembic.
revision: str = '2a8c3d7e1f4b'
down_revision: Union[str, None] = '10ad2ab0a723'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

consent_type_enum = sa.Enum(
    'journal_sharing',
    'behavioral_tracking',
    'anonymous_analytics',
    'counselor_access',
    name='consent_type_enum'
)

def upgrade() -> None:
    # 1. Create consent_records table
    op.create_table(
        'consent_records',
        sa.Column('id', sa.Uuid(), nullable=False, comment='Unique identifier (v4).'),
        sa.Column('user_id', sa.Uuid(), nullable=False, comment='References USERS(id) of the consenting user.'),
        sa.Column(
            'consent_type',
            consent_type_enum,
            nullable=False,
            comment="Type of consent ('journal_sharing', 'behavioral_tracking', 'anonymous_analytics', 'counselor_access')."
        ),
        sa.Column('granted', sa.Boolean(), nullable=False, comment='Whether consent is actively granted or revoked/declined.'),
        sa.Column('granted_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp when consent was granted.'),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp when consent was revoked.'),
        sa.Column('ip_address', sa.String(length=45), nullable=True, comment='Client IP address during consent decision.'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='Append-only submission timestamp.'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_consent_records_id'), 'consent_records', ['id'], unique=False)
    op.create_index(op.f('ix_consent_records_user_id'), 'consent_records', ['user_id'], unique=False)
    op.create_index(
        'idx_consent_records_user_type_created',
        'consent_records',
        ['user_id', 'consent_type', sa.literal_column('created_at DESC')],
        unique=False
    )

def downgrade() -> None:
    op.drop_index('idx_consent_records_user_type_created', table_name='consent_records')
    op.drop_index(op.f('ix_consent_records_user_id'), table_name='consent_records')
    op.drop_index(op.f('ix_consent_records_id'), table_name='consent_records')
    op.drop_table('consent_records')
    consent_type_enum.drop(op.get_bind(), checkfirst=True)
