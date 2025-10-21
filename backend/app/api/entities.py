"""
Entities API endpoints (REST)
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from config import EntityType
from repositories import Repository
from services import ExportService
from auth.auth import get_current_user

router = APIRouter()


class EntityCreate(BaseModel):
    name: str
    employee_number: Optional[str] = None


@router.get("/{entity}")
async def list_entities(request: Request, entity: str, search: str = ""):
    """List all entities of a given type"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        entity_type = EntityType(entity)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entity type")
    
    repo = Repository(entity_type)
    # CORREGIDO: Esto ahora lista correctamente las entidades para una solicitud GET
    items, total = repo.get_all(page=1, search=search if search else None) 
    
    return {"items": items, "total": total}


@router.get("/{entity}/export/{format}")
async def export_entities(request: Request, entity: str, format: str, days: Optional[int] = None):
    """Export entities in JSON or CSV format"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        entity_type = EntityType(entity)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entity type")
    
    repo = Repository(entity_type)
    
    # Get all items
    total_items = []
    page = 1
    while True:
        page_items, total = repo.get_all(days=days, page=page)
        if not page_items:
            break
        total_items.extend(page_items)
        # Nota: Se agregó un chequeo para evitar un loop infinito si el total es mal calculado o muy grande
        if len(total_items) >= total: 
            break
        page += 1

    if format == "csv":
        return ExportService.export_csv(total_items, entity)
    else:
        return ExportService.export_json(total_items, entity)


@router.post("/{entity}")
async def create_entity(request: Request, entity: str, data: EntityCreate):
    """Create a new entity"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        entity_type = EntityType(entity)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entity type")
    
    repo = Repository(entity_type)
    
    if entity == "employees" and data.employee_number:
        item = repo.create(data.name.strip(), employee_number=data.employee_number.strip())
    else:
        item = repo.create(data.name.strip())
    
    return {"item": item, "message": "Entity created successfully"}


@router.put("/{entity}/{item_id}")
async def update_entity(request: Request, entity: str, item_id: str, data: EntityCreate):
    """Update an existing entity"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        entity_type = EntityType(entity)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entity type")
    
    repo = Repository(entity_type)
    
    if entity == "employees" and data.employee_number is not None:
        item = repo.update(item_id, data.name.strip(), employee_number=data.employee_number.strip())
    else:
        item = repo.update(item_id, data.name.strip())
    
    if not item:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    return {"item": item, "message": "Entity updated successfully"}


@router.delete("/{entity}/{item_id}")
async def delete_entity(request: Request, entity: str, item_id: str):
    """Delete an entity"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Se corrigió el SyntaxError
        entity_type = EntityType(entity)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entity type")
    
    repo = Repository(entity_type)
    success = repo.delete(item_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    return {"message": "Entity deleted successfully"}