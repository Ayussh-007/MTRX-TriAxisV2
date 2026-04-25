"""Student authentication routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.student_model import get_student_by_login_id

router = APIRouter()


class LoginRequest(BaseModel):
    name: str
    login_id: str


@router.post("/login")
def student_login(data: LoginRequest):
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
