import json
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional, Any, Dict
from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, ForeignKey, Index, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.users import User

class AuditLog(Base):
    """
    Append-only security and compliance audit trail tracking all clinical data
    access, privilege delegations, consent shifts, and crisis escalations.
    """
    __tablename__ = "audit_logs"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        index=True,
        comment="Unique identifier for audit event entry (v4)."
    )
    actor_user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="User initiating the action (null for automated background system tasks)."
    )
    actor_role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="SYSTEM",
        comment="Role of the actor at execution time (STUDENT, COUNSELOR, ADMIN, SYSTEM)."
    )
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="Normalized action identifier (e.g., VIEW_STUDENT_CASEFILE, GRANT_CONSENT)."
    )
    target_user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Subject student whose clinical records were accessed or altered."
    )
    target_resource_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Classification of the touched resource (CASEFILE, ALERT, CONSENT, NOTE, SOS)."
    )
    target_resource_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Entity identifier of the touched resource."
    )
    request_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Distributed correlation request ID."
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Client network IP address."
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Client HTTP User-Agent string."
    )
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Contextual metadata payload (search filters, status transitions, etc.)."
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
        comment="Immutable audit event timestamp."
    )

    # Relationships
    actor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[actor_user_id])
    target_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[target_user_id])

    __table_args__ = (
        Index("idx_audit_logs_action_created", "action", "created_at"),
        Index("idx_audit_logs_target_created", "target_user_id", "created_at"),
    )
