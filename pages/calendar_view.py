"""
MTRX-TriAxis | Calendar View Page
Teacher-facing calendar with holiday awareness and AI teaching suggestions.
"""

import streamlit as st
from datetime import date, timedelta
import calendar

from backend.calendar_planner import (
    get_month_calendar,
    get_holidays_for_month,
    get_upcoming_holidays,
    is_holiday_today,
    get_teaching_suggestion_for_date,
    INDIAN_HOLIDAYS,
)
from backend.ui_components import page_header

page_header(
    "📅", "Calendar & Planning",
    "Plan your teaching schedule with holiday awareness and AI suggestions.",
    accent="#4ADE80",
)

today = date.today()

# ----- Today's Status -----
today_status = is_holiday_today()

if today_status["is_holiday"]:
    st.markdown(
        f"""
        <div style='background: linear-gradient(135deg, #FEE2E2, #FECACA);
                    border-radius: 10px; padding: 1rem 1.2rem;
                    margin-bottom: 1rem; border: 1px solid #FCA5A5;'>
            <span style='font-size: 1.1rem; color: #991B1B;'>
                🎉 <strong>Today is {today_status['name']}!</strong>
            </span><br>
            <span style='font-size: 0.85rem; color: #B91C1C;'>
                Consider revision-focused or lighter activities if students are present.
            </span>
        </div>
        """,
        unsafe_allow_html=True,
    )
else:
    st.markdown(
        f"""
        <div style='background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
                    border-radius: 10px; padding: 0.8rem 1.2rem;
                    margin-bottom: 1rem; border: 1px solid #93C5FD;'>
            <span style='font-size: 0.95rem; color: #1A1D2E;'>
                📆 <strong>{today.strftime('%A, %B %d, %Y')}</strong> — Regular teaching day
            </span>
        </div>
        """,
        unsafe_allow_html=True,
    )

# ----- Upcoming Holidays -----
upcoming = get_upcoming_holidays(days_ahead=30)

if upcoming:
    st.markdown("### 🎯 Upcoming Holidays")
    for h in upcoming:
        if h["days_until"] == 0:
            badge = "🔴 TODAY"
            badge_color = "#F44336"
        elif h["days_until"] <= 3:
            badge = f"⚠️ In {h['days_until']} day(s)"
            badge_color = "#FF9800"
        else:
            badge = f"📅 In {h['days_until']} day(s)"
            badge_color = "#2AD699"

        st.markdown(
            f"""
            <div style='background: #FFFFFF; padding: 0.6rem 1rem; border-radius: 8px;
                        margin-bottom: 0.4rem; border-left: 4px solid {badge_color};
                        display: flex; justify-content: space-between; align-items: center;'>
                <span>🗓️ <strong>{h['name']}</strong>
                    <span style='color: #9CA3AF; font-size: 0.85rem;'>
                        — {h['day_of_week']}, {h['date']}
                    </span>
                </span>
                <span style='color: {badge_color}; font-weight: bold; font-size: 0.85rem;'>
                    {badge}
                </span>
            </div>
            """,
            unsafe_allow_html=True,
        )
    st.markdown("---")

# ----- Month Calendar Grid -----
st.markdown("### 📅 Month View")

# Month/year selector
nav_col1, nav_col2, nav_col3 = st.columns([1, 2, 1])

with nav_col1:
    cal_month = st.selectbox(
        "Month",
        options=list(range(1, 13)),
        index=today.month - 1,
        format_func=lambda m: calendar.month_name[m],
    )

with nav_col2:
    cal_year = st.number_input("Year", min_value=2024, max_value=2030, value=today.year)

# Get calendar data
weeks = get_month_calendar(cal_year, cal_month)
month_holidays = get_holidays_for_month(cal_year, cal_month)
holiday_days = {h["day"] for h in month_holidays}

# Render calendar grid as HTML
day_headers = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

cal_html = """
<div style='overflow-x: auto; margin: 1rem 0;'>
<table style='width: 100%; border-collapse: collapse; font-family: monospace;'>
<tr>
"""
for dh in day_headers:
    weekend = "color: #F44336;" if dh in ["Sat", "Sun"] else "color: #2AD699;"
    cal_html += f"<th style='padding: 8px; text-align: center; {weekend} font-size: 0.85rem;'>{dh}</th>"
cal_html += "</tr>"

for week in weeks:
    cal_html += "<tr>"
    for i, day in enumerate(week):
        if day == 0:
            cal_html += "<td style='padding: 8px; text-align: center;'>·</td>"
        else:
            # Determine cell styling
            is_today = (cal_year == today.year and cal_month == today.month and day == today.day)
            is_hol = day in holiday_days
            is_weekend = i >= 5  # Saturday or Sunday

            if is_today:
                bg = "background: #2AD699; color: white; border-radius: 50%; font-weight: bold;"
            elif is_hol:
                bg = "background: #FEE2E2; color: #B91C1C; border-radius: 6px;"
            elif is_weekend:
                bg = "color: #F44336;"
            else:
                bg = "color: #4B5563;"

            cal_html += (
                f"<td style='padding: 8px; text-align: center; {bg} font-size: 0.9rem;'>"
                f"{day}</td>"
            )
    cal_html += "</tr>"

cal_html += "</table></div>"

st.markdown(cal_html, unsafe_allow_html=True)

# Legend
st.markdown(
    """
    <div style='display: flex; gap: 1.5rem; justify-content: center;
                font-size: 0.8rem; color: #9CA3AF; margin-top: 0.5rem;'>
        <span>🟢 Today</span>
        <span>🔴 Holiday</span>
        <span style='color: #F44336;'>● Weekend</span>
    </div>
    """,
    unsafe_allow_html=True,
)

# Holiday list for this month
if month_holidays:
    st.markdown(f"**Holidays in {calendar.month_name[cal_month]}:**")
    for h in month_holidays:
        st.markdown(f"- 🗓️ **{h['name']}** — {h['day_of_week']}, {h['date']}")

# ----- AI Teaching Suggestion -----
st.markdown("---")
st.markdown("### 🧠 AI Planning Suggestion")

if st.button("💡 Get AI Teaching Suggestion for Today", type="primary", use_container_width=True):
    with st.spinner("Analyzing calendar context..."):
        suggestion = get_teaching_suggestion_for_date()
        st.session_state["calendar_suggestion"] = suggestion

if "calendar_suggestion" in st.session_state:
    st.markdown(st.session_state["calendar_suggestion"])
