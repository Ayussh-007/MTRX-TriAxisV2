"""Slide generation routes — preview + download with proper error handling."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import io
import traceback

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


class BuildRequest(BaseModel):
    """Build PPTX from already-previewed slide data."""
    slides: list[dict]
    topic: str
    teacher_name: str = "Teacher"


@router.post("/preview")
def preview_slides(data: SlideRequest):
    """Generate slide content as JSON for preview/editing before downloading."""
    try:
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
        return {"slides": slides, "topic": data.topic}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/build")
def build_slides(data: BuildRequest):
    """Build PPTX from slide data JSON (after preview/edit)."""
    try:
        pptx_bytes = build_pptx(
            data.slides,
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
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
def generate_slides(data: SlideRequest):
    """One-shot: generate + build PPTX in a single call."""
    try:
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
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
