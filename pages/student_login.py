"""
MTRX-TriAxis | Student Login Page
Simple authentication page for students using name + login ID.
"""

import streamlit as st
from backend.auth import authenticate_student, login_student, is_student_logged_in


# If already logged in, redirect
if is_student_logged_in():
    st.success("✅ You are already logged in!")
    st.page_link("pages/student_portal.py", label="Go to Student Portal →", icon="🎒")
    st.stop()

# ── Hero ──────────────────────────────────────────────────────
st.markdown(
    """
    <style>
    @keyframes glow {
        0%, 100% { box-shadow: 0 0 20px rgba(124,111,255,0.3); }
        50%       { box-shadow: 0 0 40px rgba(124,111,255,0.6); }
    }
    </style>
    <div style='text-align:center; padding:2.5rem 0 1.5rem 0;'>
        <div style='
            display:inline-flex; width:80px; height:80px;
            background:linear-gradient(135deg,#7C6FFF,#A78BFA);
            border-radius:20px; align-items:center; justify-content:center;
            font-size:2.5rem; margin-bottom:1rem;
            animation: glow 2.5s ease-in-out infinite;
        '>🔐</div>
        <h1 style='font-size:2rem; font-weight:800; color:#E8EAF0; margin:0 0 0.3rem 0;'>
            Student Login
        </h1>
        <p style='color:#6B7280; font-size:0.95rem; margin:0;'>
            Enter your credentials to access your learning portal
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

st.markdown("<hr>", unsafe_allow_html=True)

# ── Login Form (centred) ──────────────────────────────────────
col_l, col_c, col_r = st.columns([1, 2, 1])

with col_c:
    st.markdown(
        """
        <div style='
            background: linear-gradient(135deg, #12151F, #1A1D2E);
            border: 1px solid #252840;
            border-radius: 16px;
            padding: 2rem 1.8rem;
            margin-bottom: 1rem;
        '>
        """,
        unsafe_allow_html=True,
    )

    st.markdown(
        "<p style='font-size:0.85rem; font-weight:700; color:#A78BFA; margin-bottom:1rem; "
        "text-transform:uppercase; letter-spacing:0.5px;'>📝 Login Details</p>",
        unsafe_allow_html=True,
    )

    with st.form("student_login_form"):
        login_name = st.text_input(
            "Your Name",
            placeholder="e.g., Ayush Mhatre",
            help="Enter your full name as registered by your teacher.",
        )
        login_id = st.text_input(
            "Student ID",
            placeholder="e.g., AI251030",
            help="Enter the unique ID given to you by your teacher.",
        )
        st.markdown("<br>", unsafe_allow_html=True)
        submitted = st.form_submit_button("🚀 Login", type="primary", use_container_width=True)

        if submitted:
            if not login_name.strip() or not login_id.strip():
                st.error("Please enter both your name and student ID.")
            else:
                student = authenticate_student(login_name, login_id)
                if student:
                    login_student(student)
                    st.success(f"✅ Welcome, {student['name']}!")
                    st.balloons()
                    st.switch_page("pages/student_portal.py")
                else:
                    st.error(
                        "❌ Login failed. Please check your name and Student ID.\n\n"
                        "Contact your teacher if you don't have a login ID."
                    )

    st.markdown("</div>", unsafe_allow_html=True)

    # Help note
    st.markdown(
        """
        <div style='text-align:center; padding:0.8rem 0; color:#6B7280; font-size:0.82rem;'>
            🤔 <strong style='color:#9CA3AF;'>Don't have a Student ID?</strong><br>
            Ask your teacher to register you and provide your unique login ID.
        </div>
        """,
        unsafe_allow_html=True,
    )
