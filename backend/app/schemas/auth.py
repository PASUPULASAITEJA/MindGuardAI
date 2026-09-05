from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User's registered email address")
    password: str = Field(..., description="User's login password")

class TokenResponse(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="Cryptographic refresh token")
    token_type: str = Field("bearer", description="Token type prefix (usually bearer)")
    expires_in: int = Field(900, description="Expiration time of the access token in seconds (15 minutes = 900s)")

class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email to request password reset for")

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description="Password reset verification token")
    new_password: str = Field(..., min_length=8, description="New password with minimum 8 characters")

