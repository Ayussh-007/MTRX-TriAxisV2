"""
MTRX-TriAxis | FastAPI Backend
Main application entry point with CORS, routers, and startup events.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from backend.student_model import init_database
from backend.paths import DATA_DIR

# ── Import routers ───────────────────────────────────────────
from api.routes.system import router as system_router
from api.routes.students import router as students_router
from api.routes.attendance import router as attendance_router
from api.routes.quiz import router as quiz_router
from api.routes.curriculum import router as curriculum_router
from api.routes.teacher import router as teacher_router
from api.routes.slides import router as slides_router
from api.routes.agent import router as agent_router
from api.routes.auth import router as auth_router
from api.routes.sharing import router as sharing_router
from api.routes.calendar import router as calendar_router

# ── App Instance ─────────────────────────────────────────────
app = FastAPI(
    title="MTRX-TriAxis API",
    description="AI-Powered Classroom Assistant — REST API",
    version="2.0.0",
)

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ──────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    """Initialize database on first run."""
    init_database()
    os.makedirs(DATA_DIR, exist_ok=True)

# ── Mount Routers ────────────────────────────────────────────
app.include_router(system_router,     prefix="/api/system",     tags=["System"])
app.include_router(students_router,   prefix="/api/students",   tags=["Students"])
app.include_router(attendance_router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(quiz_router,       prefix="/api/quiz",       tags=["Quiz"])
app.include_router(curriculum_router, prefix="/api/curriculum", tags=["Curriculum"])
app.include_router(teacher_router,    prefix="/api/teacher",    tags=["Teacher"])
app.include_router(slides_router,     prefix="/api/slides",     tags=["Slides"])
app.include_router(agent_router,      prefix="/api/agent",      tags=["Agent"])
app.include_router(auth_router,       prefix="/api/auth",       tags=["Auth"])
app.include_router(sharing_router,    prefix="/api/sharing",    tags=["Sharing"])
app.include_router(calendar_router,   prefix="/api/calendar",   tags=["Calendar"])

@app.get("/")
def root():
    return {"message": "MTRX-TriAxis API is running", "docs": "/docs"}
