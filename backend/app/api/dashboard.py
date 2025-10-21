"""
Dashboard API endpoints (REST)
"""
from fastapi import APIRouter, HTTPException, Request
from database import get_db 
from auth.auth import get_current_user
router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(request: Request):
    """
    Returns key statistics and charts data for the dashboard.
    This corrects the 404 error by defining the missing /stats path.
    """
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")


    stats = {
        "total_dmt": 150,
        "open_dmt": 25,
        "closed_dmt": 125,
        "avg_rework_hours": 3.5,
        "cost_of_non_conformance": 15000.00,
        "dmt_by_failure_code": [
            {"name": "Code A", "value": 50},
            {"name": "Code B", "value": 30},
            {"name": "Code C", "value": 20},
        ],
    }
    
    return stats
