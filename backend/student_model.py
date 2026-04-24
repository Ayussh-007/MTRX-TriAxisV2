"""
MTRX-TriAxis | Stage 3: Student Model
Student data management with SQLite — tracks attendance, quiz scores,
identifies weak topics, and generates personalized learning paths.
"""

import os
import sqlite3
from datetime import datetime, date

from backend.llm_utils import get_llm
from backend.paths import DB_PATH as _DEFAULT_DB_PATH
from prompts.learning_path import get_prompt as get_learning_path_prompt

# Default database path (cross-platform via paths.py)
DATABASE_PATH = os.getenv("DATABASE_PATH", _DEFAULT_DB_PATH)


def _get_connection() -> sqlite3.Connection:
    """Get a SQLite connection with row factory enabled."""
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn


def init_database():
    """
    Create all required tables if they don't exist.
    Call this once at app startup.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    # Students table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            login_id TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Add login_id column if upgrading from older schema
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN login_id TEXT")
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Attendance table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            present BOOLEAN NOT NULL DEFAULT 1,
            FOREIGN KEY (student_id) REFERENCES students(id),
            UNIQUE(student_id, date)
        )
    """)

    # Quiz scores table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quiz_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            quiz_id TEXT NOT NULL,
            topic TEXT NOT NULL,
            score INTEGER NOT NULL,
            max_score INTEGER NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)

    # Teacher feedback table (Feature 1)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS teacher_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feedback_text TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Teacher preferences table (Feature 1)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS teacher_preferences (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Shared content table (for shareable links)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS shared_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            share_id TEXT UNIQUE NOT NULL,
            content_type TEXT NOT NULL,
            content_data TEXT NOT NULL,
            assigned_to INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assigned_to) REFERENCES students(id)
        )
    """)

    # Student assignments table (links students to shared content)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS student_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            share_id TEXT NOT NULL,
            accessed BOOLEAN DEFAULT 0,
            accessed_at TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)

    conn.commit()
    conn.close()
    print("✅ Database initialized")


# ----- Student CRUD -----

def add_student(name: str, email: str = None, login_id: str = None) -> int:
    """
    Add a new student to the database.

    Args:
        name: Student's full name.
        email: Optional email address.
        login_id: Unique login ID for student authentication (e.g., 'AI251030').

    Returns:
        The new student's ID.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO students (name, email, login_id) VALUES (?, ?, ?)",
        (name, email, login_id)
    )

    student_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return student_id


def add_students_bulk(students_data: list[dict]) -> list[dict]:
    """
    Add multiple students in a single transaction.

    Args:
        students_data: List of dicts with keys: name (required), email (optional), login_id (optional).

    Returns:
        List of dicts: [{name, id, status, error}, ...] for each student.
    """
    conn = _get_connection()
    cursor = conn.cursor()
    results = []

    for s in students_data:
        name = s.get("name", "").strip()
        if not name:
            results.append({"name": "(empty)", "id": None, "status": "skipped", "error": "Empty name"})
            continue

        email = s.get("email", "").strip() or None
        login_id = s.get("login_id", "").strip() or None

        try:
            cursor.execute(
                "INSERT INTO students (name, email, login_id) VALUES (?, ?, ?)",
                (name, email, login_id)
            )
            results.append({"name": name, "id": cursor.lastrowid, "status": "added", "error": None})
        except sqlite3.IntegrityError as e:
            results.append({"name": name, "id": None, "status": "error", "error": str(e)})

    conn.commit()
    conn.close()
    return results


def get_student_by_login_id(login_id: str) -> dict:
    """Get a student by their unique login ID."""
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students WHERE login_id = ?", (login_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return None


def update_student_login_id(student_id: int, login_id: str):
    """Set or update a student's login ID."""
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE students SET login_id = ? WHERE id = ?",
        (login_id, student_id)
    )

    conn.commit()
    conn.close()


def get_student(student_id: int) -> dict:
    """Get a single student by ID."""
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return None


def list_students() -> list[dict]:
    """Get all students."""
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students ORDER BY name")
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def delete_student(student_id: int):
    """Delete a student and all their related records."""
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM quiz_scores WHERE student_id = ?", (student_id,))
    cursor.execute("DELETE FROM attendance WHERE student_id = ?", (student_id,))
    cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))

    conn.commit()
    conn.close()


# ----- Attendance -----

def record_attendance(student_id: int, date_str: str = None, present: bool = True):
    """
    Record attendance for a student on a given date.

    Args:
        student_id: The student's ID.
        date_str: Date string (YYYY-MM-DD). Defaults to today.
        present: True if student was present.
    """
    if date_str is None:
        date_str = date.today().isoformat()

    conn = _get_connection()
    cursor = conn.cursor()

    # Upsert: update if exists, insert if not
    cursor.execute("""
        INSERT INTO attendance (student_id, date, present)
        VALUES (?, ?, ?)
        ON CONFLICT(student_id, date) DO UPDATE SET present = ?
    """, (student_id, date_str, present, present))

    conn.commit()
    conn.close()


def record_attendance_bulk(records: list[dict]):
    """
    Record attendance for multiple students in a single transaction.

    Args:
        records: List of dicts with keys: student_id, date (YYYY-MM-DD), present (bool).
    """
    conn = _get_connection()
    cursor = conn.cursor()

    for r in records:
        cursor.execute("""
            INSERT INTO attendance (student_id, date, present)
            VALUES (?, ?, ?)
            ON CONFLICT(student_id, date) DO UPDATE SET present = ?
        """, (r["student_id"], r["date"], r["present"], r["present"]))

    conn.commit()
    conn.close()


def get_attendance_for_date(date_str: str) -> dict:
    """
    Get attendance records for ALL students on a specific date.

    Args:
        date_str: Date in YYYY-MM-DD format.

    Returns:
        Dict mapping student_id → present (bool). Students with no record
        for that date are not included.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT student_id, present FROM attendance WHERE date = ?
    """, (date_str,))

    rows = cursor.fetchall()
    conn.close()

    return {row["student_id"]: bool(row["present"]) for row in rows}


def get_attendance_rate(student_id: int) -> float:
    """
    Calculate attendance rate for a student (percentage).

    Returns:
        Attendance percentage (0-100), or 0 if no records.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present_count
        FROM attendance
        WHERE student_id = ?
    """, (student_id,))

    row = cursor.fetchone()
    conn.close()

    total = row["total"]
    if total == 0:
        return 0.0

    return round((row["present_count"] / total) * 100, 1)


def get_class_attendance_rate() -> float:
    """Calculate average attendance rate across all students."""
    students = list_students()
    if not students:
        return 0.0

    rates = [get_attendance_rate(s["id"]) for s in students]
    return round(sum(rates) / len(rates), 1) if rates else 0.0


# ----- Quiz Scores -----

def record_quiz_score(student_id: int, quiz_id: str, topic: str, score: int, max_score: int):
    """
    Record a quiz score for a student.

    Args:
        student_id: The student's ID.
        quiz_id: Unique quiz identifier.
        topic: Topic name the quiz covers.
        score: Points earned.
        max_score: Maximum possible points.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO quiz_scores (student_id, quiz_id, topic, score, max_score)
        VALUES (?, ?, ?, ?, ?)
    """, (student_id, quiz_id, topic, score, max_score))

    conn.commit()
    conn.close()


def get_student_scores(student_id: int) -> list[dict]:
    """Get all quiz scores for a student, newest first."""
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM quiz_scores
        WHERE student_id = ?
        ORDER BY timestamp DESC
    """, (student_id,))

    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_overall_score(student_id: int) -> float:
    """
    Calculate overall score percentage for a student.

    Returns:
        Score percentage (0-100), or 0 if no quizzes taken.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            SUM(score) as total_score,
            SUM(max_score) as total_max
        FROM quiz_scores
        WHERE student_id = ?
    """, (student_id,))

    row = cursor.fetchone()
    conn.close()

    if row["total_max"] is None or row["total_max"] == 0:
        return 0.0

    return round((row["total_score"] / row["total_max"]) * 100, 1)


def get_topic_scores(student_id: int) -> dict:
    """
    Get average score per topic for a student.

    Returns:
        Dict mapping topic name → average percentage.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            topic,
            AVG(CAST(score AS FLOAT) / max_score * 100) as avg_percentage
        FROM quiz_scores
        WHERE student_id = ?
        GROUP BY topic
    """, (student_id,))

    rows = cursor.fetchall()
    conn.close()

    return {row["topic"]: round(row["avg_percentage"], 1) for row in rows}


# ----- Weak Topic Detection -----

def get_weak_topics(student_id: int, threshold: float = 50.0) -> list[str]:
    """
    Identify topics where the student scores below the threshold.

    Args:
        student_id: The student's ID.
        threshold: Score percentage below which a topic is "weak".

    Returns:
        List of weak topic names, sorted by score (worst first).
    """
    topic_scores = get_topic_scores(student_id)

    # Filter and sort by score ascending (worst topics first)
    weak = [(topic, score) for topic, score in topic_scores.items() if score < threshold]
    weak.sort(key=lambda x: x[1])  # Sort by score ascending

    return [topic for topic, _ in weak]


def get_strong_topics(student_id: int, threshold: float = 70.0) -> list[str]:
    """Identify topics where the student scores above the threshold."""
    topic_scores = get_topic_scores(student_id)
    strong = [(topic, score) for topic, score in topic_scores.items() if score >= threshold]
    strong.sort(key=lambda x: x[1], reverse=True)
    return [topic for topic, _ in strong]


# ----- Personalized Learning Path -----

def generate_learning_path(student_id: int, available_topics: list[str] = None) -> str:
    """
    Generate a personalized learning path for a student using LLM.

    Analyzes the student's strengths, weaknesses, and attendance,
    then creates a structured study plan.

    Args:
        student_id: The student's ID.
        available_topics: List of topics from the curriculum.

    Returns:
        Markdown-formatted learning path string.
    """
    student = get_student(student_id)
    if not student:
        return "Student not found."

    # Gather student data
    overall = get_overall_score(student_id)
    attendance = get_attendance_rate(student_id)
    weak = get_weak_topics(student_id)
    strong = get_strong_topics(student_id)
    recent = get_student_scores(student_id)[:5]  # Last 5 scores

    # Format recent scores for the prompt
    recent_str = ", ".join([
        f"{s['topic']}: {s['score']}/{s['max_score']}"
        for s in recent
    ]) if recent else "No quizzes taken yet"

    # Build prompt
    llm = get_llm(temperature=0.7)
    prompt = get_learning_path_prompt()
    chain = prompt | llm

    result = chain.invoke({
        "student_name": student["name"],
        "overall_score": overall,
        "attendance_rate": attendance,
        "weak_topics": ", ".join(weak) if weak else "None identified yet",
        "strong_topics": ", ".join(strong) if strong else "None identified yet",
        "recent_scores": recent_str,
        "available_topics": ", ".join(available_topics) if available_topics else "Not specified",
    })

    return result


# ----- Class-Level Aggregation (used by Teacher Dashboard) -----

def get_class_topic_averages() -> dict:
    """
    Get average score per topic across ALL students.

    Returns:
        Dict mapping topic → average percentage.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            topic,
            AVG(CAST(score AS FLOAT) / max_score * 100) as avg_percentage,
            COUNT(DISTINCT student_id) as student_count
        FROM quiz_scores
        GROUP BY topic
    """)

    rows = cursor.fetchall()
    conn.close()

    return {
        row["topic"]: {
            "average": round(row["avg_percentage"], 1),
            "students_tested": row["student_count"],
        }
        for row in rows
    }


def get_class_weak_topics(threshold: float = 50.0) -> list[str]:
    """
    Identify topics where the CLASS AVERAGE is below threshold.

    Returns:
        List of weak topic names.
    """
    topic_data = get_class_topic_averages()
    weak = [
        (topic, data["average"])
        for topic, data in topic_data.items()
        if data["average"] < threshold
    ]
    weak.sort(key=lambda x: x[1])
    return [topic for topic, _ in weak]
