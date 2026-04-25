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


# ──────────────────────────────────────────────────────────────
# Classroom-scoped data endpoints
# ──────────────────────────────────────────────────────────────

def _classroom_member_ids(classroom_id: int) -> list[int]:
    """Get list of user_ids who are members of a classroom."""
    conn = _get_conn()
    rows = conn.execute(
        "SELECT user_id FROM classroom_members WHERE classroom_id = ?",
        (classroom_id,),
    ).fetchall()
    conn.close()
    return [r["user_id"] for r in rows]


@router.get("/{classroom_id}/students")
def get_classroom_students(classroom_id: int):
    """Get all members of a classroom with their data from the main student DB."""
    from backend.student_model import get_student, get_overall_score, get_attendance_rate

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

    students = []
    for m in members:
        student = get_student(m["user_id"])
        score = get_overall_score(m["user_id"]) if student else 0
        att = get_attendance_rate(m["user_id"]) if student else 0
        students.append({
            "id": m["user_id"],
            "name": m["user_name"] or (student["name"] if student else "Unknown"),
            "email": m["user_email"] or "",
            "score": score,
            "attendance": att,
            "joined_at": m["joined_at"],
        })

    return {"students": students, "classroom": dict(room)}


@router.get("/{classroom_id}/dashboard")
def classroom_dashboard(classroom_id: int):
    """Aggregated dashboard data for a classroom — metrics, charts, topic data."""
    from backend.student_model import (
        get_student, get_overall_score, get_attendance_rate,
        get_topic_scores, get_student_scores, get_weak_topics, get_strong_topics,
    )

    conn = _get_conn()
    room = conn.execute("SELECT * FROM classrooms WHERE id = ?", (classroom_id,)).fetchone()
    if not room:
        conn.close()
        raise HTTPException(404, "Classroom not found")

    members = conn.execute(
        "SELECT * FROM classroom_members WHERE classroom_id = ?",
        (classroom_id,),
    ).fetchall()
    conn.close()

    member_ids = [m["user_id"] for m in members]
    num_students = len(member_ids)

    # Per-student metrics
    student_data = []
    all_scores_sum = 0
    all_att_sum = 0
    all_topic_map = {}  # topic -> [scores]
    total_quizzes = 0

    for uid in member_ids:
        student = get_student(uid)
        score = get_overall_score(uid) if student else 0
        att = get_attendance_rate(uid) if student else 0
        topics = get_topic_scores(uid) if student else {}
        quiz_scores = get_student_scores(uid) if student else []
        weak = get_weak_topics(uid) if student else []
        strong = get_strong_topics(uid) if student else []

        all_scores_sum += score
        all_att_sum += att
        total_quizzes += len(quiz_scores)

        for t, s in topics.items():
            all_topic_map.setdefault(t, []).append(s)

        # Trend calculation
        recent = quiz_scores[:10]
        if len(recent) >= 2:
            first_half = sum(
                (s["score"] / s["max_score"] * 100) if s["max_score"] > 0 else 0
                for s in recent[len(recent)//2:]
            ) / max(1, len(recent) - len(recent)//2)
            second_half = sum(
                (s["score"] / s["max_score"] * 100) if s["max_score"] > 0 else 0
                for s in recent[:len(recent)//2]
            ) / max(1, len(recent)//2)
            trend = "improving" if second_half > first_half + 3 else (
                "declining" if second_half < first_half - 3 else "stable"
            )
        else:
            trend = "new"

        student_data.append({
            "id": uid,
            "name": student["name"] if student else "Unknown",
            "score": score,
            "attendance": att,
            "quizzes_taken": len(quiz_scores),
            "weak_topics": weak,
            "strong_topics": strong,
            "trend": trend,
        })

    # Topic averages
    topic_averages = {
        t: round(sum(scores) / len(scores), 1)
        for t, scores in all_topic_map.items()
    }

    # Sort students by score descending
    student_data.sort(key=lambda s: s["score"], reverse=True)

    return {
        "classroom": dict(room),
        "metrics": {
            "num_students": num_students,
            "avg_score": round(all_scores_sum / num_students, 1) if num_students else 0,
            "avg_attendance": round(all_att_sum / num_students, 1) if num_students else 0,
            "total_quizzes": total_quizzes,
        },
        "topic_averages": topic_averages,
        "students": student_data,
    }


@router.get("/{classroom_id}/attendance/grid")
def classroom_attendance_grid(classroom_id: int, year: int = Query(...), month: int = Query(...)):
    """Attendance grid for classroom members only."""
    from backend.student_model import get_student, get_attendance_for_date
    import calendar as cal
    from datetime import date

    member_ids = _classroom_member_ids(classroom_id)
    _, num_days = cal.monthrange(year, month)
    month_name = cal.month_name[month]

    days = []
    for d in range(1, num_days + 1):
        dt = date(year, month, d)
        days.append({
            "day": d, "date": dt.isoformat(),
            "day_abbr": cal.day_abbr[dt.weekday()],
            "is_weekend": dt.weekday() in (5, 6),
        })

    att_data = {}
    for day_info in days:
        att_data[day_info["date"]] = get_attendance_for_date(day_info["date"])

    rows = []
    for uid in member_ids:
        student = get_student(uid)
        if not student:
            continue
        cells = {}
        for day_info in days:
            ds = day_info["date"]
            if day_info["is_weekend"]:
                cells[ds] = "W"
            else:
                present = att_data[ds].get(uid)
                cells[ds] = "P" if present is True else ("A" if present is False else "-")
        rows.append({"id": uid, "name": student["name"], "cells": cells})

    return {
        "year": year, "month": month, "month_name": month_name,
        "num_days": num_days, "days": days, "students": rows,
    }


class ClassroomAttendanceBulk(BaseModel):
    records: list[dict]  # [{student_id, date, present}, ...]


@router.post("/{classroom_id}/attendance/save")
def save_classroom_attendance(classroom_id: int, data: ClassroomAttendanceBulk):
    """Save attendance for classroom members."""
    from backend.student_model import record_attendance_bulk
    record_attendance_bulk(data.records)
    present = sum(1 for r in data.records if r.get("present"))
    return {"saved": len(data.records), "present": present, "absent": len(data.records) - present}


@router.get("/{classroom_id}/quizzes")
def classroom_quizzes(classroom_id: int):
    """List all quizzes that have been shared with students in this classroom."""
    from backend.student_model import get_student_scores
    from backend.content_sharing import get_student_assignments, get_shared_content
    import json as _json

    member_ids = _classroom_member_ids(classroom_id)
    if not member_ids:
        return {"quizzes": []}

    # Find quizzes assigned to any classroom member
    seen = set()
    quizzes = []
    for uid in member_ids:
        assignments = get_student_assignments(uid)
        for a in assignments:
            if a["content_type"] != "quiz" or a["share_id"] in seen:
                continue
            seen.add(a["share_id"])
            content = get_shared_content(a["share_id"])
            if not content:
                continue
            quiz_data = content.get("content_data", {})
            if isinstance(quiz_data, str):
                try: quiz_data = _json.loads(quiz_data)
                except: continue
            quizzes.append({
                "share_id": a["share_id"],
                "topic": quiz_data.get("topic", "Unknown"),
                "questions_count": len(quiz_data.get("questions", [])),
                "created_at": content.get("created_at", ""),
            })

    return {"quizzes": quizzes}

