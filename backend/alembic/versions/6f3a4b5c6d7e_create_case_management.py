"""Create case notes and case management support

Revision ID: 6f3a4b5c6d7e
Revises: 5e2f3a4b5c6d
Create Date: 2026-09-16 16:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision: str = '6f3a4b5c6d7e'
down_revision: Union[str, None] = '5e2f3a4b5c6d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'case_notes' not in tables:
        op.create_table(
            'case_notes',
            sa.Column('id', sa.Uuid(), nullable=False, primary_key=True, comment='Unique identifier for case note (v4).'),
            sa.Column('alert_id', sa.Uuid(), nullable=True, comment='Associated alert ID if note was recorded during alert case workflow.'),
            sa.Column('student_id', sa.Uuid(), nullable=False, comment='References users.id of student receiving care.'),
            sa.Column('counselor_id', sa.Uuid(), nullable=False, comment='References users.id of counselor/admin author.'),
            sa.Column('note', sa.Text(), nullable=False, comment='Clinical observations, outreach notes, or action plans.'),
            sa.Column('category', sa.String(length=50), nullable=True, server_default='GENERAL', comment='Clinical note category.'),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='Timestamp when note was recorded.'),
            sa.ForeignKeyConstraint(['alert_id'], ['alerts.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['counselor_id'], ['users.id'], ondelete='RESTRICT'),
        )
        op.create_index('idx_case_notes_alert', 'case_notes', ['alert_id', 'created_at'])
        op.create_index('idx_case_notes_student', 'case_notes', ['student_id', 'created_at'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if 'case_notes' in tables:
        op.drop_index('idx_case_notes_student', table_name='case_notes')
        op.drop_index('idx_case_notes_alert', table_name='case_notes')
        op.drop_table('case_notes')
