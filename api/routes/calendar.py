"""Calendar & holiday routes."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import date

from backend.calendar_planner import (
    get_upcoming_holidays, is_holiday_today,
    get_teaching_suggestion_for_date,
)

router = APIRouter()


class PlanRequest(BaseModel):
    date_str: Optional[str] = None


@router.get("/holidays")
def upcoming_holidays(days_ahead: int = 14):
    return get_upcoming_holidays(days_ahead=days_ahead)


@router.get("/today")
def today_holiday():
    return is_holiday_today()


@router.post("/plan")
def daily_plan(data: PlanRequest):
    target = date.fromisoformat(data.date_str) if data.date_str else None
    plan = get_teaching_suggestion_for_date(target)
    return {"plan": plan}
