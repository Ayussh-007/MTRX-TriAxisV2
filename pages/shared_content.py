"""
MTRX-TriAxis | Shared Content Viewer
Handles shared content links via ?share=<id> query parameter.
Students must be logged in to view shared content.
"""

import streamlit as st

from backend.auth import get_logged_in_student, is_student_logged_in
from backend.content_sharing import get_shared_content, mark_content_accessed


st.markdown("# 📎 Shared Content")
st.markdown("---")

# Read share_id from query params
params = st.query_params
share_id = params.get("share", None)

if not share_id:
    st.info("No content link provided. Ask your teacher for a share link.")
    st.caption("Share links look like: `?share=<content-id>`")
    st.stop()

# ----- Auth Check -----
if not is_student_logged_in():
    st.warning("🔒 Please login to view shared content.")
    st.page_link("pages/student_login.py", label="Login →", icon="🔐")
    st.stop()

student = get_logged_in_student()

# ----- Load Content -----
content = get_shared_content(share_id)

if not content:
    st.error("❌ Content not found. The link may be invalid or expired.")
    st.stop()

# Check if content is restricted to a specific student
if content.get("assigned_to") and content["assigned_to"] != student["id"]:
    st.error("🚫 This content is not assigned to you.")
    st.stop()

# Mark as accessed
mark_content_accessed(share_id, student["id"])

# ----- Display Content -----
content_type = content["content_type"]
data = content["content_data"]

type_labels = {
    "quiz": ("📝", "Quiz"),
    "learning_path": ("🎯", "Learning Path"),
    "doubt_sheet": ("📋", "Doubt Resolution Sheet"),
}

emoji, label = type_labels.get(content_type, ("📄", "Content"))

st.markdown(
    f"""
    <div style='background: #FFFFFF;
                border-radius: 12px; padding: 1.5rem; border: 1px solid #E5E7EB;
                margin-bottom: 1rem;'>
        <span style='font-size: 2rem;'>{emoji}</span>
        <h3 style='color: #22B07D; margin-top: 0.5rem;'>{label}</h3>
        <p style='color: #9CA3AF; font-size: 0.85rem;'>
            Shared on {content.get('created_at', 'Unknown date')[:10]}
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

# ----- Render based on content type -----
if content_type == "quiz":
    st.markdown(f"### 📝 Quiz: {data.get('topic', 'Unknown Topic')}")
    questions = data.get("questions", [])

    if not questions:
        st.warning("No questions in this quiz.")
    else:
        st.info(f"This quiz has **{len(questions)} questions**.")
        st.caption("Go to the Quiz page to attempt it with score tracking.")

        for i, q in enumerate(questions):
            st.markdown(
                f"""
                <div style='background: #FFFFFF; border-radius: 10px; padding: 1rem;
                            margin-bottom: 0.8rem; border: 1px solid #E5E7EB;'>
                    <strong style='color: #2AD699;'>Q{i + 1}.</strong> {q.get('question', '')}
                </div>
                """,
                unsafe_allow_html=True,
            )

            options = q.get("options", {})
            for key, val in options.items():
                st.markdown(f"  **{key}.** {val}")

elif content_type == "doubt_sheet":
    st.markdown(data.get("content", "No content available."))

elif content_type == "learning_path":
    st.markdown(data.get("content", "No content available."))

else:
    st.json(data)
