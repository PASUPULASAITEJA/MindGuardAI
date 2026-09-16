"""Create notifications table for real-time notifications

Revision ID: 5e2f3a4b5c6d
Revises: 4d1e2f3a5b6c
Create Date: 2026-09-16 16:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision: str = '5e2f3a4b5c6d'
down_revision: Union[str, None] = '4d1e2f3a5b6c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

notification_type_enum = sa.Enum(
    'risk_alert',
    'session_reminder',
    'system',
    'counselor_message',
    name='notification_type_enum'
)

notification_channel_enum = sa.Enum(
    'in_app',
    'email',
    'both',
    name='notification_channel_enum'
)

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'notifications' not in tables:
        op.create_table(
            'notifications',
            sa.Column('id', sa.Uuid(), nullable=False, primary_key=True, comment='Unique identifier (v4).'),
            sa.Column('user_id', sa.Uuid(), nullable=False, comment='Recipient user ID (FK to users.id).'),
            sa.Column('type', notification_type_enum, nullable=False, comment='Notification classification.'),
            sa.Column('title', sa.String(length=255), nullable=False, comment='Notification title.'),
            sa.Column('message', sa.Text(), nullable=False, comment='Notification body message.'),
            sa.Column('channel', notification_channel_enum, nullable=False, server_default='in_app', comment='Delivery channel.'),
            sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false'), comment='Read status flag.'),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='Timestamp when notification was created.'),
            sa.Column('read_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp when notification was read.'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        )
        op.create_index('idx_notifications_user_created', 'notifications', ['user_id', 'created_at'])
        op.create_index('idx_notifications_user_read', 'notifications', ['user_id', 'is_read'])

def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if 'notifications' in tables:
        op.drop_index('idx_notifications_user_read', table_name='notifications')
        op.drop_index('idx_notifications_user_created', table_name='notifications')
        op.drop_table('notifications')
