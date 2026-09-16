"""Create audit_logs table for security and compliance audit logging

Revision ID: 4d1e2f3a5b6c
Revises: 3c9d4e5f6a7b
Create Date: 2026-09-16 15:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision: str = '4d1e2f3a5b6c'
down_revision: Union[str, None] = '3c9d4e5f6a7b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Use checkfirst pattern / safe creation in case table was initialized via Base.metadata.create_all
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'audit_logs' not in tables:
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.Uuid(), nullable=False, primary_key=True, comment='Unique identifier for audit event entry (v4).'),
            sa.Column('actor_user_id', sa.Uuid(), nullable=True, comment='User initiating the action (null for system).'),
            sa.Column('actor_role', sa.String(length=50), nullable=False, server_default='SYSTEM', comment='Role of the actor at execution time.'),
            sa.Column('action', sa.String(length=100), nullable=False, comment='Normalized action identifier.'),
            sa.Column('target_user_id', sa.Uuid(), nullable=True, comment='Subject user whose clinical records were accessed.'),
            sa.Column('target_resource_type', sa.String(length=100), nullable=False, comment='Classification of touched resource.'),
            sa.Column('target_resource_id', sa.String(length=100), nullable=True, comment='Identifier of touched resource.'),
            sa.Column('request_id', sa.String(length=100), nullable=True, comment='Distributed correlation request ID.'),
            sa.Column('ip_address', sa.String(length=100), nullable=True, comment='Client network IP address.'),
            sa.Column('user_agent', sa.String(length=255), nullable=True, comment='Client HTTP User-Agent string.'),
            sa.Column('metadata_json', sa.JSON(), nullable=True, comment='Contextual metadata JSON payload.'),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='Immutable audit event timestamp.'),
            sa.ForeignKeyConstraint(['actor_user_id'], ['users.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['target_user_id'], ['users.id'], ondelete='SET NULL'),
        )
        op.create_index('idx_audit_logs_action_created', 'audit_logs', ['action', 'created_at'])
        op.create_index('idx_audit_logs_target_created', 'audit_logs', ['target_user_id', 'created_at'])
        op.create_index('idx_audit_logs_actor_created', 'audit_logs', ['actor_user_id', 'created_at'])

def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if 'audit_logs' in tables:
        op.drop_index('idx_audit_logs_actor_created', table_name='audit_logs')
        op.drop_index('idx_audit_logs_target_created', table_name='audit_logs')
        op.drop_index('idx_audit_logs_action_created', table_name='audit_logs')
        op.drop_table('audit_logs')
