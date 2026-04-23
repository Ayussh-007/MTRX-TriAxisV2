"""
MTRX-TriAxis | Stage 5: Teacher Insights
Aggregates student performance data and generates teaching suggestions.
"""

from backend.student_model import (
    list_students,
    get_overall_score,
    get_attendance_rate,
    get_class_topic_averages,
    get_class_weak_topics,
    get_class_attendance_rate,
    get_weak_topics,
)
from backend.llm_utils import get_llm
from backend.weather_context import get_weather, get_context_suggestion
from backend.teacher_feedback import build_style_context
from prompts.teacher_suggestion import get_prompt as get_suggestion_prompt


def get_class_performance() -> dict:
    """
    Aggregate class-level performance stats.

    Returns:
        Dict with:
            - num_students: total enrolled students
            - class_avg: average score percentage across all students
            - avg_attendance: average attendance rate
            - per_student: list of per-student summaries
            - topic_breakdown: per-topic averages
    """
    students = list_students()
    num_students = len(students)

    if num_students == 0:
        return {
            "num_students": 0,
            "class_avg": 0.0,
            "avg_attendance": 0.0,
            "per_student": [],
            "topic_breakdown": {},
        }

    # Per-student details
    per_student = []
    total_scores = []

    for student in students:
        sid = student["id"]
        score = get_overall_score(sid)
        attendance = get_attendance_rate(sid)
        total_scores.append(score)

        per_student.append({
            "id": sid,
            "name": student["name"],
            "overall_score": score,
            "attendance_rate": attendance,
        })

    # Class averages
    class_avg = round(sum(total_scores) / len(total_scores), 1) if total_scores else 0.0
    avg_attendance = get_class_attendance_rate()

    # Topic breakdown
    topic_breakdown = get_class_topic_averages()

    return {
        "num_students": num_students,
        "class_avg": class_avg,
        "avg_attendance": avg_attendance,
        "per_student": per_student,
        "topic_breakdown": topic_breakdown,
    }


def get_weak_topics_across_class(threshold: float = 50.0) -> list[dict]:
    """
    Identify topics where the class average is below the threshold.

    Returns:
        List of dicts: [{topic, average, students_tested}, ...]
    """
    topic_data = get_class_topic_averages()

    weak = []
    for topic, data in topic_data.items():
        if data["average"] < threshold:
            weak.append({
                "topic": topic,
                "average": data["average"],
                "students_tested": data["students_tested"],
            })

    # Sort by average ascending (worst first)
    weak.sort(key=lambda x: x["average"])
    return weak


def get_strong_topics_across_class(threshold: float = 70.0) -> list[str]:
    """Get topics where class average exceeds the threshold."""
    topic_data = get_class_topic_averages()
    strong = [
        topic for topic, data in topic_data.items()
        if data["average"] >= threshold
    ]
    return strong


def get_student_risk_data() -> list[dict]:
    """
    Calculate a composite risk score for every student.

    Risk factors (each normalised to 0–100, higher = worse):
        - Score risk: 100 − overall_score%
        - Attendance risk: 100 − attendance%
        - Weak-topic risk: (number of weak topics / 5) * 100, capped at 100

    Composite risk = weighted average: 40% score + 35% attendance + 25% weak-topics.

    Returns:
        Sorted list of dicts (highest risk first):
        [{name, overall_score, attendance, weak_count, risk_score, risk_level}, ...]
    """
    students = list_students()
    if not students:
        return []

    results = []
    for s in students:
        sid = s["id"]
        score = get_overall_score(sid)
        attendance = get_attendance_rate(sid)
        weak = get_weak_topics(sid)
        weak_count = len(weak)

        score_risk = 100 - score
        att_risk = 100 - attendance
        weak_risk = min((weak_count / 5) * 100, 100)

        risk_score = round(0.40 * score_risk + 0.35 * att_risk + 0.25 * weak_risk, 1)

        if risk_score >= 70:
            risk_level = "critical"
        elif risk_score >= 50:
            risk_level = "high"
        elif risk_score >= 30:
            risk_level = "medium"
        else:
            risk_level = "low"

        results.append({
            "id": sid,
            "name": s["name"],
            "overall_score": score,
            "attendance": attendance,
            "weak_count": weak_count,
            "risk_score": risk_score,
            "risk_level": risk_level,
        })

    results.sort(key=lambda x: x["risk_score"], reverse=True)
    return results


def generate_teaching_suggestions(city: str = None) -> str:
    """
    Generate AI-powered teaching suggestions based on class performance
    and weather context.

    Args:
        city: City for weather context. If None, weather is skipped.

    Returns:
        Markdown-formatted teaching suggestions.
    """
    # Gather class data
    performance = get_class_performance()
    weak_topics = get_weak_topics_across_class()
    strong_topics = get_strong_topics_across_class()

    # Format topic breakdown
    topic_breakdown_str = "\n".join([
        f"  - {topic}: {data['average']}% (tested {data['students_tested']} students)"
        for topic, data in performance["topic_breakdown"].items()
    ]) if performance["topic_breakdown"] else "No quiz data available yet"

    # Weather context
    weather_context = "Not available"
    if city:
        try:
            weather_data = get_weather(city)
            if weather_data:
                weather_context = (
                    f"{weather_data['description'].title()}, "
                    f"{weather_data['temp']}°C, "
                    f"Humidity: {weather_data['humidity']}%"
                )
                # Add weather-based suggestion
                weather_suggestion = get_context_suggestion(weather_data)
                if weather_suggestion:
                    weather_context += f"\nWeather Advice: {weather_suggestion}"
        except Exception as e:
            weather_context = f"Error fetching weather: {str(e)}"

    # Get teacher style context (Feature 1 integration)
    style_context = build_style_context()

    # Append teacher style to weather context for the prompt
    full_context = weather_context
    if style_context and "No teacher preferences" not in style_context:
        full_context += f"\n\nTeacher Style Preferences:\n{style_context}"

    # Build prompt
    llm = get_llm(temperature=0.7)
    prompt = get_suggestion_prompt()
    chain = prompt | llm

    result = chain.invoke({
        "num_students": str(performance["num_students"]),
        "class_avg": str(performance["class_avg"]),
        "avg_attendance": str(performance["avg_attendance"]),
        "weak_topics": ", ".join([w["topic"] for w in weak_topics]) if weak_topics else "None identified",
        "strong_topics": ", ".join(strong_topics) if strong_topics else "None identified",
        "topic_breakdown": topic_breakdown_str,
        "weather_context": full_context,
    })

    return result
