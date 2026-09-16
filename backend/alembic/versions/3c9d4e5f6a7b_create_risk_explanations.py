"""Create risk_explanations table for SHAP TreeExplainer factors

Revision ID: 3c9d4e5f6a7b
Revises: 2a8c3d7e1f4b
Create Date: 2026-09-16 15:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision: str = '3c9d4e5f6a7b'
down_revision: Union[str, None] = '2a8c3d7e1f4b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

explanation_direction_enum = sa.Enum(
    'increasing_risk',
    'decreasing_risk',
    name='explanation_direction_enum'
)

def upgrade() -> None:
    op.create_table(
        'risk_explanations',
        sa.Column('id', sa.Uuid(), nullable=False, comment='Unique identifier (v4).'),
        sa.Column('prediction_id', sa.Uuid(), nullable=False, comment='References ASSESSMENTS(id) of the evaluated prediction.'),
        sa.Column('feature_name', sa.String(length=255), nullable=False, comment='Name of contributing feature from model inputs.'),
        sa.Column('shap_value', sa.Float(), nullable=False, comment='Calculated SHAP attribution value from TreeExplainer.'),
        sa.Column(
            'direction',
            explanation_direction_enum,
            nullable=False,
            comment="Impact direction: 'increasing_risk' (↑) or 'decreasing_risk' (↓ protective)."
        ),
        sa.Column('rank', sa.Integer(), nullable=False, comment='Priority rank of feature importance (1, 2, 3).'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='Timestamp when SHAP values were generated.'),
        sa.ForeignKeyConstraint(['prediction_id'], ['assessments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_risk_explanations_id'), 'risk_explanations', ['id'], unique=False)
    op.create_index(op.f('ix_risk_explanations_prediction_id'), 'risk_explanations', ['prediction_id'], unique=False)
    op.create_index(
        'idx_risk_explanations_pred_rank',
        'risk_explanations',
        ['prediction_id', 'rank'],
        unique=False
    )

def downgrade() -> None:
    op.drop_index('idx_risk_explanations_pred_rank', table_name='risk_explanations')
    op.drop_index(op.f('ix_risk_explanations_prediction_id'), table_name='risk_explanations')
    op.drop_index(op.f('ix_risk_explanations_id'), table_name='risk_explanations')
    op.drop_table('risk_explanations')
    explanation_direction_enum.drop(op.get_bind(), checkfirst=True)
