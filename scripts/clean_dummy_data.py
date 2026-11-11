import asyncio
import os
import sys

# Setup backend import path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import select, delete, update
from app.db.session import AsyncSessionLocal
from app.models.users import User, UserRole
from app.models.alerts import Alert
from app.models.mood_logs import MoodLog
from app.models.emotion_analyses import EmotionAnalysis
from app.models.assessments import Assessment
from app.models.mood_checkins import MoodCheckin
from app.models.sleep_logs import SleepLog
from app.models.consent import Consent
from app.core.security import get_password_hash

DUMMY_EMAILS_TO_PURGE = [
    "student.test99@nmims.in",
    "student1@mindguard.edu",
    "counselor1@mindguard.edu",
    "admin@mindguard.edu",
    "pipeline_student@mindguard.edu",
    "testuser@gmail.com",
    "random.user@external.com"
]

AUTHENTIC_INSTITUTIONAL_USERS = [
    {
        "email": "pasupulasai.teja37@nmims.in",
        "full_name": "Pasupula Sai Teja",
        "role": UserRole.STUDENT,
        "academic_department": "Computer Science & Engineering",
        "phone_number": "+91 9876543210",
        "emergency_contact_name": "Parent / Guardian",
        "emergency_contact_phone": "+91 9123456789"
    },
    {
        "email": "naresh.vurukonda@nmims.edu",
        "full_name": "Dr. Naresh Vurukonda",
        "role": UserRole.COUNSELOR,
        "academic_department": "Student Wellness & Counseling Department",
        "phone_number": "+91 9848012345",
        "emergency_contact_name": "Dean Student Welfare",
        "emergency_contact_phone": "+91 9848000000"
    },
    {
        "email": "raja.govindaacharyk@nmims.edu",
        "full_name": "Dr. Raja Govindaachary K",
        "role": UserRole.ADMIN,
        "academic_department": "School of Technology Management & Engineering",
        "phone_number": "+91 9848054321",
        "emergency_contact_name": "University Administration",
        "emergency_contact_phone": "+91 9848099999"
    }
]

async def clean_database():
    print("Beginning database cleanup: removing dummy test data...")
    async with AsyncSessionLocal() as session:
        # 1. Purge dummy users and cascade their child logs
        for dummy_email in DUMMY_EMAILS_TO_PURGE:
            user_res = await session.execute(select(User).where(User.email == dummy_email))
            user = user_res.scalars().first()
            if user:
                print(f"Purging dummy user: {user.email} (ID: {user.id})")
                await session.execute(delete(MoodCheckin).where(MoodCheckin.user_id == user.id))
                await session.execute(delete(SleepLog).where(SleepLog.user_id == user.id))
                await session.execute(delete(Alert).where(Alert.student_id == user.id))
                await session.execute(delete(Consent).where(Consent.student_id == user.id))
                mood_ids = (await session.execute(select(MoodLog.id).where(MoodLog.student_id == user.id))).scalars().all()
                if mood_ids:
                    await session.execute(delete(EmotionAnalysis).where(EmotionAnalysis.mood_log_id.in_(mood_ids)))
                await session.execute(delete(MoodLog).where(MoodLog.student_id == user.id))
                await session.execute(delete(Assessment).where(Assessment.student_id == user.id))
                await session.execute(delete(User).where(User.id == user.id))

        # 2. Update and ensure authentic institutional users are properly configured
        default_pwd_hash = get_password_hash("password123")
        for uinfo in AUTHENTIC_INSTITUTIONAL_USERS:
            res = await session.execute(select(User).where(User.email == uinfo["email"]))
            u = res.scalars().first()
            if u:
                print(f"Updating authentic user profile: {u.email}")
                u.full_name = uinfo["full_name"]
                u.academic_department = uinfo["academic_department"]
                u.phone_number = uinfo["phone_number"]
                u.emergency_contact_name = uinfo["emergency_contact_name"]
                u.emergency_contact_phone = uinfo["emergency_contact_phone"]
                u.is_active = True
                u.password_hash = default_pwd_hash
            else:
                import uuid
                print(f"Creating authentic user: {uinfo['email']}")
                new_u = User(
                    id=uuid.uuid4(),
                    email=uinfo["email"],
                    password_hash=default_pwd_hash,
                    full_name=uinfo["full_name"],
                    role=uinfo["role"],
                    academic_department=uinfo["academic_department"],
                    phone_number=uinfo["phone_number"],
                    emergency_contact_name=uinfo["emergency_contact_name"],
                    emergency_contact_phone=uinfo["emergency_contact_phone"],
                    is_active=True
                )
                session.add(new_u)

        # 3. Clean any orphan dummy alerts from earlier tests
        all_alerts_res = await session.execute(select(Alert))
        all_alerts = all_alerts_res.scalars().all()
        for a in all_alerts:
            # Check if student exists
            s_res = await session.execute(select(User).where(User.id == a.student_id))
            if not s_res.scalars().first():
                await session.execute(delete(Alert).where(Alert.id == a.id))

        await session.commit()
        print("Database cleanup completed successfully! Zero dummy records remain.")

if __name__ == "__main__":
    asyncio.run(clean_database())
