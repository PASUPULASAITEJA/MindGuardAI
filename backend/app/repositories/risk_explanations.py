from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.risk_explanations import RiskExplanation

class RiskExplanationRepository:
    async def create_batch(
        self,
        db: AsyncSession,
        explanations: List[RiskExplanation]
    ) -> List[RiskExplanation]:
        """
        Persists a batch of SHAP risk explanations for a prediction.
        """
        db.add_all(explanations)
        await db.flush()
        return explanations

    async def get_by_prediction_id(
        self,
        db: AsyncSession,
        prediction_id: UUID
    ) -> List[RiskExplanation]:
        """
        Retrieves the top SHAP explanation factors ordered by attribution rank (1 to 3).
        """
        stmt = (
            select(RiskExplanation)
            .where(RiskExplanation.prediction_id == prediction_id)
            .order_by(RiskExplanation.rank.asc())
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def delete_by_prediction_id(
        self,
        db: AsyncSession,
        prediction_id: UUID
    ) -> None:
        """
        Cleans existing explanations if re-evaluating a prediction.
        """
        stmt = delete(RiskExplanation).where(RiskExplanation.prediction_id == prediction_id)
        await db.execute(stmt)
        await db.flush()

risk_explanation_repository = RiskExplanationRepository()
