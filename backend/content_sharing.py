"""
MTRX-TriAxis | Content Sharing System
Generates shareable links for quizzes, learning paths, and doubt sheets.
Content is stored in SQLite and retrieved via share IDs.
"""

import os
import json
import uuid
import sqlite3
from datetime import datetime

from backend.paths import DB_PATH as _DEFAULT_DB_PATH

DATABASE_PATH = os.getenv("DATABASE_PATH", _DEFAULT_DB_PATH)


def _get_connection() -> sqlite3.Connection:
    """Get a SQLite connection with row factory enabled."""
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def create_share_link(content_type: str, content_data: dict, assigned_to: int = None) -> str:
    """
    Create a shareable content link.

    Args:
        content_type: Type of content — 'quiz', 'learning_path', 'doubt_sheet'.
        content_data: Dict containing the content to share.
        assigned_to: Optional student ID to restrict access.

    Returns:
        The share_id string (use as query param: ?share=<share_id>).
    """
    share_id = str(uuid.uuid4())[:12]
    data_json = json.dumps(content_data)

    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO shared_content (share_id, content_type, content_data, assigned_to)
        VALUES (?, ?, ?, ?)
    """, (share_id, content_type, data_json, assigned_to))

    conn.commit()
    conn.close()

    return share_id


def get_shared_content(share_id: str) -> dict:
    """
    Retrieve shared content by its share ID.

    Returns:
        Dict with content_type, content_data (parsed), assigned_to, created_at.
        None if not found.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM shared_content WHERE share_id = ?", (share_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        result = dict(row)
        try:
            result["content_data"] = json.loads(result["content_data"])
        except (json.JSONDecodeError, TypeError):
            pass
        return result

    return None


def assign_content_to_student(share_id: str, student_id: int):
    """
    Assign shared content to a specific student.

    Creates a record in student_assignments for tracking.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR IGNORE INTO student_assignments (student_id, share_id)
        VALUES (?, ?)
    """, (student_id, share_id))

    conn.commit()
    conn.close()


def mark_content_accessed(share_id: str, student_id: int):
    """Mark that a student has accessed shared content."""
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE student_assignments
        SET accessed = 1, accessed_at = ?
        WHERE share_id = ? AND student_id = ?
    """, (datetime.now().isoformat(), share_id, student_id))

    conn.commit()
    conn.close()


def get_student_assignments(student_id: int) -> list[dict]:
    """Get all content assigned to a student."""
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT sa.share_id, sa.accessed, sa.accessed_at,
               sc.content_type, sc.created_at
        FROM student_assignments sa
        JOIN shared_content sc ON sa.share_id = sc.share_id
        WHERE sa.student_id = ?
        ORDER BY sc.created_at DESC
    """, (student_id,))

    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_all_share_links() -> list[dict]:
    """Get all shared content entries (for teacher dashboard)."""
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT sc.*, s.name as assigned_name
        FROM shared_content sc
        LEFT JOIN students s ON sc.assigned_to = s.id
        ORDER BY sc.created_at DESC
    """)

    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
