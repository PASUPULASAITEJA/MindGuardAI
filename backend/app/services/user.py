from math import ceil
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.users import User, UserRole
from app.repositories.users import user_repository
from app.schemas.users import UserCreate, UserUpdate
from app.core.security import get_password_hash
from fastapi import HTTPException, status

class UserService:
    async def get_user_by_id(self, db: AsyncSession, user_id: UUID) -> Optional[User]:
        """
        Fetch a user by their unique UUID.
        """
        return await user_repository.get(db, user_id)

    async def get_user_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """
        Fetch a user by their email address.
        """
        return await user_repository.get_by_email(db, email)

    async def register_user(self, db: AsyncSession, user_in: UserCreate) -> User:
        """
        Register a new user in the database. Validates against institutional roster,
        hashes the password and checks for email conflicts.
        """
        from app.core.whitelist import get_authorized_role

        normalized_email = user_in.email.lower().strip()

        # 1. Validate that the email is authorized under NMIMS domains
        whitelisted_role = get_authorized_role(normalized_email, requested_role=user_in.role)
        if not whitelisted_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "NOT_ON_ROSTER",
                    "message": "Only institutional emails ending with @nmims.in, @nmims.edu.in, or @nmims.edu are authorized to register.",
                    "details": {"email": user_in.email}
                }
            )

        # 2. Validate that the email does not already exist
        existing_user = await user_repository.get_by_email(db, normalized_email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error_code": "CONFLICT",
                    "message": "An account with this email address already exists. Please sign in instead.",
                    "details": {}
                }
            )

        # 3. Hash password and create database object with official roster role
        hashed_password = get_password_hash(user_in.password)
        
        db_obj_data = {
            "email": normalized_email,
            "role": whitelisted_role,  # Enforce officially assigned roster role
            "password_hash": hashed_password,
            "is_active": True
        }
        
        return await user_repository.create(db, obj_in=db_obj_data)

    async def get_users_directory(
        self,
        db: AsyncSession,
        *,
        role: Optional[UserRole] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Tuple[List[User], int]:
        """
        Retrieve a paginated list of users and calculate total pages.
        """
        # 1. Base query for users
        query = select(User)
        count_query = select(func.count(User.id))
        
        if role:
            query = query.where(User.role == role)
            count_query = count_query.where(User.role == role)

        # 2. Execute count
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        # 3. Paginate and execute query
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        result = await db.execute(query)
        users = list(result.scalars().all())

        # 4. Calculate total pages
        total_pages = ceil(total_count / page_size) if total_count > 0 else 1

        return users, total_pages

user_service = UserService()
