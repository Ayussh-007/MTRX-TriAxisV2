"""Slide generation routes."""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import io

from backend.slide_generator import generate_slide_content, build_pptx
from backend.rag_pipeline import vectorstore_exists

router = APIRouter()


class SlideRequest(BaseModel):
    topic: str
    num_slides: int = 7
    teaching_style: str = "Visual"
    difficulty: str = "medium"
    include_examples: bool = True
    include_key_terms: bool = True
    include_quiz: bool = False
    teacher_name: str = "Teacher"


@router.post("/generate")
def generate_slides(data: SlideRequest):
    if not vectorstore_exists():
        return {"error": "No curriculum loaded. Upload a PDF first."}

    slides = generate_slide_content(
        topic=data.topic,
        num_slides=data.num_slides,
        teaching_style=data.teaching_style,
        difficulty=data.difficulty,
        include_examples=data.include_examples,
        include_key_terms=data.include_key_terms,
        include_quiz_slide=data.include_quiz,
        teacher_name=data.teacher_name,
    )

    pptx_bytes = build_pptx(
        slides,
        topic=data.topic,
        teacher_name=data.teacher_name,
    )

    return StreamingResponse(
        io.BytesIO(pptx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={
            "Content-Disposition": f'attachment; filename="MTRX_{data.topic[:30].replace(" ", "_")}.pptx"'
        },
    )
