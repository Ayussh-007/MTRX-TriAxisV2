"""Quiz generation, sharing, evaluation, and trend analysis routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import json

from backend.quiz_engine import generate_quiz, evaluate_answers
from backend.student_model import (
    record_quiz_score, get_student_scores, list_students,
    get_topic_scores, get_overall_score,
)
from backend.content_sharing import (
    create_share_link, get_shared_content,
    assign_content_to_student, get_student_assignments,
)

router = APIRouter()


class QuizRequest(BaseModel):
    topic: str
    num_questions: int = 5


class EvaluateRequest(BaseModel):
    student_id: int
    quiz_data: dict
    answers: dict  # {question_index: "A"|"B"|"C"|"D"}


class ShareQuizRequest(BaseModel):
    quiz_data: dict
    student_ids: list[int] = []  # empty = share with all


# ── Generate ──────────────────────────────────────────────
@router.post("/generate")
def create_quiz(data: QuizRequest):
    result = generate_quiz(data.topic, data.num_questions)
    return result


# ── Evaluate ──────────────────────────────────────────────
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


# ── Share Quiz with Students ──────────────────────────────
@router.post("/share")
def share_quiz(data: ShareQuizRequest):
    """Share a generated quiz with specific students (or all)."""
    quiz = data.quiz_data
    if not quiz.get("questions"):
        raise HTTPException(status_code=400, detail="Quiz has no questions")

    share_id = create_share_link(
        content_type="quiz",
        content_data=quiz,
    )

    # Assign to students
    student_ids = data.student_ids
    if not student_ids:
        # All students
        student_ids = [s["id"] for s in list_students()]

    for sid in student_ids:
        assign_content_to_student(share_id, sid)

    return {
        "share_id": share_id,
        "assigned_to": len(student_ids),
        "topic": quiz.get("topic", ""),
    }


# ── Get Pending Quizzes for Student ───────────────────────
@router.get("/pending/{student_id}")
def pending_quizzes(student_id: int):
    """Get all quizzes assigned to a student that they haven't completed yet."""
    assignments = get_student_assignments(student_id)
    scores = get_student_scores(student_id)
    completed_quiz_ids = {s["quiz_id"] for s in scores}

    pending = []
    for a in assignments:
        if a["content_type"] != "quiz":
            continue
        content = get_shared_content(a["share_id"])
        if not content:
            continue
        quiz_data = content.get("content_data", {})
        if isinstance(quiz_data, str):
            try:
                quiz_data = json.loads(quiz_data)
            except json.JSONDecodeError:
                continue
        quiz_id = quiz_data.get("quiz_id", "")
        if quiz_id in completed_quiz_ids:
            continue  # Already taken
        pending.append({
            "share_id": a["share_id"],
            "quiz_id": quiz_id,
            "topic": quiz_data.get("topic", "Unknown"),
            "questions_count": len(quiz_data.get("questions", [])),
            "created_at": content.get("created_at", ""),
            "quiz_data": quiz_data,
        })

    return pending


# ── Get Quiz by Share ID ──────────────────────────────────
@router.get("/shared/{share_id}")
def get_quiz_by_share(share_id: str):
    """Get a specific shared quiz by its share_id."""
    content = get_shared_content(share_id)
    if not content or content.get("content_type") != "quiz":
        raise HTTPException(status_code=404, detail="Quiz not found")
    return content.get("content_data", {})


# ── Quiz Trend Analytics ─────────────────────────────────
@router.get("/trends")
def quiz_trends():
    """
    Class-wide quiz trend analytics:
    - Score over time (per quiz)
    - Per-topic class average
    - Per-student trend
    """
    students = list_students()
    if not students:
        return {"quizzes_over_time": [], "topic_averages": {}, "student_trends": []}

    # Gather all scores across all students
    all_scores = []
    for s in students:
        scores = get_student_scores(s["id"])
        for sc in scores:
            all_scores.append({**sc, "student_name": s["name"]})

    if not all_scores:
        return {"quizzes_over_time": [], "topic_averages": {}, "student_trends": []}

    # 1. Quizzes over time (aggregate per quiz_id)
    quiz_map = {}
    for sc in all_scores:
        qid = sc["quiz_id"]
        if qid not in quiz_map:
            quiz_map[qid] = {
                "quiz_id": qid,
                "topic": sc["topic"],
                "date": sc.get("timestamp", ""),
                "scores": [],
                "max_scores": [],
            }
        quiz_map[qid]["scores"].append(sc["score"])
        quiz_map[qid]["max_scores"].append(sc["max_score"])

    quizzes_over_time = []
    for qid, data in quiz_map.items():
        total = sum(data["scores"])
        total_max = sum(data["max_scores"])
        avg_pct = round((total / total_max) * 100, 1) if total_max > 0 else 0
        quizzes_over_time.append({
            "quiz_id": qid,
            "topic": data["topic"],
            "date": data["date"],
            "class_avg": avg_pct,
            "students_attempted": len(data["scores"]),
        })

    quizzes_over_time.sort(key=lambda x: x["date"])

    # 2. Topic averages (class-wide)
    topic_scores_map = {}
    for sc in all_scores:
        t = sc["topic"]
        if t not in topic_scores_map:
            topic_scores_map[t] = {"total": 0, "max": 0, "count": 0}
        topic_scores_map[t]["total"] += sc["score"]
        topic_scores_map[t]["max"] += sc["max_score"]
        topic_scores_map[t]["count"] += 1

    topic_averages = {}
    for t, data in topic_scores_map.items():
        topic_averages[t] = {
            "average": round((data["total"] / data["max"]) * 100, 1) if data["max"] > 0 else 0,
            "attempts": data["count"],
        }

    # 3. Per-student trend (last 5 scores)
    student_trends = []
    for s in students:
        scores = get_student_scores(s["id"])[:10]
        if not scores:
            continue
        recent = []
        for sc in reversed(scores):  # oldest → newest
            pct = round((sc["score"] / sc["max_score"]) * 100, 1) if sc["max_score"] > 0 else 0
            recent.append({"topic": sc["topic"], "percentage": pct, "date": sc.get("timestamp", "")})
        overall = get_overall_score(s["id"])
        # Calculate trend direction
        if len(recent) >= 2:
            first_half = sum(r["percentage"] for r in recent[:len(recent)//2]) / (len(recent)//2)
            second_half = sum(r["percentage"] for r in recent[len(recent)//2:]) / (len(recent) - len(recent)//2)
            trend = "improving" if second_half > first_half + 3 else "declining" if second_half < first_half - 3 else "stable"
        else:
            trend = "insufficient_data"

        student_trends.append({
            "id": s["id"],
            "name": s["name"],
            "overall": overall,
            "trend": trend,
            "recent_scores": recent,
        })

    return {
        "quizzes_over_time": quizzes_over_time,
        "topic_averages": topic_averages,
        "student_trends": student_trends,
    }
