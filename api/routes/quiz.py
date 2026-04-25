"""Quiz generation & evaluation routes."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from backend.quiz_engine import generate_quiz, evaluate_answers
from backend.student_model import record_quiz_score

router = APIRouter()


class QuizRequest(BaseModel):
    topic: str
    num_questions: int = 5


class EvaluateRequest(BaseModel):
    student_id: int
    quiz_data: dict
    answers: dict  # {question_index: "A"|"B"|"C"|"D"}


@router.post("/generate")
def create_quiz(data: QuizRequest):
    result = generate_quiz(data.topic, data.num_questions)
    return result


@router.post("/evaluate")
def evaluate_quiz(data: EvaluateRequest):
    result = evaluate_answers(data.quiz_data, data.answers)

    # Record score for student
    if data.quiz_data.get("quiz_id"):
        record_quiz_score(
            student_id=data.student_id,
            quiz_id=data.quiz_data["quiz_id"],
            topic=data.quiz_data.get("topic", "Unknown"),
            score=result["score"],
            max_score=result["max_score"],
        )

    return result
