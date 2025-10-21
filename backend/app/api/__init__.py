"""
API Router - Agrupa todos los endpoints REST
"""
from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.dmt import router as dmt_router
from app.api.entities import router as entities_router
from app.api.audit import router as audit_router
from app.api.dashboard import router as dashboard_router

api_router = APIRouter()

# Incluir todos los routers
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(dmt_router, prefix="/dmt", tags=["DMT"])
api_router.include_router(entities_router, prefix="/entities", tags=["Entities"])
api_router.include_router(audit_router, prefix="/audit", tags=["Audit"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])

__all__ = ["api_router"]