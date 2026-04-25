"""Classroom management routes — create, join, list, delete classrooms."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import sqlite3, secrets, string, os

from backend.paths import DATA_DIR

router = APIRouter()

DB_PATH = os.path.join(DATA_DIR, "classroom.db")


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_tables():
    conn = _get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS classrooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            subject TEXT,
            code TEXT UNIQUE NOT NULL,
            teacher_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS classroom_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            classroom_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            user_name TEXT,
            user_email TEXT,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(classroom_id, user_id)
        );
    """)
    conn.commit()
    conn.close()


_ensure_tables()


def _generate_code(length=6):
    """Generate a unique uppercase alphanumeric join code."""
    chars = string.ascii_uppercase + string.digits
    for _ in range(50):  # 50 retries
        code = ''.join(secrets.choice(chars) for _ in range(length))
        conn = _get_conn()
        existing = conn.execute("SELECT id FROM classrooms WHERE code = ?", (code,)).fetchone()
        conn.close()
        if not existing:
            return code
    raise HTTPException(500, "Could not generate unique code")


# ── Models ────────────────────────────────────────────────────

class CreateClassroom(BaseModel):
    name: str
    subject: Optional[str] = ""
    teacher_id: int


class JoinClassroom(BaseModel):
    code: str
    user_id: int
    user_name: Optional[str] = ""
    user_email: Optional[str] = ""


# ── Routes ────────────────────────────────────────────────────

@router.post("")
def create_classroom(data: CreateClassroom):
    """Teacher creates a new classroom with auto-generated join code."""
    if not data.name.strip():
        raise HTTPException(400, "Classroom name is required")

    code = _generate_code()
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO classrooms (name, subject, code, teacher_id) VALUES (?, ?, ?, ?)",
            (data.name.strip(), (data.subject or "").strip(), code, data.teacher_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM classrooms WHERE code = ?", (code,)).fetchone()
        return {"classroom": dict(row), "code": code}
    finally:
        conn.close()


@router.get("")
def list_classrooms(teacher_id: int = Query(...)):
    """List all classrooms owned by a teacher."""
    conn = _get_conn()
    rows = conn.execute(
        "SELECT * FROM classrooms WHERE teacher_id = ? ORDER BY created_at DESC",
        (teacher_id,),
    ).fetchall()

    result = []
    for r in rows:
        members = conn.execute(
            "SELECT COUNT(*) as cnt FROM classroom_members WHERE classroom_id = ?",
            (r["id"],),
        ).fetchone()
        d = dict(r)
        d["member_count"] = members["cnt"] if members else 0
        result.append(d)

    conn.close()
    return {"classrooms": result}


@router.get("/{classroom_id}")
def get_classroom(classroom_id: int):
    """Get classroom details + members."""
    conn = _get_conn()
    room = conn.execute("SELECT * FROM classrooms WHERE id = ?", (classroom_id,)).fetchone()
    if not room:
        conn.close()
        raise HTTPException(404, "Classroom not found")

    members = conn.execute(
        "SELECT * FROM classroom_members WHERE classroom_id = ? ORDER BY joined_at DESC",
        (classroom_id,),
    ).fetchall()
    conn.close()

    return {"classroom": dict(room), "members": [dict(m) for m in members]}


@router.post("/join")
def join_classroom(data: JoinClassroom):
    """Student joins a classroom using a code."""
    code = data.code.strip().upper()
    if not code:
        raise HTTPException(400, "Classroom code is required")

    conn = _get_conn()
    room = conn.execute("SELECT * FROM classrooms WHERE code = ?", (code,)).fetchone()
    if not room:
        conn.close()
        raise HTTPException(404, "Invalid classroom code. Please check and try again.")

    # Check if already joined
    existing = conn.execute(
        "SELECT id FROM classroom_members WHERE classroom_id = ? AND user_id = ?",
        (room["id"], data.user_id),
    ).fetchone()
    if existing:
        conn.close()
        return {"message": "Already a member", "classroom": dict(room)}

    conn.execute(
        "INSERT INTO classroom_members (classroom_id, user_id, user_name, user_email) VALUES (?, ?, ?, ?)",
        (room["id"], data.user_id, data.user_name or "", data.user_email or ""),
    )
    conn.commit()
    conn.close()

    return {"message": "Joined successfully!", "classroom": dict(room)}


@router.get("/student/{user_id}")
def get_student_classrooms(user_id: int):
    """Get all classrooms a student has joined."""
    conn = _get_conn()
    rows = conn.execute("""
        SELECT c.* FROM classrooms c
        JOIN classroom_members cm ON cm.classroom_id = c.id
        WHERE cm.user_id = ?
        ORDER BY cm.joined_at DESC
    """, (user_id,)).fetchall()
    conn.close()
    return {"classrooms": [dict(r) for r in rows]}


@router.delete("/{classroom_id}")
def delete_classroom(classroom_id: int):
    """Delete a classroom and its members."""
    conn = _get_conn()
    conn.execute("DELETE FROM classroom_members WHERE classroom_id = ?", (classroom_id,))
    conn.execute("DELETE FROM classrooms WHERE id = ?", (classroom_id,))
    conn.commit()
    conn.close()
    return {"message": "Classroom deleted"}
