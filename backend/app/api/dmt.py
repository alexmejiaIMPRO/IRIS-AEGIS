"""
DMT API endpoints (REST)
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, status, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from database import get_db
from auth.auth import get_current_user
from services import ExportService
import uuid
import io

router = APIRouter()


class DMTRecordBase(BaseModel):
    # Campos base
    work_center: Optional[str] = None
    part_num: Optional[str] = None
    operation: Optional[str] = None
    employee_name: Optional[str] = None
    qty: Optional[str] = None
    customer: Optional[str] = None
    shop_order: Optional[str] = None
    serial_number: Optional[str] = None
    inspection_item: Optional[str] = None
    date: Optional[str] = None
    prepared_by: Optional[str] = None
    description: Optional[str] = None
    car_type: Optional[str] = None
    car_cycle: Optional[str] = None
    car_second_cycle_date: Optional[str] = None
    process_description: Optional[str] = None
    analysis: Optional[str] = None
    analysis_by: Optional[str] = None
    
    # Campos que se hicieron requeridos/obligatorios
    disposition: str
    disposition_date: str
    engineer: str
    failure_code: str
    rework_hours: float
    responsible_dept: str
    material_scrap_cost: float
    others_cost: float
    engineering_remarks: str
    repair_process: str
    
    # Campos nuevos para el formulario
    title: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    department: Optional[str] = None
    raisedBy: Optional[str] = None
    assignedTo: Optional[str] = None
    rootCause: Optional[str] = None
    correctiveAction: Optional[str] = None
    preventiveAction: Optional[str] = None
    targetDate: Optional[str] = None


class DMTRecordCreate(DMTRecordBase):
    pass


class DMTRecordUpdate(DMTRecordBase):
    pass


@router.get("")
async def list_dmt_records(request: Request, search: str = ""):
    """List all DMT records"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_db()
    conn = db.get_connection()
    c = conn.cursor()
    
    query = "SELECT * FROM dmt_records WHERE is_active = 1"
    params = []
    
    if search:
        query += " AND (description LIKE ? OR part_num LIKE ?)"
        search_param = f"%{search}%"
        params.extend([search_param, search_param])
        
    query += " ORDER BY created_at DESC"
    
    c.execute(query, params)
    records = [dict(row) for row in c.fetchall()]
    conn.close()
    
    return {"items": records, "total": len(records)}


@router.get("/{dmt_id}")
async def get_dmt_record(request: Request, dmt_id: str):
    """Get a single DMT record by ID"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_db()
    conn = db.get_connection()
    c = conn.cursor()
    
    c.execute("SELECT * FROM dmt_records WHERE id = ? AND is_active = 1", (dmt_id,))
    record = c.fetchone()
    conn.close()
    
    if not record:
        raise HTTPException(status_code=404, detail="DMT record not found")
        
    return dict(record)


@router.post("")
async def create_dmt_record(request: Request, data: DMTRecordCreate):
    """Create a new DMT record (FIXED: Robust DB INSERT logic)"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_db()
    conn = db.get_connection()
    c = conn.cursor()
    
    new_id = str(uuid.uuid4())
    
    # Obtener todos los campos del modelo Pydantic
    fields = data.model_dump()
    
    # 1. Obtener los nombres de campo del modelo (en un orden predecible)
    model_field_names = list(data.model_fields.keys()) 
    
    # 2. Definir TODAS las columnas a insertar (incluyendo las de control)
    keys = ["id", "status"] + model_field_names
    
    # 3. Definir TODOS los valores correspondientes
    values = [new_id, "open"] + [fields.get(key) for key in model_field_names]
    
    # Construir la sentencia SQL de forma segura
    placeholders = ", ".join(["?"] * len(keys))
    column_names = ", ".join(keys)

    try:
        # Ejecutar la sentencia INSERT
        c.execute(
            f"INSERT INTO dmt_records ({column_names}) VALUES ({placeholders})",
            values
        )
        
        # Insertar registro de auditoría
        c.execute(
            "INSERT INTO audit_log (entity_type, entity_id, action, user_id) VALUES (?, ?, ?, ?)",
            ("dmt_records", new_id, "CREATE", user["id"])
        )
        
        # CRÍTICO: Confirmar los cambios en la base de datos
        conn.commit()
        
        # Recuperar el nuevo registro para la respuesta
        c.execute("SELECT * FROM dmt_records WHERE id = ?", (new_id,))
        record = dict(c.fetchone())
        conn.close()
        
        return {"item": record, "message": "DMT record created successfully"}

    except Exception as e:
        # Si la inserción falla por cualquier motivo, deshacer y reportar error
        print(f"FATAL DB ERROR during DMT creation: {e}")
        conn.rollback() # Deshacer si hubo un fallo
        conn.close()
        raise HTTPException(
            status_code=500, 
            detail=f"Database error: Could not create DMT record. {e}"
        )


@router.put("/{dmt_id}")
async def update_dmt_record(request: Request, dmt_id: str, data: DMTRecordUpdate):
    """Update an existing DMT record"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_db()
    conn = db.get_connection()
    c = conn.cursor()

    # Build the UPDATE query dynamically
    fields = data.model_dump(exclude_unset=True)
    set_clauses = [f"{k} = ?" for k in fields.keys()]
    set_values = list(fields.values())

    if not set_clauses:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    set_clauses_str = ", ".join(set_clauses)
    
    c.execute(
        f"UPDATE dmt_records SET {set_clauses_str}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = 1",
        set_values + [dmt_id]
    )
    
    if c.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="DMT record not found or not active")

    c.execute(
        "INSERT INTO audit_log (entity_type, entity_id, action, user_id) VALUES (?, ?, ?, ?)",
        ("dmt_records", dmt_id, "UPDATE", user["id"])
    )
    
    conn.commit()
    
    # Retrieve the updated record for the response
    c.execute("SELECT * FROM dmt_records WHERE id = ?", (dmt_id,))
    record = dict(c.fetchone())
    conn.close()
    
    return {"item": record, "message": "DMT record updated successfully"}


@router.delete("/{dmt_id}")
async def delete_dmt_record(request: Request, dmt_id: str):
    """Delete a DMT record (soft delete)"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user["role"] not in ["Admin", "Quality Manager"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    db = get_db()
    conn = db.get_connection()
    c = conn.cursor()
    
    c.execute(
        "UPDATE dmt_records SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = 1",
        (dmt_id,)
    )
    
    if c.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="DMT record not found or already deleted")

    c.execute(
        "INSERT INTO audit_log (entity_type, entity_id, action, user_id) VALUES (?, ?, ?, ?)",
        ("dmt_records", dmt_id, "DELETE", user["id"])
    )
    
    conn.commit()
    conn.close()
    
    return {"message": "DMT record deleted successfully"}


@router.get("/export/{format}")
async def export_dmt_records(request: Request, format: str, days: Optional[int] = None):
    """Export DMT records in JSON or CSV format"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Only Admin and Quality Manager can export records
    if user["role"] not in ["Admin", "Quality Manager"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    db = get_db()
    conn = db.get_connection()
    c = conn.cursor()

    query = "SELECT * FROM dmt_records WHERE is_active = 1"
    params = []
    
    if days is not None and days > 0:
        # Assuming you use SQLite or a database that supports date comparisons
        query += f" AND created_at >= date('now', '-{days} days')"
    
    c.execute(query, params)
    records = [dict(row) for row in c.fetchall()]
    conn.close()
    
    if not records:
        raise HTTPException(status_code=404, detail="No records found to export")

    if format == "csv":
        csv_buffer = ExportService.export_csv(records, "dmt_records")
        return StreamingResponse(
            io.BytesIO(csv_buffer.encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=dmt_records.csv"}
        )
    elif format == "json":
        json_data = ExportService.export_json(records, "dmt_records")
        return json_data
    else:
        raise HTTPException(status_code=400, detail="Invalid export format. Use 'csv' or 'json'.")


@router.post("/{dmt_id}/close")
async def close_dmt(request: Request, dmt_id: str):
    """Close an open DMT record"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user["role"] not in ["Admin", "Quality Manager"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    db = get_db()
    conn = db.get_connection()
    c = conn.cursor()
    
    c.execute(
        "UPDATE dmt_records SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = 1",
        (dmt_id,)
    )
    
    if c.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="DMT record not found or already closed")

    c.execute(
        "INSERT INTO audit_log (entity_type, entity_id, action, user_id) VALUES (?, ?, ?, ?)",
        ("dmt_records", dmt_id, "CLOSE", user["id"])
    )
    
    conn.commit()
    conn.close()
    
    return {"message": "DMT record closed successfully"}


@router.post("/{dmt_id}/reopen")
async def reopen_dmt(request: Request, dmt_id: str):
    """Reopen a closed DMT record"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user["role"] not in ["Admin", "Inspector"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    db = get_db()
    conn = db.get_connection()
    c = conn.cursor()
    
    c.execute(
        "UPDATE dmt_records SET status = 'open', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = 1",
        (dmt_id,)
    )
    
    if c.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="DMT record not found or already open")

    c.execute(
        "INSERT INTO audit_log (entity_type, entity_id, action, user_id) VALUES (?, ?, ?, ?)",
        ("dmt_records", dmt_id, "REOPEN", user["id"])
    )
    
    conn.commit()
    conn.close()
    
    return {"message": "DMT record reopened successfully"}

# /app/api/dmt.py

# ... (código previo)

@router.post("")
async def create_dmt_record(request: Request, data: DMTRecordCreate):
    """Create a new DMT record (FIXED: Robust DB INSERT logic)"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_db()
    conn = db.get_connection()
    c = conn.cursor()
    
    new_id = str(uuid.uuid4())
    
    # Lista de TODAS las columnas a insertar
    columns = [
        "id", "user_id", "status", "created_at", "updated_at", "is_active",
        "work_center", "part_num", "operation", "employee_name", "qty",
        "customer", "shop_order", "serial_number", "inspection_item", "date",
        "prepared_by", "description", "car_type", "car_cycle", "car_second_cycle_date",
        "process_description", "analysis", "analysis_by", 
        "disposition", "disposition_date", "engineer", "failure_code", 
        "rework_hours", "responsible_dept", "material_scrap_cost", "others_cost", 
        "engineering_remarks", "repair_process", 
        # <-- LOS NUEVOS CAMPOS DEBEN ESTAR AQUÍ
        "title", "category", "severity", "department", "raisedBy", 
        "assignedTo", "rootCause", "correctiveAction", "preventiveAction", "targetDate"
    ]

    # Lista de valores
    values = [
        new_id, user["id"], "open", datetime.now(), datetime.now(), 1,
        data.work_center, data.part_num, data.operation, data.employee_name, data.qty,
        data.customer, data.shop_order, data.serial_number, data.inspection_item, data.date,
        data.prepared_by, data.description, data.car_type, data.car_cycle, data.car_second_cycle_date,
        data.process_description, data.analysis, data.analysis_by,
        data.disposition, data.disposition_date, data.engineer, data.failure_code, 
        data.rework_hours, data.responsible_dept, data.material_scrap_cost, data.others_cost, 
        data.engineering_remarks, data.repair_process, 
        # <-- LOS VALORES DE LOS NUEVOS CAMPOS DEBEN ESTAR AQUÍ
        data.title, data.category, data.severity, data.department, data.raisedBy, 
        data.assignedTo, data.rootCause, data.correctiveAction, data.preventiveAction, data.targetDate
    ]
    
    # Crear la declaración SQL
    placeholders = ", ".join(["?"] * len(columns))
    column_names = ", ".join(columns)
    
    try:
        c.execute(f"INSERT INTO dmt_records ({column_names}) VALUES ({placeholders})", values)
        
        # Log de auditoría
        c.execute(
            "INSERT INTO audit_log (entity_type, entity_id, action, user_id) VALUES (?, ?, ?, ?)",
            ("dmt_records", new_id, "CREATE", user["id"])
        )
        
        conn.commit()
        
        # Devolver el registro creado
        c.execute("SELECT * FROM dmt_records WHERE id = ?", (new_id,))
        new_record = c.fetchone()
        
    except Exception as e:
        conn.rollback()
        # Mejorar el manejo de errores para reportar el problema de la base de datos
        print(f"FATAL DB ERROR during DMT creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: Could not create DMT record. {e}"
        )
    finally:
        conn.close()

    return {"id": new_id, "message": "DMT record created successfully", "record": dict(new_record)}