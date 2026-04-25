"""Student CRUD & dashboard routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from backend.student_model import (
    list_students, add_student, add_students_bulk, delete_student,
    get_student, get_overall_score, get_attendance_rate,
    get_topic_scores, get_weak_topics, get_strong_topics,
    update_student_login_id, generate_learning_path,
)
from backend.attendance_intelligence import (
    get_attendance_status, get_performance_trend,
    generate_recovery_plan, generate_performance_feedback,
)
from backend.rag_pipeline import vectorstore_exists, get_available_topics

router = APIRouter()


class StudentCreate(BaseModel):
    name: str
    email: Optional[str] = None
    login_id: Optional[str] = None


class BulkStudent(BaseModel):
    students: list[dict]


class LoginIdUpdate(BaseModel):
    login_id: str


@router.get("")
def get_students():
    return list_students()


@router.post("")
def create_student(data: StudentCreate):
    try:
        sid = add_student(data.name, data.email, data.login_id)
        return {"id": sid, "name": data.name, "status": "added"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bulk")
def create_students_bulk(data: BulkStudent):
    results = add_students_bulk(data.students)
    return {"results": results}


@router.delete("/{student_id}")
def remove_student(student_id: int):
    delete_student(student_id)
    return {"status": "deleted", "id": student_id}


@router.get("/{student_id}")
def get_student_detail(student_id: int):
    student = get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.put("/{student_id}/login-id")
def set_login_id(student_id: int, data: LoginIdUpdate):
    try:
        update_student_login_id(student_id, data.login_id)
        return {"status": "updated"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{student_id}/dashboard")
def get_student_dashboard(student_id: int):
    student = get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    att_status = get_attendance_status(student_id)
    trend = get_performance_trend(student_id)

    return {
        "student": student,
        "overall_score": get_overall_score(student_id),
        "attendance_rate": get_attendance_rate(student_id),
        "topic_scores": get_topic_scores(student_id),
        "weak_topics": get_weak_topics(student_id),
        "strong_topics": get_strong_topics(student_id),
        "attendance_status": att_status,
        "performance_trend": trend,
    }


@router.post("/{student_id}/recovery-plan")
def recovery_plan(student_id: int):
    plan = generate_recovery_plan(student_id)
    return {"plan": plan}


@router.post("/{student_id}/performance-feedback")
def performance_feedback(student_id: int):
    feedback = generate_performance_feedback(student_id)
    return {"feedback": feedback}


@router.post("/{student_id}/learning-path")
def learning_path(student_id: int):
    available = []
    if vectorstore_exists():
        try:
            available = get_available_topics()
        except Exception:
            pass
    path = generate_learning_path(student_id, available)
    return {"path": path}
