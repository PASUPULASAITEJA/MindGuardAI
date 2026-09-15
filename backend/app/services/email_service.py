import asyncio
import logging
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.core.config import settings
from app.models.notification_deliveries import NotificationDelivery
from app.models.users import User, UserRole
from app.services.audit_service import audit_service

logger = logging.getLogger("mindguard.notifications")

class EmailNotificationService:
    """
    Production-ready asynchronous email delivery and alerting service.
    Dispatches critical intervention emails to clinical counselors upon
    HIGH risk assessments, emergency SOS distress signals, and crisis flags.
    """

    def _send_smtp_sync(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        plain_body: str
    ) -> None:
        """
        Synchronous SMTP worker invoked via asyncio.to_thread.
        """
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        part1 = MIMEText(plain_body, "plain", "utf-8")
        part2 = MIMEText(html_body, "html", "utf-8")
        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        try:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
        finally:
            try:
                server.quit()
            except Exception:
                pass

    async def send_email_notification(
        self,
        db: AsyncSession,
        *,
        event_type: str,
        recipient_email: str,
        subject: str,
        body_text: str,
        html_body: Optional[str] = None,
        recipient_user_id: Optional[UUID] = None
    ) -> NotificationDelivery:
        """
        Dispatches an email notification and commits an immutable delivery record.
        If SMTP_ENABLED is False or in test mode, simulates delivery cleanly.
        """
        delivery_id = uuid4()
        now = datetime.now(timezone.utc)
        delivery_status = "SENT"
        error_msg: Optional[str] = None
        sent_timestamp: Optional[datetime] = now

        if settings.SMTP_ENABLED and settings.SMTP_HOST:
            try:
                html_content = html_body or f"<pre>{body_text}</pre>"
                await asyncio.to_thread(
                    self._send_smtp_sync,
                    to_email=recipient_email,
                    subject=subject,
                    html_body=html_content,
                    plain_body=body_text
                )
                logger.info(f"Successfully delivered SMTP email to {recipient_email} for event {event_type}")
            except Exception as e:
                logger.error(f"SMTP delivery failed to {recipient_email}: {str(e)}", exc_info=True)
                delivery_status = "FAILED"
                error_msg = str(e)
                sent_timestamp = None
        else:
            logger.info(
                f"[SIMULATED SMTP] Email to {recipient_email} | Subject: '{subject}' | Event: {event_type}"
            )

        # Truncate preview for database log
        preview = (body_text[:280] + "...") if len(body_text) > 280 else body_text

        record = NotificationDelivery(
            id=delivery_id,
            event_type=event_type,
            recipient_user_id=recipient_user_id,
            recipient_email=recipient_email,
            channel="EMAIL",
            status=delivery_status,
            subject=subject,
            body_preview=preview,
            error_message=error_msg,
            sent_at=sent_timestamp,
            created_at=now
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)

        return record

    async def notify_counselors_on_high_risk(
        self,
        db: AsyncSession,
        *,
        student: User,
        assessment_id: Optional[UUID] = None,
        alert_id: Optional[UUID] = None,
        event_type: str = "HIGH_RISK_ALERT",
        custom_message: Optional[str] = None
    ) -> List[NotificationDelivery]:
        """
        Broadcasts high-priority alert notification to all designated university counselors.
        """
        # 1. Fetch registered counselors
        counselor_stmt = select(User).where(
            User.role == UserRole.COUNSELOR,
            User.is_active == True
        )
        res = await db.execute(counselor_stmt)
        counselors = res.scalars().all()

        recipients: List[Dict[str, Any]] = []
        if counselors:
            for c in counselors:
                recipients.append({
                    "user_id": c.id,
                    "email": c.email,
                    "name": c.full_name or "Counselor"
                })
        else:
            for em in settings.DEFAULT_COUNSELOR_EMAILS:
                recipients.append({
                    "user_id": None,
                    "email": em,
                    "name": "Clinical Counselor Desk"
                })

        student_name = student.full_name or "Confidential Student"
        student_id_str = str(student.id)
        urgency = "CRITICAL EMERGENCY SOS" if event_type == "EMERGENCY_SOS" else "URGENT CLINICAL ALERT (HIGH RISK)"
        subject = f"[{urgency}] MindGuard Intervention Required: Student {student_name}"

        plain_body = f"""================================================================================
MINDGUARD AI CLINICAL EARLY WARNING NOTIFICATION
================================================================================

URGENCY LEVEL: {urgency}
TIMESTAMP: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")}

STUDENT INFORMATION:
- Name: {student_name}
- Email: {student.email}
- Student ID: {student_id_str}
- Academic Department: {getattr(student, 'academic_department', 'Not Specified')}

INCIDENT DETAILS:
{custom_message or "Student mental wellness score evaluated in HIGH RISK category. Immediate clinical review and follow-up recommended."}

CLINICAL CASE FILE & LONGITUDINAL TIMELINE:
Access the complete student case file and intervention tools at:
http://localhost:5173/counselor/students/{student_id_str}/casefile

================================================================================
MindGuard AI — Privacy-Preserving Student Mental Health Platform
"""

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }}
    .container {{ max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
    .header {{ background: #dc2626; padding: 24px; color: #ffffff; }}
    .header h2 {{ margin: 0 0 6px 0; font-size: 20px; font-weight: 800; }}
    .content {{ padding: 24px; }}
    .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; background: rgba(255,255,255,0.2); font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }}
    .card {{ background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #e2e8f0; }}
    .field {{ margin-bottom: 8px; font-size: 13px; }}
    .field strong {{ color: #475569; }}
    .button {{ display: inline-block; padding: 12px 24px; border-radius: 10px; background: #7c3aed; color: #ffffff; font-weight: bold; text-decoration: none; font-size: 13px; margin-top: 12px; }}
    .footer {{ padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">{urgency}</span>
      <h2>MindGuard Intervention Flag</h2>
      <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Automated Clinical Early Warning Notification</p>
    </div>
    <div class="content">
      <div class="card">
        <div class="field"><strong>Student:</strong> {student_name} ({student.email})</div>
        <div class="field"><strong>Student ID:</strong> <code style="font-size: 11px;">{student_id_str}</code></div>
        <div class="field"><strong>Department:</strong> {getattr(student, 'academic_department', 'General')}</div>
      </div>
      <p style="font-size: 13px; color: #334155;">
        {custom_message or "An assessment or safety event has flagged this student in the <strong>HIGH RISK</strong> category requiring clinical counselor review."}
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="http://localhost:5173/counselor/students/{student_id_str}/casefile" class="button" style="color: #ffffff;">
          Open Student Case File & Longitudinal Timeline →
        </a>
      </div>
    </div>
    <div class="footer">
      MindGuard AI • Institutional Wellness & Student Confidentiality Protected
    </div>
  </div>
</body>
</html>
"""

        deliveries: List[NotificationDelivery] = []
        for r in recipients:
            deliv = await self.send_email_notification(
                db,
                event_type=event_type,
                recipient_email=r["email"],
                subject=subject,
                body_text=plain_body,
                html_body=html_body,
                recipient_user_id=r["user_id"]
            )
            deliveries.append(deliv)

        # Audit log notification dispatch
        await audit_service.log_event(
            db,
            action="DISPATCH_NOTIFICATION",
            actor_user_id=student.id,
            actor_role=student.role.value if hasattr(student.role, "value") else str(student.role),
            target_user_id=student.id,
            target_resource_type="NOTIFICATION",
            target_resource_id=str(alert_id) if alert_id else str(assessment_id),
            metadata={
                "event_type": event_type,
                "recipients_count": len(recipients),
                "recipient_emails": [r["email"] for r in recipients]
            }
        )

        return deliveries

    async def get_deliveries_log(
        self,
        db: AsyncSession,
        *,
        page: int = 1,
        page_size: int = 50,
        event_type: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[List[NotificationDelivery], int]:
        """
        Retrieves paginated history of notification deliveries for administrative inspection.
        """
        query = select(NotificationDelivery)
        count_q = select(func.count(NotificationDelivery.id))

        if event_type:
            query = query.where(NotificationDelivery.event_type == event_type)
            count_q = count_q.where(NotificationDelivery.event_type == event_type)
        if status:
            query = query.where(NotificationDelivery.status == status)
            count_q = count_q.where(NotificationDelivery.status == status)

        count_res = await db.execute(count_q)
        total = count_res.scalar() or 0

        offset = (page - 1) * page_size
        query = query.order_by(desc(NotificationDelivery.created_at)).offset(offset).limit(page_size)
        res = await db.execute(query)
        deliveries = list(res.scalars().all())

        return deliveries, total

email_service = EmailNotificationService()
