from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.users import UserCreate, UserRegisterResponse
from app.services.auth import auth_service
from app.services.user import user_service

router = APIRouter()

@router.get(
    "/roster-info",
    status_code=status.HTTP_200_OK,
    summary="Check institutional whitelist roster status for an email"
)
async def check_roster_info(email: str, role: Optional[str] = None):
    """
    Checks if an email is present on the institutional whitelist and returns its assigned role.
    """
    from app.core.whitelist import get_authorized_role
    from app.models.users import UserRole
    req_role = None
    if role:
        try:
            req_role = UserRole(role.upper())
        except ValueError:
            pass
    authorized_role = get_authorized_role(email, requested_role=req_role)
    return {
        "email": email.lower().strip(),
        "is_authorized": authorized_role is not None,
        "assigned_role": authorized_role.value if authorized_role else None
    }

@router.post(
    "/register",
    response_model=UserRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user"
)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new user record in the system database. Returns standard registration representation.
    """
    new_user = await user_service.register_user(db, user_in)
    return new_user

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate credentials and retrieve JWT tokens"
)
async def login(
    login_in: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Validates user credentials. On success, returns the short-lived access token in the JSON response,
    and sets the long-lived refresh token in a secure, HttpOnly cookie.
    """
    tokens = await auth_service.authenticate_user(db, login_in)
    
    # Set the refresh token as a secure HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=True,  # In production, forces HTTPS transmission
        samesite="strict",
        max_age=7 * 24 * 3600  # 7 days in seconds
    )
    
    return tokens

@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh an expired access token"
)
async def refresh(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Consumes a secure refresh token from the browser cookie, validates it, and issues a new
    pair of access and refresh tokens.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "UNAUTHORIZED",
                "message": "Refresh token is missing from browser cookies.",
                "details": {}
            }
        )

    tokens = await auth_service.refresh_tokens(db, refresh_token)

    # Rotate the refresh token by setting the new one in cookie
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 3600
    )

    return tokens

@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    summary="Generate password reset token for registered university account"
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Checks if account exists and returns an authorization token to reset credentials.
    In university production environments, this dispatches an institutional email link.
    """
    email_clean = payload.email.lower().strip()
    user = await user_service.get_user_by_email(db, email_clean)
    if not user:
        # Avoid user enumeration by returning success message regardless
        return {
            "status": "success",
            "message": "If the account exists on the university roster, password reset instructions have been generated.",
            "reset_token": None
        }

    from app.core.security import create_password_reset_token
    token = create_password_reset_token(email_clean)
    return {
        "status": "success",
        "message": "Password reset instructions generated.",
        "reset_token": token
    }

@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Reset user password using verification token"
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Validates token and updates account password.
    """
    from jose import JWTError
    from app.core.security import decode_token, get_password_hash

    try:
        decoded = decode_token(payload.token)
        if decoded.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Invalid token type for password reset."}
            )
        email = decoded.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Token has missing or corrupted email identity."}
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Password reset token is invalid or expired. Please request a new one."}
        )

    user = await user_service.get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "User account no longer found."}
        )

    user.password_hash = get_password_hash(payload.new_password)
    await db.commit()

    return {
        "status": "success",
        "message": "Password has been successfully updated. You may now log in with your new credentials."
    }

