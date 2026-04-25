"""Teacher & Student authentication routes — email/password + Google OAuth."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sqlite3, hashlib, secrets, os

from backend.paths import DATA_DIR

router = APIRouter()

DB_PATH = os.path.join(DATA_DIR, "classroom.db")


# ── Helpers ──────────────────────────────────────────────────
def _hash_pw(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode()).hexdigest()


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_users_table():
    conn = _get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            salt TEXT,
            google_id TEXT,
            picture TEXT,
            role TEXT NOT NULL DEFAULT 'student',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


# Run on import so table exists
_ensure_users_table()


# ── Pydantic Models ──────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "student"


class EmailLoginRequest(BaseModel):
    email: str
    password: str
    role: str = "student"


class GoogleAuthRequest(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None
    google_id: str
    role: str = "student"


class StudentLoginRequest(BaseModel):
    """Legacy student login by name + login_id."""
    name: str
    login_id: str


# ── Helper: build user response ─────────────────────────────
def _user_response(row):
    return {
        "authenticated": True,
        "user": {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "picture": row["picture"],
            "role": row["role"],
        },
    }


# ── Routes ───────────────────────────────────────────────────

@router.post("/register")
def register(data: RegisterRequest):
    """Register with email + password."""
    if not data.name.strip() or not data.email.strip() or not data.password.strip():
        raise HTTPException(400, "All fields are required")
    if len(data.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    if data.role not in ("student", "teacher"):
        raise HTTPException(400, "Role must be 'student' or 'teacher'")

    salt = secrets.token_hex(16)
    pw_hash = _hash_pw(data.password, salt)

    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO users (name, email, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)",
            (data.name.strip(), data.email.strip().lower(), pw_hash, salt, data.role),
        )
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (data.email.strip().lower(),)).fetchone()
        return _user_response(user)
    except sqlite3.IntegrityError:
        raise HTTPException(409, "An account with this email already exists")
    finally:
        conn.close()


@router.post("/login-email")
def login_email(data: EmailLoginRequest):
    """Log in with email + password."""
    conn = _get_conn()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (data.email.strip().lower(),)).fetchone()
    conn.close()

    if not user:
        raise HTTPException(401, "Invalid email or password")

    if not user["password_hash"] or not user["salt"]:
        raise HTTPException(401, "This account uses Google sign-in. Please use Google to log in.")

    if _hash_pw(data.password, user["salt"]) != user["password_hash"]:
        raise HTTPException(401, "Invalid email or password")

    return _user_response(user)


@router.post("/google")
def google_auth(data: GoogleAuthRequest):
    """Sign in or register via Google OAuth."""
    if data.role not in ("student", "teacher"):
        raise HTTPException(400, "Role must be 'student' or 'teacher'")

    conn = _get_conn()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (data.email.strip().lower(),)).fetchone()

    if user:
        # Update google_id and picture if not set
        conn.execute(
            "UPDATE users SET google_id = ?, picture = ? WHERE id = ?",
            (data.google_id, data.picture, user["id"]),
        )
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    else:
        # Auto-register
        conn.execute(
            "INSERT INTO users (name, email, google_id, picture, role) VALUES (?, ?, ?, ?, ?)",
            (data.name.strip(), data.email.strip().lower(), data.google_id, data.picture, data.role),
        )
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (data.email.strip().lower(),)).fetchone()

    conn.close()
    return _user_response(user)


# ── Legacy student login (by name + login_id) ───────────────
@router.post("/login")
def student_login(data: StudentLoginRequest):
    """Original student login for the Student Portal."""
    from backend.student_model import get_student_by_login_id

    if not data.name or not data.login_id:
        raise HTTPException(status_code=400, detail="Name and Login ID required")

    student = get_student_by_login_id(data.login_id.strip())
    if student is None:
        raise HTTPException(status_code=401, detail="Invalid login credentials")

    if student["name"].lower().strip() != data.name.lower().strip():
        raise HTTPException(status_code=401, detail="Invalid login credentials")

    return {
        "authenticated": True,
        "student": {
            "id": student["id"],
            "name": student["name"],
            "email": student.get("email"),
            "login_id": student.get("login_id"),
        },
    }
