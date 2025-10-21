"""
Authentication API endpoints (REST)
"""
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from auth.auth import authenticate_user, get_current_user

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    user: dict
    message: str


@router.post("/login", response_model=LoginResponse)
async def login(request: Request, credentials: LoginRequest):
    """Login endpoint - Returns user data"""
    user = authenticate_user(credentials.username, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Store user in session
    request.session["user"] = user
    
    return {
        "user": user,
        "message": "Login successful"
    }


@router.post("/logout")
async def logout(request: Request):
    """Logout endpoint"""
    request.session.clear()
    return {"message": "Logout successful"}


@router.get("/me")
async def get_current_user_endpoint(request: Request):
    """Get current authenticated user"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user