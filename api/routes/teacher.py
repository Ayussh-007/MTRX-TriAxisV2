"""Teacher dashboard, analytics, feedback, and preferences routes."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

from backend.teacher_insights import (
    get_class_performance, get_weak_topics_across_class,
    get_strong_topics_across_class, generate_teaching_suggestions,
    get_student_risk_data,
)
from backend.teacher_feedback import (
    add_feedback, get_recent_feedback, set_preference,
    get_all_preferences, analyze_feedback_with_llm,
    get_preference, TEACHING_STYLES, CLASS_PACE,
)
from backend.attendance_intelligence import get_frequently_absent_students
from backend.class_weakness import get_top_weak_topics, generate_doubt_sheet
from backend.weather_context import get_weather_summary, get_weather, is_bad_weather

load_dotenv()

router = APIRouter()


class FeedbackCreate(BaseModel):
    text: str
    category: str = "general"


class PreferenceUpdate(BaseModel):
    teaching_style: Optional[str] = None
    class_pace: Optional[str] = None
    difficulty_level: Optional[str] = None


class SuggestionsRequest(BaseModel):
    city: Optional[str] = None


class DoubtSheetRequest(BaseModel):
    topics: list[str]


@router.get("/performance")
def class_performance():
    perf = get_class_performance()
    # Convert per_student from list-of-dicts with tuple values to clean dicts
    clean_students = []
    for s in perf.get("per_student", []):
        if isinstance(s, dict):
            clean_students.append(s)
        else:
            clean_students.append({
                "id": s[0], "name": s[1],
                "overall_score": s[2], "attendance_rate": s[3],
            })
    perf["per_student"] = clean_students
    return perf


@router.get("/risk-heatmap")
def risk_heatmap():
    return get_student_risk_data()


@router.get("/absent-alerts")
def absent_alerts(threshold: float = 70.0):
    return get_frequently_absent_students(threshold=threshold)


@router.get("/weak-topics")
def weak_topics(top_n: int = 5):
    return get_top_weak_topics(top_n=top_n)


@router.post("/doubt-sheet")
def doubt_sheet(data: DoubtSheetRequest):
    sheet = generate_doubt_sheet(data.topics)
    return {"sheet": sheet}


@router.post("/suggestions")
def teaching_suggestions(data: SuggestionsRequest):
    city = data.city or os.getenv("WEATHER_CITY", "Mumbai")
    result = generate_teaching_suggestions(city=city)
    return {"suggestions": result}


@router.post("/feedback")
def create_feedback(data: FeedbackCreate):
    add_feedback(data.text, data.category)
    return {"status": "recorded"}


@router.get("/feedback")
def recent_feedback(limit: int = 10):
    return get_recent_feedback(limit=limit)


@router.post("/feedback/analyze")
def analyze_feedback():
    analysis = analyze_feedback_with_llm()
    return {"analysis": analysis}


@router.get("/preferences")
def get_preferences():
    return {
        "teaching_style": get_preference("teaching_style", "visual"),
        "class_pace": get_preference("class_pace", "normal"),
        "difficulty_level": get_preference("difficulty_level", "medium"),
        "available_styles": TEACHING_STYLES,
        "available_paces": CLASS_PACE,
    }


@router.put("/preferences")
def update_preferences(data: PreferenceUpdate):
    if data.teaching_style:
        set_preference("teaching_style", data.teaching_style)
    if data.class_pace:
        set_preference("class_pace", data.class_pace)
    if data.difficulty_level:
        set_preference("difficulty_level", data.difficulty_level)
    return {"status": "updated"}


@router.get("/weather")
def weather_info():
    city = os.getenv("WEATHER_CITY", "Mumbai")
    weather_data = get_weather(city)
    summary = get_weather_summary(city)
    bad = is_bad_weather(weather_data) if weather_data else False
    return {
        "city": city,
        "data": weather_data,
        "summary": summary,
        "is_bad": bad,
    }
