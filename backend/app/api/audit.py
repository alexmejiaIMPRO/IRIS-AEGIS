"""
Audit API endpoints (REST)
"""
from fastapi import APIRouter, HTTPException, Request
from database import get_db
from auth.auth import get_current_user

router = APIRouter()


@router.get("")
async def list_audit_logs(request: Request, limit: int = 100):
    """List audit logs"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_db()
    conn = db.get_connection()
    c = conn.cursor()
    
    c.execute("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?", (limit,))
    logs = [dict(row) for row in c.fetchall()]
    conn.close()
    
    return {"logs": logs}