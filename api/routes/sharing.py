"""Content sharing routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from backend.content_sharing import (
    create_share_link, get_all_share_links,
    assign_content_to_student, get_shared_content,
    get_student_assignments,
)

router = APIRouter()


class ShareCreate(BaseModel):
    content_type: str
    content_data: dict
    assigned_to: Optional[int] = None


class ShareAssign(BaseModel):
    share_id: str
    student_id: int


@router.post("/create")
def create_share(data: ShareCreate):
    share_id = create_share_link(
        content_type=data.content_type,
        content_data=data.content_data,
        assigned_to=data.assigned_to,
    )
    if data.assigned_to:
        assign_content_to_student(share_id, data.assigned_to)
    return {"share_id": share_id}


@router.get("/links")
def list_share_links():
    return get_all_share_links()


@router.post("/assign")
def assign_to_student(data: ShareAssign):
    assign_content_to_student(data.share_id, data.student_id)
    return {"status": "assigned"}


@router.get("/{share_id}")
def get_content(share_id: str):
    content = get_shared_content(share_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return content


@router.get("/student/{student_id}")
def student_assignments(student_id: int):
    return get_student_assignments(student_id)
