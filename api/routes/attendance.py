"""Attendance grid, save, and summary routes."""

from fastapi import APIRouter
from pydantic import BaseModel
from datetime import date
import calendar

from backend.student_model import (
    list_students, record_attendance, record_attendance_bulk,
    get_attendance_for_date,
)

router = APIRouter()


class AttendanceRecord(BaseModel):
    student_id: int
    date: str
    present: bool


class AttendanceBulk(BaseModel):
    records: list[AttendanceRecord]


@router.get("/grid")
def get_attendance_grid(year: int, month: int):
    """Return full month grid data for all students."""
    students = list_students()
    _, num_days = calendar.monthrange(year, month)
    month_name = calendar.month_name[month]

    days = []
    for d in range(1, num_days + 1):
        dt = date(year, month, d)
        day_abbr = calendar.day_abbr[dt.weekday()]
        is_weekend = dt.weekday() in (5, 6)
        days.append({
            "day": d,
            "date": dt.isoformat(),
            "day_abbr": day_abbr,
            "is_weekend": is_weekend,
        })

    # Preload all attendance
    att_data = {}
    for day_info in days:
        att_data[day_info["date"]] = get_attendance_for_date(day_info["date"])

    # Build rows
    rows = []
    for s in students:
        cells = {}
        for day_info in days:
            ds = day_info["date"]
            if day_info["is_weekend"]:
                cells[ds] = "W"
            else:
                present = att_data[ds].get(s["id"])
                if present is True:
                    cells[ds] = "P"
                elif present is False:
                    cells[ds] = "A"
                else:
                    cells[ds] = "-"
        rows.append({
            "id": s["id"],
            "name": s["name"],
            "login_id": s.get("login_id", ""),
            "cells": cells,
        })

    return {
        "year": year,
        "month": month,
        "month_name": month_name,
        "num_days": num_days,
        "days": days,
        "students": rows,
    }


@router.post("/save")
def save_attendance(data: AttendanceBulk):
    records = [r.dict() for r in data.records]
    record_attendance_bulk(records)
    present = sum(1 for r in data.records if r.present)
    absent = len(data.records) - present
    return {"saved": len(data.records), "present": present, "absent": absent}


@router.get("/summary")
def get_monthly_summary(year: int, month: int):
    """Monthly attendance summary with percentages per student."""
    students = list_students()
    _, num_days = calendar.monthrange(year, month)

    total_working_days = 0
    student_counts = {s["id"]: 0 for s in students}

    for d in range(1, num_days + 1):
        dt = date(year, month, d)
        if dt > date.today():
            break
        if dt.weekday() in (5, 6):
            continue
        total_working_days += 1
        day_att = get_attendance_for_date(dt.isoformat())
        for sid, present in day_att.items():
            if present and sid in student_counts:
                student_counts[sid] += 1

    summary = []
    for s in students:
        present = student_counts.get(s["id"], 0)
        pct = round((present / total_working_days) * 100, 1) if total_working_days > 0 else 0
        summary.append({
            "id": s["id"],
            "name": s["name"],
            "present": present,
            "total": total_working_days,
            "percentage": pct,
        })

    return {"working_days": total_working_days, "students": summary}
