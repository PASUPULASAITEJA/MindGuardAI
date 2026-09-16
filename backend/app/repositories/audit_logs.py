from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from app.models.audit_logs import AuditLog
from app.repositories.base import BaseRepository

class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self):
        super().__init__(AuditLog)

    async def log_event(
        self,
        db: AsyncSession,
        audit_entry: AuditLog
    ) -> AuditLog:
        db.add(audit_entry)
        await db.commit()
        await db.refresh(audit_entry)
        return audit_entry

    async def query_filtered(
        self,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 50,
        action: Optional[str] = None,
        actor_role: Optional[str] = None,
        target_user_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        resource_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Tuple[List[AuditLog], int]:
        query = select(AuditLog)
        count_query = select(func.count(AuditLog.id))

        if action:
            query = query.where(AuditLog.action.ilike(f"%{action}%"))
            count_query = count_query.where(AuditLog.action.ilike(f"%{action}%"))
        if actor_role:
            query = query.where(AuditLog.actor_role == actor_role)
            count_query = count_query.where(AuditLog.actor_role == actor_role)
        if target_user_id:
            query = query.where(AuditLog.target_user_id == target_user_id)
            count_query = count_query.where(AuditLog.target_user_id == target_user_id)
        if user_id:
            user_condition = or_(AuditLog.actor_user_id == user_id, AuditLog.target_user_id == user_id)
            query = query.where(user_condition)
            count_query = count_query.where(user_condition)
        if resource_type:
            query = query.where(AuditLog.target_resource_type.ilike(f"%{resource_type}%"))
            count_query = count_query.where(AuditLog.target_resource_type.ilike(f"%{resource_type}%"))
        if start_date:
            query = query.where(AuditLog.created_at >= start_date)
            count_query = count_query.where(AuditLog.created_at >= start_date)
        if end_date:
            query = query.where(AuditLog.created_at <= end_date)
            count_query = count_query.where(AuditLog.created_at <= end_date)

        count_res = await db.execute(count_query)
        total = count_res.scalar() or 0

        offset = (page - 1) * page_size
        query = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(page_size)
        res = await db.execute(query)
        return list(res.scalars().all()), total

audit_log_repository = AuditLogRepository()
