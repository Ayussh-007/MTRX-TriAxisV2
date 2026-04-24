"""
MTRX-TriAxis | Feature 2: Attendance Intelligence
Detects frequently absent students and generates AI-powered recovery plans.
Also provides Feature 4: Performance Evolution Tracking.
"""

import os
import sqlite3
from datetime import datetime, timedelta

from backend.llm_utils import get_llm
from backend.student_model import (
    get_student, list_students, get_attendance_rate,
    get_student_scores, get_overall_score, get_weak_topics,
    get_strong_topics, get_topic_scores,
)

from backend.paths import DB_PATH as _DEFAULT_DB_PATH

DATABASE_PATH = os.getenv("DATABASE_PATH", _DEFAULT_DB_PATH)


def _get_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ============================================================
#  FEATURE 2: Attendance-Aware Learning System
# ============================================================

def get_attendance_history(student_id: int, days: int = 30) -> list[dict]:
    """
    Get detailed attendance records for a student over recent days.

    Args:
        student_id: The student's ID.
        days: Number of days to look back.

    Returns:
        List of {date, present} dicts, newest first.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    cursor.execute("""
        SELECT date, present FROM attendance
        WHERE student_id = ? AND date >= ?
        ORDER BY date DESC
    """, (student_id, cutoff))

    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_absence_streak(student_id: int) -> int:
    """
    Count the current consecutive absence streak.
    Returns 0 if the student was present most recently.
    """
    conn = _get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT present FROM attendance
        WHERE student_id = ?
        ORDER BY date DESC
    """, (student_id,))

    rows = cursor.fetchall()
    conn.close()

    streak = 0
    for row in rows:
        if not row["present"]:
            streak += 1
        else:
            break

    return streak


def get_frequently_absent_students(threshold: float = 70.0) -> list[dict]:
    """
    Identify students with attendance below the threshold.

    Args:
        threshold: Attendance percentage below which a student is "frequently absent".

    Returns:
        List of dicts: [{id, name, attendance_rate, absence_streak}, ...]
        sorted by attendance rate ascending (worst first).
    """
    students = list_students()
    at_risk = []

    for student in students:
        sid = student["id"]
        rate = get_attendance_rate(sid)
        streak = get_absence_streak(sid)

        if rate < threshold and rate > 0:  # Only if they have attendance records
            at_risk.append({
                "id": sid,
                "name": student["name"],
                "attendance_rate": rate,
                "absence_streak": streak,
            })

    # Sort by attendance ascending (worst first)
    at_risk.sort(key=lambda x: x["attendance_rate"])
    return at_risk


def get_attendance_status(student_id: int) -> dict:
    """
    Comprehensive attendance analysis for a single student.

    Returns:
        Dict with status, rate, streak, risk_level, and recommendation.
    """
    rate = get_attendance_rate(student_id)
    streak = get_absence_streak(student_id)
    history = get_attendance_history(student_id, days=30)

    # Determine risk level
    if rate >= 85:
        risk_level = "low"
        status_emoji = "🟢"
        status = "Regular"
    elif rate >= 70:
        risk_level = "medium"
        status_emoji = "🟡"
        status = "Irregular"
    elif rate >= 50:
        risk_level = "high"
        status_emoji = "🟠"
        status = "Frequently Absent"
    else:
        risk_level = "critical"
        status_emoji = "🔴"
        status = "Chronically Absent"

    # Additional warning if long streak
    if streak >= 3:
        risk_level = "critical"
        status_emoji = "🔴"
        status = f"Absent {streak} days in a row"

    return {
        "attendance_rate": rate,
        "absence_streak": streak,
        "total_records": len(history),
        "risk_level": risk_level,
        "status_emoji": status_emoji,
        "status": status,
    }


def generate_recovery_plan(student_id: int) -> str:
    """
    Generate an AI-powered catch-up/recovery plan for a student
    with low attendance.

    Considers:
        - How many classes they missed
        - Topics covered during absences
        - Their weak areas
        - Their current score

    Returns:
        Markdown-formatted recovery plan.
    """
    student = get_student(student_id)
    if not student:
        return "Student not found."

    rate = get_attendance_rate(student_id)
    streak = get_absence_streak(student_id)
    overall = get_overall_score(student_id)
    weak = get_weak_topics(student_id)
    strong = get_strong_topics(student_id)
    recent_scores = get_student_scores(student_id)[:5]

    recent_str = ", ".join([
        f"{s['topic']}: {s['score']}/{s['max_score']}"
        for s in recent_scores
    ]) if recent_scores else "No quizzes taken"

    prompt = f"""You are a compassionate and expert academic advisor.
A student needs a recovery/catch-up plan because of attendance issues.

Student: {student['name']}
Attendance Rate: {rate}%
Current Absence Streak: {streak} consecutive days
Overall Score: {overall}%
Weak Topics: {', '.join(weak) if weak else 'None identified'}
Strong Topics: {', '.join(strong) if strong else 'None identified'}
Recent Scores: {recent_str}

Create a practical, empathetic recovery plan that includes:

## 🎯 Recovery Plan for {student['name']}

### Current Situation Assessment
(brief analysis of where they stand)

### Immediate Actions (This Week)
(3-4 specific things to do right away)

### Catch-Up Schedule
(day-by-day plan for the next 2 weeks covering missed content)

### Revision Focus Areas
(specific topics to revise based on their weak areas)

### Study Tips for Catching Up
(practical advice for a student who missed classes)

### Motivation Note
(encouraging message to keep them going)

Keep the tone supportive and actionable. Don't shame them for missing classes."""

    llm = get_llm(temperature=0.7)
    return llm.invoke(prompt)


# ============================================================
#  FEATURE 4: Performance Evolution Tracking
# ============================================================

def get_performance_trend(student_id: int) -> dict:
    """
    Analyze a student's performance trajectory over time.

    Compares early scores vs recent scores to detect
    improvement or decline, per topic and overall.

    Returns:
        Dict with:
            - overall_trend: 'improving', 'declining', 'stable', 'insufficient_data'
            - overall_change: percentage change
            - topic_trends: dict of topic → {trend, early_avg, recent_avg, change}
            - summary: text description
    """
    scores = get_student_scores(student_id)

    if len(scores) < 2:
        return {
            "overall_trend": "insufficient_data",
            "overall_change": 0,
            "topic_trends": {},
            "summary": "Not enough quiz data to determine trend. Take more quizzes!",
        }

    # Split scores into halves: early vs recent
    mid = len(scores) // 2
    recent_scores = scores[:mid]  # Newest (list is ordered DESC)
    early_scores = scores[mid:]   # Oldest

    # Calculate overall averages
    def avg_pct(score_list):
        if not score_list:
            return 0
        total = sum(s["score"] for s in score_list)
        total_max = sum(s["max_score"] for s in score_list)
        return round((total / total_max) * 100, 1) if total_max > 0 else 0

    recent_avg = avg_pct(recent_scores)
    early_avg = avg_pct(early_scores)
    overall_change = round(recent_avg - early_avg, 1)

    # Determine overall trend
    if overall_change > 5:
        overall_trend = "improving"
    elif overall_change < -5:
        overall_trend = "declining"
    else:
        overall_trend = "stable"

    # Per-topic trends
    topic_trends = {}
    all_topics = set(s["topic"] for s in scores)

    for topic in all_topics:
        t_recent = [s for s in recent_scores if s["topic"] == topic]
        t_early = [s for s in early_scores if s["topic"] == topic]

        if t_recent and t_early:
            r_avg = avg_pct(t_recent)
            e_avg = avg_pct(t_early)
            change = round(r_avg - e_avg, 1)

            if change > 5:
                t_trend = "improving"
            elif change < -5:
                t_trend = "declining"
            else:
                t_trend = "stable"

            topic_trends[topic] = {
                "trend": t_trend,
                "early_avg": e_avg,
                "recent_avg": r_avg,
                "change": change,
            }

    # Build summary
    summary_parts = []
    if overall_trend == "improving":
        summary_parts.append(f"📈 Overall performance is **improving** (+{overall_change}%)")
    elif overall_trend == "declining":
        summary_parts.append(f"📉 Overall performance is **declining** ({overall_change}%)")
    else:
        summary_parts.append(f"📊 Overall performance is **stable** ({overall_change:+}%)")

    for topic, data in topic_trends.items():
        if data["trend"] == "improving":
            summary_parts.append(f"  ✅ **{topic}**: Improving (+{data['change']}%)")
        elif data["trend"] == "declining":
            summary_parts.append(f"  ⚠️ **{topic}**: Declining ({data['change']}%)")

    return {
        "overall_trend": overall_trend,
        "overall_change": overall_change,
        "early_avg": early_avg,
        "recent_avg": recent_avg,
        "topic_trends": topic_trends,
        "summary": "\n".join(summary_parts),
    }


def generate_performance_feedback(student_id: int) -> str:
    """
    Generate AI-powered feedback based on the student's performance evolution.

    Examples:
        - "Student improving in algebra"
        - "Needs more practice in calculus"

    Returns:
        Markdown-formatted performance feedback.
    """
    student = get_student(student_id)
    if not student:
        return "Student not found."

    trend_data = get_performance_trend(student_id)

    if trend_data["overall_trend"] == "insufficient_data":
        return trend_data["summary"]

    # Format topic trends for the prompt
    topic_trend_str = ""
    for topic, data in trend_data["topic_trends"].items():
        topic_trend_str += (
            f"  - {topic}: {data['trend']} "
            f"(early avg: {data['early_avg']}%, recent avg: {data['recent_avg']}%, "
            f"change: {data['change']:+}%)\n"
        )

    if not topic_trend_str:
        topic_trend_str = "  No per-topic trends available yet.\n"

    prompt = f"""You are an encouraging and insightful academic advisor.
Analyze the student's performance evolution and provide personalized feedback.

Student: {student['name']}
Overall Trend: {trend_data['overall_trend']} ({trend_data['overall_change']:+}%)
Early Average: {trend_data.get('early_avg', 'N/A')}%
Recent Average: {trend_data.get('recent_avg', 'N/A')}%

Per-Topic Trends:
{topic_trend_str}

Generate a short, personalized feedback report:

## 📊 Performance Report for {student['name']}

### Overall Trajectory
(1-2 sentences on the overall direction)

### Highlights
(topics where they're doing well or improving)

### Areas Needing Attention
(topics where they're declining or consistently low)

### Specific Recommendations
(2-3 actionable suggestions based on the trends)

Keep the tone motivating. Celebrate improvements and gently address declines."""

    llm = get_llm(temperature=0.6)
    return llm.invoke(prompt)
