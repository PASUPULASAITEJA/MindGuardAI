from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.users import User
from app.schemas.users import UserCreate, UserUpdate
from app.repositories.base import CRUDBase

class UserRepository(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """
        Retrieve a user record from the database by email address or username prefix (case-insensitive).
        """
        clean = email.lower().strip() if email else ""
        if not clean:
            return None

        if "@" in clean:
            statement = select(self.model).where(func.lower(self.model.email) == clean)
        else:
            # Match email exactly, or email prefix before '@' (e.g. 'student' matches 'student@nmims.in')
            statement = select(self.model).where(
                (func.lower(self.model.email) == clean) |
                func.lower(self.model.email).startswith(clean + "@")
            )
        result = await db.execute(statement)
        return result.scalars().first()

user_repository = UserRepository(User)
