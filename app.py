"""
MTRX-TriAxis | AI-Powered Classroom Assistant
Main Streamlit entrypoint with multi-page navigation.
Teacher-first system with controlled student access.
"""

import streamlit as st

# ----- Page Configuration -----
st.set_page_config(
    page_title="MTRX-TriAxis | AI Classroom",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ----- Inject Global Styles -----
from backend.ui_styles import inject_global_styles
inject_global_styles()

# ----- Initialize Database on First Run -----
if "db_initialized" not in st.session_state:
    from backend.student_model import init_database
    init_database()
    st.session_state.db_initialized = True

# ----- Define Pages -----
home_page         = st.Page("pages/home.py",           title="Home",             icon="🏠", default=True)
pdf_page          = st.Page("pages/pdf_upload.py",     title="Upload Curriculum", icon="📄")
student_mgmt_page = st.Page("pages/student_view.py",   title="Student Manager",   icon="🎒")
quiz_page         = st.Page("pages/quiz.py",           title="Quiz Generator",    icon="📝")
teacher_page      = st.Page("pages/teacher_dashboard.py", title="Teacher Dashboard", icon="👩‍🏫")
calendar_page     = st.Page("pages/calendar_view.py",  title="Calendar & Planning", icon="📅")
slide_page        = st.Page("pages/slide_maker.py",    title="Lesson Slide Maker", icon="🖥️")
agent_page        = st.Page("pages/ai_agent.py",       title="AI Agent",          icon="🤖")
login_page        = st.Page("pages/student_login.py",  title="Student Login",     icon="🔐")
portal_page       = st.Page("pages/student_portal.py", title="Student Portal",    icon="🎒")
shared_page       = st.Page("pages/shared_content.py", title="Shared Content",    icon="📎")

# ----- Navigation -----
pg = st.navigation(
    {
        "🏠 Main":     [home_page],
        "👩‍🏫 Teacher":  [pdf_page, student_mgmt_page, quiz_page, teacher_page, calendar_page, slide_page],
        "🤖 AI Tools": [agent_page],
        "🎒 Student":  [login_page, portal_page, shared_page],
    }
)

# ----- Sidebar -----
with st.sidebar:
    # ── Brand Block ──────────────────────────────
    st.markdown(
        """
        <div style='
            display: flex;
            align-items: center;
            gap: 0.7rem;
            padding: 0.3rem 0 0.8rem 0;
        '>
            <div style='
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 38px; height: 38px;
                background: linear-gradient(135deg, #2AD699, #22B07D);
                border-radius: 10px;
                font-size: 1.2rem;
                box-shadow: 0 4px 14px rgba(42,214,153,0.25);
                flex-shrink: 0;
            '>🎓</div>
            <div>
                <div style='
                    font-size: 1rem;
                    font-weight: 800;
                    letter-spacing: -0.3px;
                    background: linear-gradient(135deg, #2AD699, #1A9068);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    line-height: 1.2;
                '>MTRX-TriAxis</div>
                <div style='font-size: 0.62rem; color: #9CA3AF; letter-spacing: 0.4px;
                            text-transform: uppercase; line-height: 1;'>AI Classroom</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown("<div style='border-top:1px solid #E5E7EB; margin: 0 0 0.6rem 0;'></div>", unsafe_allow_html=True)

    # ── Role Badge ───────────────────────────────
    from backend.auth import is_student_logged_in, get_logged_in_student
    if is_student_logged_in():
        student = get_logged_in_student()
        st.markdown(
            f"""
            <div style='
                background: rgba(34,197,94,0.08);
                border: 1px solid rgba(34,197,94,0.2);
                border-radius: 10px;
                padding: 0.55rem 0.8rem;
                margin-bottom: 0.5rem;
                display: flex; align-items: center; gap: 0.5rem;
            '>
                <span style='font-size: 1rem;'>🎒</span>
                <div>
                    <div style='color:#22C55E; font-size:0.7rem; font-weight:700;
                                text-transform:uppercase; letter-spacing:0.4px;'>Student</div>
                    <div style='color:#1A1D2E; font-size:0.85rem; font-weight:600;'>{student['name']}</div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            """
            <div style='
                background: rgba(42,214,153,0.08);
                border: 1px solid rgba(42,214,153,0.2);
                border-radius: 10px;
                padding: 0.55rem 0.8rem;
                margin-bottom: 0.5rem;
                display: flex; align-items: center; gap: 0.5rem;
            '>
                <span style='font-size: 1rem;'>👩‍🏫</span>
                <div>
                    <div style='color:#22B07D; font-size:0.7rem; font-weight:700;
                                text-transform:uppercase; letter-spacing:0.4px;'>Mode</div>
                    <div style='color:#1A1D2E; font-size:0.85rem; font-weight:600;'>Teacher</div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<div style='border-top:1px solid #E5E7EB; margin: 0.5rem 0;'></div>", unsafe_allow_html=True)

    # ── System Status Cards ───────────────────────
    st.markdown(
        "<span style='font-size:0.7rem; color:#9CA3AF; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;'>System Status</span>",
        unsafe_allow_html=True,
    )

    from backend.llm_utils import check_ollama_connection
    from backend.rag_pipeline import vectorstore_exists

    ollama_ok = check_ollama_connection()
    vc_ok     = vectorstore_exists()

    # Ollama indicator
    if ollama_ok:
        st.markdown(
            """
            <div style='background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.2);
                        border-radius:8px; padding:0.4rem 0.7rem; margin:0.3rem 0;
                        display:flex; align-items:center; gap:0.5rem;'>
                <span style='color:#22C55E; font-size:0.9rem;'>●</span>
                <span style='color:#1A1D2E; font-size:0.82rem; font-weight:500;'>Ollama Connected</span>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            """
            <div style='background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.2);
                        border-radius:8px; padding:0.4rem 0.7rem; margin:0.3rem 0;
                        display:flex; align-items:center; gap:0.5rem;'>
                <span style='color:#EF4444; font-size:0.9rem;'>●</span>
                <span style='color:#1A1D2E; font-size:0.82rem; font-weight:500;'>Ollama Offline</span>
            </div>
            """,
            unsafe_allow_html=True,
        )
        st.caption("Run `ollama serve` in terminal")

    # Vector store indicator
    if vc_ok:
        st.markdown(
            """
            <div style='background:rgba(42,214,153,0.06); border:1px solid rgba(42,214,153,0.2);
                        border-radius:8px; padding:0.4rem 0.7rem; margin:0.3rem 0;
                        display:flex; align-items:center; gap:0.5rem;'>
                <span style='color:#2AD699; font-size:0.9rem;'>📚</span>
                <span style='color:#1A1D2E; font-size:0.82rem; font-weight:500;'>Curriculum Loaded</span>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            """
            <div style='background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2);
                        border-radius:8px; padding:0.4rem 0.7rem; margin:0.3rem 0;
                        display:flex; align-items:center; gap:0.5rem;'>
                <span style='color:#F59E0B; font-size:0.9rem;'>📚</span>
                <span style='color:#1A1D2E; font-size:0.82rem; font-weight:500;'>No Curriculum Yet</span>
            </div>
            """,
            unsafe_allow_html=True,
        )
        st.caption("Upload a PDF to get started")

    # ── Footer ───────────────────────────────────────────
    st.markdown("<div style='height: 2rem;'></div>", unsafe_allow_html=True)
    st.markdown(
        """
        <div style='text-align:center; color:#9CA3AF; font-size:0.7rem;
                    padding: 0.8rem 0; border-top: 1px solid #E5E7EB;'>
            MTRX-TriAxis v2.0 · Built with ❤️
        </div>
        """,
        unsafe_allow_html=True,
    )

# ----- Run Selected Page -----
pg.run()
