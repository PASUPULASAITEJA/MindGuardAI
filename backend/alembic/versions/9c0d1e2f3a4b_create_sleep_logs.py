"""Create sleep_logs table for sleep tracking and circadian telemetry

Revision ID: 9c0d1e2f3a4b
Revises: 8b9c0d1e2f3a
Create Date: 2026-09-16 22:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision: str = '9c0d1e2f3a4b'
down_revision: Union[str, None] = '8b9c0d1e2f3a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'sleep_logs' not in tables:
        op.create_table(
            'sleep_logs',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False, comment='Primary key identifier.'),
            sa.Column('user_id', sa.Uuid(), nullable=False, comment='References users.id of student.'),
            sa.Column('log_date', sa.Date(), nullable=False, comment='Calendar date for recorded sleep session.'),
            sa.Column('bedtime', sa.DateTime(timezone=True), nullable=False, comment='Timestamp student went to bed.'),
            sa.Column('wake_time', sa.DateTime(timezone=True), nullable=False, comment='Timestamp student woke up.'),
            sa.Column('sleep_hours', sa.Numeric(precision=3, scale=1), nullable=False, comment='Calculated or recorded hours of sleep.'),
            sa.Column('sleep_quality', sa.Integer(), nullable=False, comment='Sleep quality score (1: Poor, 2: Fair, 3: Good, 4: Great).'),
            sa.Column('nap_taken', sa.Boolean(), nullable=False, server_default=sa.text('false'), comment='Whether daytime nap was taken.'),
            sa.Column('nap_duration_minutes', sa.Integer(), nullable=False, server_default=sa.text('0'), comment='Duration of daytime nap in minutes.'),
            sa.Column('sleep_disruptions', sa.Integer(), nullable=False, server_default=sa.text('0'), comment='Number of nighttime awakenings.'),
            sa.Column('source', sa.String(length=30), nullable=False, server_default='self_report', comment='Data ingestion origin.'),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='Record creation timestamp.'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.CheckConstraint('sleep_quality >= 1 AND sleep_quality <= 4', name='chk_sleep_quality_1_4'),
            sa.CheckConstraint('sleep_hours >= 0.0 AND sleep_hours <= 24.0', name='chk_sleep_hours_range'),
            sa.CheckConstraint('nap_duration_minutes >= 0', name='chk_nap_duration_non_negative'),
            sa.CheckConstraint('sleep_disruptions >= 0', name='chk_disruptions_non_negative')
        )
        op.create_index('idx_sleep_logs_user_date', 'sleep_logs', ['user_id', 'log_date'])
        op.create_index('idx_sleep_logs_user_created', 'sleep_logs', ['user_id', 'created_at'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if 'sleep_logs' in tables:
        op.drop_index('idx_sleep_logs_user_created', table_name='sleep_logs')
        op.drop_index('idx_sleep_logs_user_date', table_name='sleep_logs')
        op.drop_table('sleep_logs')
