from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, model_validator
from app.models.users import UserRole

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    role: UserRole = Field(..., description="Role of the user (STUDENT, COUNSELOR, ADMIN)")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Cleartext password (min 8 characters)")

    @model_validator(mode="after")
    def validate_institutional_email(self):
        from app.core.whitelist import is_valid_institutional_domain
        email_str = str(self.email).lower().strip()
        if not is_valid_institutional_domain(email_str):
            raise ValueError("Registration is restricted to authorized institutional email domains: @nmims.in, @nmims.edu.in, or @nmims.edu.")
        return self

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8)

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Schema specific to registration API response
class UserRegisterResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True

# Schema for profile endpoint response
class UserProfileResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: UserRole
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    academic_department: Optional[str] = None
    consent_counselor_sharing: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=50)
    emergency_contact_name: Optional[str] = Field(None, max_length=255)
    emergency_contact_phone: Optional[str] = Field(None, max_length=50)
    academic_department: Optional[str] = Field(None, max_length=100)
    consent_counselor_sharing: Optional[bool] = None

class UserListResponse(BaseModel):
    items: list[UserResponse]
    total_pages: int
    current_page: int

class AdminUserResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True

class UserDirectoryResponse(BaseModel):
    users: list[AdminUserResponse]
    page: int
    total_pages: int
