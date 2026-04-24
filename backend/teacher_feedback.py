"""
MTRX-TriAxis | Feature 1: Teacher Feedback & Teaching Style Adaptation
Stores teacher preferences and adapts AI outputs (quiz difficulty,
learning paths, suggestions) based on the teacher's style.
"""

import os
import json
import sqlite3
from backend.llm_utils import get_llm

from backend.paths import DB_PATH as _DEFAULT_DB_PATH

# Reuse the same DB path as student_model
DATABASE_PATH = os.getenv("DATABASE_PATH", _DEFAULT_DB_PATH)

# ----- Predefined teaching styles -----
TEACHING_STYLES = {
    "visual": "Emphasize diagrams, charts, videos, and visual aids",
    "verbal": "Emphasize explanations, discussions, and verbal examples",
    "practical": "Emphasize hands-on activities, experiments, and real-world problems",
    "structured": "Emphasize step-by-step instructions and clear outlines",
    "interactive": "Emphasize group work, debates, and peer learning",
}

# ----- Predefined class pace levels -----
CLASS_PACE = {
    "slow": "Class is behind schedule, students need extra time",
    "normal": "Class is on track with the syllabus",
    "fast": "Class is ahead, students pick up concepts quickly",
}


def _get_connection() -> sqlite3.Connection:
    """Get a SQLite connection with row factory enabled."""
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_teacher_feedback_table():
    """
    Create the teacher_feedback table if it doesn't exist.
    Called automatically during app startup.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS teacher_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feedback_text TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS teacher_preferences (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


# ----- Feedback CRUD -----

def add_feedback(feedback_text: str, category: str = "general") -> int:
    """
    Store a teacher's feedback entry.

    Args:
        feedback_text: The teacher's feedback (e.g., "students are struggling").
        category: Category tag — 'pace', 'style', 'struggle', 'general'.

    Returns:
        The feedback entry ID.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO teacher_feedback (feedback_text, category) VALUES (?, ?)",
        (feedback_text, category)
    )

    fid = cursor.lastrowid
    conn.commit()
    conn.close()
    return fid


def get_recent_feedback(limit: int = 10) -> list[dict]:
    """Get the most recent teacher feedback entries."""
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM teacher_feedback
        ORDER BY timestamp DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def clear_feedback():
    """Clear all feedback entries."""
    conn = _get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM teacher_feedback")
    conn.commit()
    conn.close()


# ----- Preferences CRUD -----

def set_preference(key: str, value: str):
    """
    Save a teacher preference (upsert).

    Common keys:
        - 'teaching_style': one of TEACHING_STYLES keys
        - 'class_pace': one of CLASS_PACE keys
        - 'difficulty_level': 'easy', 'medium', 'hard'
        - 'custom_notes': free-text notes
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO teacher_preferences (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    """, (key, value, value))

    conn.commit()
    conn.close()


def get_preference(key: str, default: str = "") -> str:
    """Get a single teacher preference value."""
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT value FROM teacher_preferences WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()

    return row["value"] if row else default


def get_all_preferences() -> dict:
    """Get all teacher preferences as a dict."""
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT key, value FROM teacher_preferences")
    rows = cursor.fetchall()
    conn.close()

    return {row["key"]: row["value"] for row in rows}


# ----- Style Adaptation Logic -----

def build_style_context() -> str:
    """
    Build a context string from teacher preferences and recent feedback.
    This context is injected into LLM prompts to adapt AI behavior.

    Returns:
        Formatted string describing the teacher's preferred style.
    """
    prefs = get_all_preferences()
    feedback = get_recent_feedback(limit=5)

    parts = []

    # Teaching style
    style = prefs.get("teaching_style", "")
    if style and style in TEACHING_STYLES:
        parts.append(f"Teaching Style: {style.title()} — {TEACHING_STYLES[style]}")

    # Class pace
    pace = prefs.get("class_pace", "")
    if pace and pace in CLASS_PACE:
        parts.append(f"Class Pace: {pace.title()} — {CLASS_PACE[pace]}")

    # Difficulty preference
    diff = prefs.get("difficulty_level", "")
    if diff:
        parts.append(f"Preferred Difficulty: {diff.title()}")

    # Custom notes
    notes = prefs.get("custom_notes", "")
    if notes:
        parts.append(f"Teacher Notes: {notes}")

    # Recent feedback
    if feedback:
        feedback_texts = [f"- \"{f['feedback_text']}\"" for f in feedback[:5]]
        parts.append("Recent Feedback:\n" + "\n".join(feedback_texts))

    if not parts:
        return "No teacher preferences set. Use default teaching approach."

    return "\n".join(parts)


def get_adapted_difficulty() -> str:
    """
    Determine quiz/content difficulty based on teacher preferences and feedback.

    Returns:
        'easy', 'medium', or 'hard'.
    """
    prefs = get_all_preferences()

    # Direct preference takes priority
    diff = prefs.get("difficulty_level", "")
    if diff:
        return diff

    # Infer from pace
    pace = prefs.get("class_pace", "normal")
    if pace == "slow":
        return "easy"
    elif pace == "fast":
        return "hard"

    return "medium"


def analyze_feedback_with_llm() -> str:
    """
    Use LLM to analyze all recent teacher feedback and extract
    actionable insights for adapting the teaching approach.

    Returns:
        Markdown-formatted analysis of teacher feedback.
    """
    feedback = get_recent_feedback(limit=15)

    if not feedback:
        return "No teacher feedback recorded yet."

    feedback_text = "\n".join([
        f"- [{f['category']}] \"{f['feedback_text']}\" (at {f['timestamp']})"
        for f in feedback
    ])

    prefs = get_all_preferences()
    prefs_text = "\n".join([f"- {k}: {v}" for k, v in prefs.items()]) if prefs else "None set"

    prompt = f"""You are an expert educational consultant.
Analyze the following teacher feedback and preferences, then provide:

1. **Overall Teaching Climate** — How is the class doing?
2. **Key Concerns** — What are the teacher's main worries?
3. **Recommended Adjustments** — Specific changes to teaching approach
4. **Content Difficulty** — Should content be simplified or made more challenging?
5. **Suggested Activities** — Activities that would help based on the feedback

Teacher Feedback:
{feedback_text}

Teacher Preferences:
{prefs_text}

Provide a concise, actionable analysis."""

    llm = get_llm(temperature=0.6)
    return llm.invoke(prompt)
