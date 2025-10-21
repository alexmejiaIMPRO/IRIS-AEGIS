# main.py
from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware
from app.api.__init__ import api_router
# Asumo que tiene una llave secreta para las sesiones
from config import Config 

# Inicialización de la aplicación
app = FastAPI(title="Quality Management System API")

# ===============================================
# 🔑 CORRECCIÓN CRÍTICA: Middleware de Sesión
# Esto permite que la solicitud use request.session (usado en auth.py)
# ===============================================
# CRÍTICO: Debe usar una llave secreta fuerte aquí.
app.add_middleware(SessionMiddleware, secret_key=Config.SECRET_KEY)

# ===============================================
# 🌐 CORRECCIÓN CRÍTICA: CORS Middleware
# Esto permite el intercambio de cookies/credenciales entre dominios
# (por ejemplo, frontend en :3000 y backend en :8000)
# ===============================================
origins = [
    "http://localhost:3001", # URL de su frontend Next.js
    # Agregue aquí el dominio de su aplicación en producción (e.g., https://qms.midominio.com)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # CRÍTICO: Debe ser True para que las cookies de sesión se envíen
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir el router de la API
app.include_router(api_router, prefix="/api")

# Endpoint de prueba
@app.get("/")
def read_root():
    return {"status": "API is running and session/CORS configured"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )