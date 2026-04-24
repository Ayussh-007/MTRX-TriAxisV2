"""
MTRX-TriAxis | Quiz Page
Teacher generates quizzes, previews them, and shares to students for solving.
"""

import streamlit as st

from backend.quiz_engine import generate_quiz
from backend.student_model import list_students
from backend.rag_pipeline import vectorstore_exists, get_available_topics
from backend.content_sharing import create_share_link, assign_content_to_student
from backend.ui_components import page_header


page_header(
    "📝", "Quiz Generator",
    "Generate quizzes and share them with your students for solving.",
    accent="#6EE7B7",
)

# ----- Check Prerequisites -----
if not vectorstore_exists():
    st.warning("⚠️ No curriculum loaded. Please upload a PDF first.")
    st.page_link("pages/pdf_upload.py", label="Go to Upload Page", icon="📄")
    st.stop()

students = list_students()
if not students:
    st.warning("⚠️ No students registered. Please add a student first.")
    st.page_link("pages/student_view.py", label="Go to Student View", icon="🎒")
    st.stop()

# ----- Quiz Configuration -----
st.markdown("### ⚙️ Quiz Settings")

config_col1, config_col2 = st.columns(2)

with config_col1:
    # Topic input — try to get available topics
    available_topics = []
    try:
        available_topics = get_available_topics()
    except Exception:
        pass

    if available_topics:
        topic = st.selectbox("Select Topic:", options=available_topics)
    else:
        topic = st.text_input("Enter Topic:", placeholder="e.g., Newton's Laws of Motion")

with config_col2:
    num_questions = st.slider("Number of Questions:", min_value=3, max_value=10, value=5)

# ----- Generate Quiz -----
st.markdown("---")

if st.button("🎲 Generate Quiz", type="primary", use_container_width=True):
    if not topic:
        st.warning("Please enter or select a topic.")
    else:
        with st.spinner(f"Generating {num_questions} questions on '{topic}'..."):
            quiz = generate_quiz(topic, num_questions)

        if quiz.get("error"):
            st.error(quiz["error"])
        elif quiz["questions"]:
            st.session_state["generated_quiz"] = quiz
            st.session_state["quiz_shared"] = False
            st.success(f"✅ Generated {len(quiz['questions'])} questions!")
            st.rerun()
        else:
            st.error("Failed to generate quiz. Try a different topic.")

# ----- Preview Generated Quiz (read-only for teacher) -----
if "generated_quiz" in st.session_state:
    quiz = st.session_state["generated_quiz"]

    st.markdown(f"### 📋 Quiz Preview: {quiz['topic']}")
    st.caption(f"Quiz ID: {quiz['quiz_id']} | Questions: {len(quiz['questions'])}")
    st.markdown("---")

    for i, q in enumerate(quiz["questions"]):
        options = q.get("options", {})
        correct = q.get("correct", "")

        st.markdown(
            f"""
            <div style='background: #FFFFFF; border-radius: 10px; padding: 1.2rem;
                        margin-bottom: 0.5rem; border: 1px solid #E5E7EB;'>
                <strong style='color: #2AD699;'>Q{i + 1}.</strong> {q['question']}
            </div>
            """,
            unsafe_allow_html=True,
        )

        for key, val in options.items():
            is_correct = key.upper() == correct.upper()
            badge = " ✅" if is_correct else ""
            color = "#4CAF50" if is_correct else "#4B5563"
            st.markdown(
                f"<span style='color: {color}; margin-left: 1.2rem;'>"
                f"**{key}.** {val}{badge}</span>",
                unsafe_allow_html=True,
            )

        if q.get("explanation"):
            st.caption(f"💡 {q['explanation']}")

        st.markdown("")

    # ----- Share with Students -----
    if not st.session_state.get("quiz_shared", False):
        st.markdown("---")
        st.markdown("### 📤 Share Quiz with Students")

        # Student selection
        student_names = ["All Students"] + [f"{s['name']} (ID: {s['id']})" for s in students]
        selected_targets = st.multiselect(
            "Select students to share with:",
            options=student_names,
            default=["All Students"],
            help="Choose specific students or 'All Students' to assign the quiz to everyone.",
        )

        if st.button("📤 Share Quiz", type="primary", use_container_width=True):
            # Determine target student IDs
            if "All Students" in selected_targets:
                target_ids = [s["id"] for s in students]
            else:
                target_ids = []
                for label in selected_targets:
                    try:
                        sid = int(label.split("ID: ")[1].rstrip(")"))
                        target_ids.append(sid)
                    except (IndexError, ValueError):
                        pass

            if not target_ids:
                st.warning("No students selected.")
            else:
                # Create a shared quiz link
                quiz_data = {
                    "quiz_id": quiz["quiz_id"],
                    "topic": quiz["topic"],
                    "questions": quiz["questions"],
                }
                share_id = create_share_link(
                    content_type="quiz",
                    content_data=quiz_data,
                )

                # Assign to each target student
                for sid in target_ids:
                    assign_content_to_student(share_id, sid)

                st.session_state["quiz_shared"] = True

                # Build student name list for display
                if "All Students" in selected_targets:
                    names_display = "All Students"
                else:
                    names_display = ", ".join(selected_targets)

                st.success(
                    f"✅ Quiz shared with **{len(target_ids)}** student(s): {names_display}\n\n"
                    f"Students can solve it in their **Student Portal → Assignments** tab."
                )
                st.balloons()

    else:
        st.markdown("---")
        st.markdown(
            """
            <div style='background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.3);
                        border-radius: 10px; padding: 1rem 1.2rem; text-align: center;'>
                <span style='font-size: 1.5rem;'>✅</span><br>
                <strong style='color: #22C55E;'>Quiz has been shared with students!</strong><br>
                <span style='color: #9CA3AF; font-size: 0.85rem;'>
                    Students can solve it in their Student Portal → Assignments tab.
                </span>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # New quiz button
    st.markdown("---")
    if st.button("🔄 Generate Another Quiz", use_container_width=True):
        for key in ["generated_quiz", "quiz_shared"]:
            st.session_state.pop(key, None)
        st.rerun()
