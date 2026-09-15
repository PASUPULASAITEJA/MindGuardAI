from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from sqlalchemy.orm import aliased

from app.models.audit_logs import AuditLog
from app.models.users import User
from app.schemas.audit import AuditLogResponse

class AuditService:
    async def log_event(
        self,
        db: AsyncSession,
        action: str,
        target_resource_type: str,
        actor_user_id: Optional[UUID] = None,
        actor_role: str = "SYSTEM",
        target_user_id: Optional[UUID] = None,
        target_resource_id: Optional[str] = None,
        request_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        audit_entry = AuditLog(
            id=uuid4(),
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            action=action,
            target_user_id=target_user_id,
            target_resource_type=target_resource_type,
            target_resource_id=target_resource_id,
            request_id=request_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_json=metadata,
            created_at=datetime.now(timezone.utc)
        )
        db.add(audit_entry)
        await db.commit()
        await db.refresh(audit_entry)
        return audit_entry

    async def get_audit_logs(
        self,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 50,
        action: Optional[str] = None,
        actor_role: Optional[str] = None,
        target_user_id: Optional[UUID] = None
    ) -> Tuple[List[AuditLogResponse], int]:
        ActorUser = aliased(User)
        TargetUser = aliased(User)

        query = (
            select(
                AuditLog,
                ActorUser.full_name.label("actor_name"),
                ActorUser.email.label("actor_email"),
                TargetUser.full_name.label("target_name"),
                TargetUser.email.label("target_email")
            )
            .outerjoin(ActorUser, AuditLog.actor_user_id == ActorUser.id)
            .outerjoin(TargetUser, AuditLog.target_user_id == TargetUser.id)
        )

        count_query = select(func.count(AuditLog.id))

        if action:
            query = query.where(AuditLog.action == action)
            count_query = count_query.where(AuditLog.action == action)
        if actor_role:
            query = query.where(AuditLog.actor_role == actor_role)
            count_query = count_query.where(AuditLog.actor_role == actor_role)
        if target_user_id:
            query = query.where(AuditLog.target_user_id == target_user_id)
            count_query = count_query.where(AuditLog.target_user_id == target_user_id)

        # Count total
        count_res = await db.execute(count_query)
        total = count_res.scalar() or 0

        # Paginate
        offset = (page - 1) * page_size
        query = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(page_size)
        results = await db.execute(query)

        logs_list: List[AuditLogResponse] = []
        for log_obj, a_name, a_email, t_name, t_email in results.all():
            logs_list.append(AuditLogResponse(
                id=log_obj.id,
                actor_user_id=log_obj.actor_user_id,
                actor_name=a_name or a_email or ("System Worker" if not log_obj.actor_user_id else None),
                actor_role=log_obj.actor_role,
                action=log_obj.action,
                target_user_id=log_obj.target_user_id,
                target_user_name=t_name or t_email,
                target_resource_type=log_obj.target_resource_type,
                target_resource_id=log_obj.target_resource_id,
                request_id=log_obj.request_id,
                ip_address=log_obj.ip_address,
                user_agent=log_obj.user_agent,
                metadata_json=log_obj.metadata_json,
                created_at=log_obj.created_at
            ))

        return logs_list, total

audit_service = AuditService()
