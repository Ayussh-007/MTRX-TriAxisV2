"""System health & status routes."""

from fastapi import APIRouter
from backend.llm_utils import check_ollama_connection
from backend.rag_pipeline import vectorstore_exists
from backend.student_model import list_students

router = APIRouter()


@router.get("/health")
def health_check():
    students = list_students()
    return {
        "ollama": check_ollama_connection(),
        "vectorstore": vectorstore_exists(),
        "students_count": len(students),
    }
