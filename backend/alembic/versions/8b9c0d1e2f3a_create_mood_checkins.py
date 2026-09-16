"""Create mood_checkins table for ecological momentary assessment (EMA)

Revision ID: 8b9c0d1e2f3a
Revises: 7a8b9c0d1e2f
Create Date: 2026-09-16 19:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision: str = '8b9c0d1e2f3a'
down_revision: Union[str, None] = '7a8b9c0d1e2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'mood_checkins' not in tables:
        op.create_table(
            'mood_checkins',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False, comment='Primary key identifier.'),
            sa.Column('user_id', sa.Uuid(), nullable=False, comment='References users.id of student.'),
            sa.Column('checkin_type', sa.String(length=10), nullable=False, comment='Check-in window: morning or evening.'),
            sa.Column('mood_score', sa.Integer(), nullable=False, comment='Subjective mood rating (1-10).'),
            sa.Column('energy_level', sa.Integer(), nullable=False, comment='Energy rating (1-10).'),
            sa.Column('anxiety_level', sa.Integer(), nullable=False, comment='Anxiety rating (1-10).'),
            sa.Column('sleep_quality', sa.String(length=10), nullable=False, comment='Sleep quality rating: poor, fair, good, great.'),
            sa.Column('sleep_hours', sa.Numeric(precision=3, scale=1), nullable=False, comment='Recorded hours of sleep.'),
            sa.Column('primary_emotion', sa.String(length=20), nullable=False, comment='Primary emotion tag.'),
            sa.Column('one_word_feeling', sa.String(length=50), nullable=True, comment='Optional single word descriptor.'),
            sa.Column('stress_source', sa.String(length=30), nullable=True, comment='Optional primary driver of current stress.'),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='Timestamp of check-in.'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.CheckConstraint("checkin_type IN ('morning', 'evening')", name='chk_checkin_type'),
            sa.CheckConstraint("mood_score >= 1 AND mood_score <= 10", name='chk_mood_score_range'),
            sa.CheckConstraint("energy_level >= 1 AND energy_level <= 10", name='chk_energy_level_range'),
            sa.CheckConstraint("anxiety_level >= 1 AND anxiety_level <= 10", name='chk_anxiety_level_range'),
            sa.CheckConstraint("sleep_quality IN ('poor', 'fair', 'good', 'great')", name='chk_sleep_quality'),
        )
        op.create_index('idx_mood_checkins_user_created', 'mood_checkins', ['user_id', 'created_at'])
        op.create_index('idx_mood_checkins_user_type', 'mood_checkins', ['user_id', 'checkin_type'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if 'mood_checkins' in tables:
        op.drop_index('idx_mood_checkins_user_type', table_name='mood_checkins')
        op.drop_index('idx_mood_checkins_user_created', table_name='mood_checkins')
        op.drop_table('mood_checkins')
