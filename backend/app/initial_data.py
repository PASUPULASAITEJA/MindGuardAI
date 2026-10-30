"""
MindGuard Initial Data Seeder (app.initial_data)
Creates initial demo accounts for Student, Counselor, and Admin roles
so that demo buttons in the UI and test suites function immediately.
"""

import asyncio
import logging
from uuid import uuid4
from sqlalchemy import select

from app.db.session import AsyncSessionLocal, async_engine, Base
from app.models.users import User, UserRole
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("initial_data")

DEFAULT_USERS = [
    # Demo accounts used by frontend Login.tsx demo buttons
    {
        "email": "student1@mindguard.edu",
        "password": "Student@123",
        "role": UserRole.STUDENT,
        "full_name": "Student Demo User",
    },
    {
        "email": "counselor1@mindguard.edu",
        "password": "Student@123",
        "role": UserRole.COUNSELOR,
        "full_name": "Dr. Counselor Demo",
    },
    {
        "email": "admin@mindguard.edu",
        "password": "Student@123",
        "role": UserRole.ADMIN,
        "full_name": "Campus Administrator",
    },
    # Standard NMIMS institutional accounts
    {
        "email": "naresh.vurukonda@nmims.edu",
        "password": "password123",
        "role": UserRole.COUNSELOR,
        "full_name": "Dr. Naresh Vurukonda",
    },
    {
        "email": "raja.govindaacharyk@nmims.edu",
        "password": "password123",
        "role": UserRole.ADMIN,
        "full_name": "Prof. Raja Govinda Achary",
    },
]

async def init_db() -> None:
    # Ensure tables are created
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for u in DEFAULT_USERS:
            stmt = select(User).where(User.email == u["email"])
            res = await session.execute(stmt)
            existing = res.scalars().first()
            if not existing:
                new_user = User(
                    id=uuid4(),
                    email=u["email"],
                    password_hash=get_password_hash(u["password"]),
                    role=u["role"],
                    full_name=u["full_name"],
                    is_active=True,
                )
                session.add(new_user)
                logger.info(f"Created initial user: {u['email']} [{u['role'].value}]")
            else:
                # Update password hash just in case
                existing.password_hash = get_password_hash(u["password"])
                existing.is_active = True
                logger.info(f"User already exists, password synced: {u['email']}")

        await session.commit()
    logger.info("Database initialized successfully with default users.")

def main() -> None:
    logger.info("Initializing database with initial data...")
    asyncio.run(init_db())
    logger.info("Initial data creation completed!")

if __name__ == "__main__":
    main()
