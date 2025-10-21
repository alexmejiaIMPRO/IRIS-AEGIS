"""
Users API endpoints (REST)
"""
from typing import List
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from auth.auth import get_current_user, require_admin, create_user, get_all_users, get_user_by_id, update_user, delete_user, activate_user, UserRole

router = APIRouter()


class UserCreate(BaseModel):
    username: str
    password: str
    role: str


class UserUpdate(BaseModel):
    username: str
    role: str
    password: str = None


@router.get("")
async def list_users(request: Request):
    """List all users (Admin only)"""
    try:
        require_admin(request)
    except:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = get_all_users()
    return {"users": users}


@router.post("")
async def create_user_endpoint(request: Request, data: UserCreate):
    """Create a new user (Admin only)"""
    try:
        require_admin(request)
    except:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        user = create_user(data.username, data.password, UserRole(data.role))
        return {"user": user, "message": "User created successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{user_id}")
async def update_user_endpoint(request: Request, user_id: str, data: UserUpdate):
    """Update a user (Admin only)"""
    try:
        require_admin(request)
    except:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        success = update_user(
            user_id,
            username=data.username,
            password=data.password if data.password else None,
            role=UserRole(data.role)
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{user_id}")
async def delete_user_endpoint(request: Request, user_id: str):
    """Delete a user (Admin only)"""
    try:
        require_admin(request)
    except:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    success = delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}


@router.post("/{user_id}/activate")
async def activate_user_endpoint(request: Request, user_id: str):
    """Activate a user (Admin only)"""
    try:
        require_admin(request)
    except:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    success = activate_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User activated successfully"}