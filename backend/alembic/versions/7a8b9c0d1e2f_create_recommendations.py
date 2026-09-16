"""Create recommendation records and feedback support

Revision ID: 7a8b9c0d1e2f
Revises: 6f3a4b5c6d7e
Create Date: 2026-09-16 18:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision: str = '7a8b9c0d1e2f'
down_revision: Union[str, None] = '6f3a4b5c6d7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'recommendation_records' not in tables:
        op.create_table(
            'recommendation_records',
            sa.Column('id', sa.Uuid(), nullable=False, primary_key=True, comment='Unique identifier for recommendation record.'),
            sa.Column('user_id', sa.Uuid(), nullable=False, comment='References users.id of student receiving recommendation.'),
            sa.Column('category', sa.String(length=50), nullable=False, comment='Intervention category e.g. BREATHING, GROUNDING, REFRAMING.'),
            sa.Column('title', sa.String(length=255), nullable=False, comment='Title of recommended tool/resource.'),
            sa.Column('description', sa.Text(), nullable=False, comment='Actionable explanation.'),
            sa.Column('reason', sa.Text(), nullable=True, comment='Clinical rationale for personalized recommendation.'),
            sa.Column('action_type', sa.String(length=50), nullable=False, server_default='INTERNAL_ROUTE', comment='Type of destination (INTERNAL_ROUTE, EXTERNAL_URL).'),
            sa.Column('action_url', sa.String(length=255), nullable=False, comment='Target app route or external URL.'),
            sa.Column('risk_tier', sa.String(length=20), nullable=True, comment='Risk tier at time of recommendation generation.'),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='ACTIVE', comment='Status of recommendation (ACTIVE, COMPLETED, DISMISSED).'),
            sa.Column('feedback', sa.String(length=20), nullable=True, comment='User feedback (HELPFUL, NOT_HELPFUL).'),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='Timestamp created.'),
            sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp when marked completed.'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        )
        op.create_index('idx_rec_user_status', 'recommendation_records', ['user_id', 'status'])
        op.create_index('idx_rec_user_created', 'recommendation_records', ['user_id', 'created_at'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if 'recommendation_records' in tables:
        op.drop_index('idx_rec_user_created', table_name='recommendation_records')
        op.drop_index('idx_rec_user_status', table_name='recommendation_records')
        op.drop_table('recommendation_records')
