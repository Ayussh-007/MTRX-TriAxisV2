"""AI Agent routes."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from backend.ai_agent import run_agent_pipeline

router = APIRouter()


class AgentRequest(BaseModel):
    student_id: int
    city: Optional[str] = None


@router.post("/run")
def run_agent_query(data: AgentRequest):
    result = run_agent_pipeline(data.student_id, city=data.city)
    return result
