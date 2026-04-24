"""
MTRX-TriAxis | AI Agent Page (Feature 6)
Multi-step AI reasoning pipeline with visible step-by-step execution.
"""

import streamlit as st
import os
from dotenv import load_dotenv

from backend.student_model import list_students, get_student
from backend.ai_agent import run_agent_pipeline
from backend.ui_components import page_header, section_header

load_dotenv()

page_header(
    "🤖", "AI Agent — Multi-Step Reasoning",
    "Sequential chain-of-thought reasoning for comprehensive, context-aware student analysis.",
    accent="#F472B6",
)

# ----- Agent Architecture Diagram -----
st.markdown(
    """
    <div style='background: #FFFFFF; border-radius: 10px; padding: 1.2rem;
                border: 1px solid #E5E7EB; margin-bottom: 1rem;'>
        <p style='text-align: center; color: #2AD699; font-weight: bold; margin-bottom: 0.8rem;'>
            🔄 Agent Pipeline Architecture
        </p>
        <div style='display: flex; justify-content: center; gap: 0.5rem; flex-wrap: wrap;
                    align-items: center;'>
            <span style='background: #F0F2F8; padding: 0.4rem 0.8rem; border-radius: 20px;
                         color: #22B07D; font-size: 0.85rem;'>
                📊 Analyze Data
            </span>
            <span style='color: #555;'>→</span>
            <span style='background: #F0F2F8; padding: 0.4rem 0.8rem; border-radius: 20px;
                         color: #22B07D; font-size: 0.85rem;'>
                🔍 RAG Retrieval
            </span>
            <span style='color: #555;'>→</span>
            <span style='background: #F0F2F8; padding: 0.4rem 0.8rem; border-radius: 20px;
                         color: #22B07D; font-size: 0.85rem;'>
                🧠 Identify Patterns
            </span>
            <span style='color: #555;'>→</span>
            <span style='background: #F0F2F8; padding: 0.4rem 0.8rem; border-radius: 20px;
                         color: #22B07D; font-size: 0.85rem;'>
                ✨ Generate Plan
            </span>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# ----- Configuration -----
students = list_students()

if not students:
    st.warning("No students registered. Add students in the Student View first.")
    st.stop()

col1, col2 = st.columns(2)

with col1:
    student_options = {f"{s['name']}": s["id"] for s in students}
    selected_student = st.selectbox("Select Student:", options=list(student_options.keys()))
    student_id = student_options[selected_student]

with col2:
    weather_city = st.text_input(
        "City for weather context (optional):",
        value=os.getenv("WEATHER_CITY", "Mumbai"),
    )

# ----- Run Agent -----
st.markdown("---")

if st.button("🚀 Run AI Agent Pipeline", type="primary", use_container_width=True):
    st.session_state.pop("agent_result", None)  # Clear previous result

    with st.status("🤖 AI Agent is thinking...", expanded=True) as status:
        # Show each step as it would execute
        st.write("📊 **Step 1:** Analyzing student data...")
        st.write("🔍 **Step 2:** Retrieving relevant curriculum...")
        st.write("🧠 **Step 3:** Identifying patterns & risks...")
        st.write("✨ **Step 4:** Generating comprehensive recommendations...")

        result = run_agent_pipeline(
            student_id=student_id,
            city=weather_city if weather_city.strip() else None,
        )

        st.session_state["agent_result"] = result

        if result.get("error"):
            status.update(label="❌ Agent encountered an error", state="error")
        else:
            status.update(label="✅ Agent pipeline complete!", state="complete")

# ----- Display Results -----
if "agent_result" in st.session_state:
    result = st.session_state["agent_result"]

    if result.get("error"):
        st.error(result["error"])
    else:
        st.markdown(f"## 📋 Report: {result['student_name']}")

        # Metadata badges
        meta = result.get("metadata", {})
        badge_col1, badge_col2, badge_col3, badge_col4 = st.columns(4)

        risk_colors = {"low": "#4CAF50", "medium": "#FF9800", "high": "#F44336", "critical": "#B71C1C"}
        trend_colors = {"improving": "#4CAF50", "stable": "#FF9800", "declining": "#F44336"}

        att_risk = meta.get("attendance_risk", "low")
        badge_col1.markdown(
            f"<div style='text-align:center; background:#FFFFFF; padding:0.5rem; "
            f"border-radius:8px; border-left:3px solid {risk_colors.get(att_risk, '#666')};'>"
            f"<small style='color:#888;'>Attendance Risk</small><br>"
            f"<strong style='color:{risk_colors.get(att_risk, '#666')};'>{att_risk.upper()}</strong>"
            f"</div>",
            unsafe_allow_html=True,
        )

        trend_val = meta.get("trend", "stable")
        badge_col2.markdown(
            f"<div style='text-align:center; background:#FFFFFF; padding:0.5rem; "
            f"border-radius:8px; border-left:3px solid {trend_colors.get(trend_val, '#666')};'>"
            f"<small style='color:#888;'>Performance</small><br>"
            f"<strong style='color:{trend_colors.get(trend_val, '#666')};'>{trend_val.upper()}</strong>"
            f"</div>",
            unsafe_allow_html=True,
        )

        badge_col3.markdown(
            f"<div style='text-align:center; background:#FFFFFF; padding:0.5rem; "
            f"border-radius:8px; border-left:3px solid #F44336;'>"
            f"<small style='color:#888;'>Risks Found</small><br>"
            f"<strong style='color:#F44336;'>{meta.get('risks_count', 0)}</strong>"
            f"</div>",
            unsafe_allow_html=True,
        )

        badge_col4.markdown(
            f"<div style='text-align:center; background:#FFFFFF; padding:0.5rem; "
            f"border-radius:8px; border-left:3px solid #FF9800;'>"
            f"<small style='color:#888;'>Weak Topics</small><br>"
            f"<strong style='color:#FF9800;'>{meta.get('weak_topics_count', 0)}</strong>"
            f"</div>",
            unsafe_allow_html=True,
        )

        st.markdown("---")

        # Step-by-step reasoning trace
        st.markdown("### 🔄 Reasoning Trace")

        for step in result.get("steps", []):
            step_icon = "✅" if step["status"] == "complete" else "🔄"

            with st.expander(f"{step_icon} {step['name']}", expanded=False):
                findings = step.get("findings", {})
                if findings:
                    for key, value in findings.items():
                        if isinstance(value, list):
                            st.markdown(f"**{key}:** {', '.join(str(v) for v in value) if value else 'None'}")
                        else:
                            st.markdown(f"**{key}:** {value}")

        # Final recommendation
        st.markdown("---")
        st.markdown("### ✨ AI Recommendation")
        st.markdown(result.get("final_recommendation", "No recommendation generated."))
