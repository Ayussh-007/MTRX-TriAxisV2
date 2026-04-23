"""
MTRX-TriAxis | Student Authentication
Simple authentication system using name + login_id against the SQLite database.
"""

import streamlit as st
from backend.student_model import get_student_by_login_id, get_student


def authenticate_student(name: str, login_id: str) -> dict:
    """
    Authenticate a student by name and login ID.

    Args:
        name: Student's name (case-insensitive match).
        login_id: Unique login ID (e.g., 'AI251030').

    Returns:
        Student dict if authenticated, None otherwise.
    """
    if not name or not login_id:
        return None

    student = get_student_by_login_id(login_id.strip())
    if student is None:
        return None

    # Case-insensitive name match
    if student["name"].lower().strip() == name.lower().strip():
        return student

    return None


def login_student(student: dict):
    """Store authenticated student in session state."""
    st.session_state["student_user"] = student
    st.session_state["student_logged_in"] = True


def logout_student():
    """Clear student session."""
    st.session_state.pop("student_user", None)
    st.session_state.pop("student_logged_in", None)


def get_logged_in_student() -> dict:
    """
    Get the currently logged-in student.

    Returns:
        Student dict if logged in, None otherwise.
    """
    if st.session_state.get("student_logged_in"):
        return st.session_state.get("student_user")
    return None


def is_student_logged_in() -> bool:
    """Check if a student is currently logged in."""
    return st.session_state.get("student_logged_in", False)
