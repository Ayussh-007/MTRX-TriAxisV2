"""
MTRX-TriAxis | Student View Page
Student profile, attendance intelligence, performance evolution,
learning paths — with bulk-add and class-wide attendance grid.
"""

import streamlit as st
from datetime import date

from backend.student_model import (
    list_students, add_student, add_students_bulk, get_student,
    get_overall_score, get_attendance_rate, get_topic_scores,
    get_weak_topics, get_strong_topics, record_attendance,
    record_attendance_bulk, get_attendance_for_date,
    generate_learning_path,
)
from backend.attendance_intelligence import (
    get_attendance_status, get_attendance_history,
    generate_recovery_plan, get_performance_trend,
    generate_performance_feedback,
)
from backend.rag_pipeline import vectorstore_exists, get_available_topics
from backend.ui_components import page_header


page_header(
    "🎒", "Student Manager",
    "Add students, manage attendance, and track individual performance.",
    accent="#A78BFA",
)

# ===================================================================
# SECTION 1: ADD STUDENTS (Single + Bulk)
# ===================================================================
st.markdown("### ➕ Add Students")

add_tab_single, add_tab_bulk = st.tabs(["Single Student", "📋 Bulk Add"])

with add_tab_single:
    with st.form("add_student_form", clear_on_submit=True):
        sc1, sc2, sc3 = st.columns(3)
        with sc1:
            new_name = st.text_input("Name", placeholder="e.g., Ayush Mhatre")
        with sc2:
            new_email = st.text_input("Email (optional)", placeholder="ayush.mhatre25@sakec.ac.in")
        with sc3:
            new_login_id = st.text_input("Login ID", placeholder="e.g., AI251030",
                                         help="Unique ID for student self-service login.")
        submitted = st.form_submit_button("Add Student", type="primary")

        if submitted and new_name.strip():
            try:
                sid = add_student(new_name.strip(), new_email.strip() or None,
                                  new_login_id.strip() or None)
                st.success(f"✅ Added {new_name} (ID: {sid})")
                st.rerun()
            except Exception as e:
                st.error(f"Error: {str(e)}")

with add_tab_bulk:
    st.markdown(
        """
        <div style='background: rgba(124,111,255,0.08); border: 1px solid rgba(124,111,255,0.25);
                    border-radius: 8px; padding: 0.8rem 1rem; margin-bottom: 1rem; font-size: 0.85rem;'>
            <strong style='color: #A78BFA;'>Format:</strong> One student per line —
            <code>Name, Email, LoginID</code><br>
            <span style='color: #888;'>Email and LoginID are optional. Examples:</span><br>
            <code style='color: #ccc;'>Ayush Mhatre, ayush.mhatre25@sakec.ac.in, AI251030</code><br>
            <code style='color: #ccc;'>Riya Patel</code><br>
            <code style='color: #ccc;'>Karan Singh, , STU003</code>
        </div>
        """,
        unsafe_allow_html=True,
    )

    bulk_text = st.text_area(
        "Paste students (one per line):",
        height=160,
        placeholder="Ayush Mhatre, ayush.mhatre25@sakec.ac.in, AI251030\nRiya Patel\nKaran Singh, , STU003",
        key="sv_bulk_input",
    )

    if st.button("📋 Add All Students", type="primary", use_container_width=True, key="sv_bulk_btn"):
        if not bulk_text.strip():
            st.warning("Please enter at least one student.")
        else:
            lines = [l.strip() for l in bulk_text.strip().split("\n") if l.strip()]
            parsed = []
            for line in lines:
                parts = [p.strip() for p in line.split(",")]
                name = parts[0] if len(parts) > 0 else ""
                email = parts[1] if len(parts) > 1 else ""
                login_id = parts[2] if len(parts) > 2 else ""
                parsed.append({"name": name, "email": email, "login_id": login_id})

            results = add_students_bulk(parsed)
            added = [r for r in results if r["status"] == "added"]
            errors = [r for r in results if r["status"] == "error"]
            skipped = [r for r in results if r["status"] == "skipped"]

            if added:
                st.success(f"✅ Successfully added {len(added)} student(s)!")
            if skipped:
                st.warning(f"⚠️ Skipped {len(skipped)} empty entries.")
            if errors:
                for e in errors:
                    st.error(f"❌ {e['name']}: {e['error']}")

            if added:
                st.rerun()

st.markdown("---")

# ===================================================================
# SECTION 2: CLASS-WIDE ATTENDANCE GRID
# ===================================================================
st.markdown("### 📅 Class Attendance")

students = list_students()

if not students:
    st.info("No students registered yet. Add a student to get started.")
    st.stop()

att_date = st.date_input("Select date:", value=date.today(), key="att_grid_date")
date_str = att_date.isoformat()

# Load existing attendance for this date
existing = get_attendance_for_date(date_str)

st.markdown(
    f"""
    <div style='background: rgba(124,111,255,0.06); border: 1px solid rgba(124,111,255,0.2);
                border-radius: 10px; padding: 0.6rem 1rem; margin-bottom: 0.8rem;
                font-size: 0.85rem; color: #A78BFA;'>
        ✅ Check the box = <strong>Present</strong> &nbsp;|&nbsp;
        Unchecked = <strong>Absent</strong> &nbsp;|&nbsp;
        Date: <strong>{att_date.strftime('%A, %d %B %Y')}</strong>
    </div>
    """,
    unsafe_allow_html=True,
)

# Render the grid
att_states = {}
num_cols = 3
rows = [students[i:i + num_cols] for i in range(0, len(students), num_cols)]

for row_students in rows:
    cols = st.columns(num_cols)
    for col, s in zip(cols, row_students):
        with col:
            default_present = existing.get(s["id"], True)  # Default to present if no record
            att_states[s["id"]] = st.checkbox(
                f"{s['name']}",
                value=default_present,
                key=f"att_{s['id']}_{date_str}",
            )

# Save button
if st.button("💾 Save Attendance for All", type="primary", use_container_width=True):
    records = [
        {"student_id": sid, "date": date_str, "present": present}
        for sid, present in att_states.items()
    ]
    record_attendance_bulk(records)

    present_count = sum(1 for p in att_states.values() if p)
    absent_count = len(att_states) - present_count
    st.success(
        f"✅ Attendance saved for {att_date.strftime('%d %b %Y')}: "
        f"**{present_count}** present, **{absent_count}** absent"
    )

st.markdown("---")

# ===================================================================
# SECTION 3: PER-STUDENT DASHBOARD
# ===================================================================
st.markdown("### 👥 Student Dashboard")

student_options = {f"{s['name']} (ID: {s['id']})": s["id"] for s in students}
selected_label = st.selectbox("Choose a student:", options=list(student_options.keys()))
selected_id = student_options[selected_label]
student = get_student(selected_id)

if student:
    st.markdown(f"## 📊 Dashboard: {student['name']}")

    # Key metrics
    overall = get_overall_score(selected_id)
    attendance_rate = get_attendance_rate(selected_id)
    weak = get_weak_topics(selected_id)
    strong = get_strong_topics(selected_id)
    topic_scores = get_topic_scores(selected_id)

    # Attendance status with risk detection
    att_status = get_attendance_status(selected_id)

    # Performance trend
    trend = get_performance_trend(selected_id)
    trend_icon = {"improving": "📈", "declining": "📉", "stable": "📊",
                  "insufficient_data": "❓"}.get(trend["overall_trend"], "📊")

    # Metric cards
    m1, m2, m3, m4, m5 = st.columns(5)
    m1.metric("📈 Overall Score", f"{overall}%")
    m2.metric(
        f"{att_status['status_emoji']} Attendance",
        f"{attendance_rate}%",
        delta=f"Streak: {att_status['absence_streak']}d absent" if att_status['absence_streak'] > 0 else None,
        delta_color="inverse",
    )
    m3.metric("⚠️ Weak Topics", len(weak))
    m4.metric("✅ Strong Topics", len(strong))
    m5.metric(
        f"{trend_icon} Trend",
        trend["overall_trend"].title(),
        delta=f"{trend['overall_change']:+}%" if trend["overall_trend"] != "insufficient_data" else None,
        delta_color="normal" if trend["overall_change"] >= 0 else "inverse",
    )

    # ----- Attendance Intelligence Alert -----
    if att_status["risk_level"] in ["high", "critical"]:
        st.markdown("---")
        st.markdown(
            f"""
            <div style='background: linear-gradient(135deg, #4a0000, #1a1d29);
                        border-radius: 10px; padding: 1rem 1.2rem;
                        border: 1px solid #F44336; margin-bottom: 1rem;'>
                <span style='font-size: 1.1rem;'>⚠️ <strong style='color: #F44336;'>
                    Attendance Alert</strong></span><br>
                <span style='color: #ccc; font-size: 0.9rem;'>
                    {att_status['status']} — Attendance rate: {att_status['attendance_rate']}%
                    {f" | Absent {att_status['absence_streak']} consecutive days" if att_status['absence_streak'] > 0 else ""}
                </span>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if st.button("🩹 Generate Recovery Plan", type="primary", key="recovery_btn"):
            with st.spinner("Creating personalized catch-up plan..."):
                plan = generate_recovery_plan(selected_id)
                st.session_state[f"recovery_plan_{selected_id}"] = plan

        if f"recovery_plan_{selected_id}" in st.session_state:
            st.markdown(st.session_state[f"recovery_plan_{selected_id}"])

    # ----- Attendance History -----
    history = get_attendance_history(selected_id, days=30)
    if history:
        with st.expander("📅 Attendance History (Last 30 Days)", expanded=False):
            for record in history[:15]:
                icon = "✅" if record["present"] else "❌"
                color = "#4CAF50" if record["present"] else "#F44336"
                st.markdown(
                    f"<span style='color: {color};'>{icon} {record['date']}</span>",
                    unsafe_allow_html=True,
                )

    # ----- Performance Evolution -----
    if trend["overall_trend"] != "insufficient_data":
        st.markdown("---")
        st.markdown("### 📈 Performance Evolution")

        st.markdown(trend["summary"])

        if trend["topic_trends"]:
            for topic, data in trend["topic_trends"].items():
                if data["trend"] == "improving":
                    t_color = "#4CAF50"
                    t_icon = "📈"
                elif data["trend"] == "declining":
                    t_color = "#F44336"
                    t_icon = "📉"
                else:
                    t_color = "#FF9800"
                    t_icon = "📊"

                st.markdown(
                    f"""
                    <div style='background: #1a1d29; padding: 0.6rem 1rem; border-radius: 8px;
                                margin-bottom: 0.4rem; border-left: 3px solid {t_color};
                                display: flex; justify-content: space-between;'>
                        <span>{t_icon} {topic}</span>
                        <span style='color: {t_color};'>
                            {data['early_avg']}% → {data['recent_avg']}%
                            ({data['change']:+}%)
                        </span>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

        # AI Performance Feedback button
        if st.button("🧠 Get AI Performance Feedback", key="perf_feedback_btn"):
            with st.spinner("Analyzing performance trajectory..."):
                feedback = generate_performance_feedback(selected_id)
                st.session_state[f"perf_feedback_{selected_id}"] = feedback

        if f"perf_feedback_{selected_id}" in st.session_state:
            st.markdown(st.session_state[f"perf_feedback_{selected_id}"])

    # ----- Topic Performance -----
    if topic_scores:
        st.markdown("---")
        st.markdown("### 📊 Topic Performance")

        for topic, score in sorted(topic_scores.items(), key=lambda x: x[1]):
            if score >= 70:
                color = "#4CAF50"
                icon = "✅"
            elif score >= 50:
                color = "#FF9800"
                icon = "⚠️"
            else:
                color = "#F44336"
                icon = "❌"

            st.markdown(
                f"""
                <div style='background: #1a1d29; padding: 0.8rem 1rem; border-radius: 8px;
                            margin-bottom: 0.5rem; border-left: 4px solid {color};
                            display: flex; justify-content: space-between; align-items: center;'>
                    <span>{icon} {topic}</span>
                    <span style='color: {color}; font-weight: bold;'>{score}%</span>
                </div>
                """,
                unsafe_allow_html=True,
            )

    # ----- Personalized Learning Path -----
    st.markdown("---")
    st.markdown("### 🎯 Personalized Learning Path")

    if st.button("🧠 Generate Learning Path", type="primary", use_container_width=True):
        with st.spinner("Analyzing your performance and creating a plan..."):
            available = []
            if vectorstore_exists():
                try:
                    available = get_available_topics()
                except Exception:
                    pass

            path = generate_learning_path(selected_id, available)
            st.session_state[f"learning_path_{selected_id}"] = path

    if f"learning_path_{selected_id}" in st.session_state:
        st.markdown(st.session_state[f"learning_path_{selected_id}"])
