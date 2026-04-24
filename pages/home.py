"""
MTRX-TriAxis | Home Page
Welcome page with animated hero, feature showcase, and quick-start guide.
"""

import streamlit as st
from backend.student_model import list_students
from backend.rag_pipeline import vectorstore_exists
from backend.llm_utils import check_ollama_connection

# ── Status ──────────────────────────────────────────────────
students     = list_students()
vc_ready     = vectorstore_exists()
ollama_ready = check_ollama_connection()

# ── Hero ─────────────────────────────────────────────────────
st.markdown(
    """
    <style>
    @keyframes gradientShift {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-8px); }
    }
    @keyframes fadeUp {
        from { opacity:0; transform: translateY(20px); }
        to   { opacity:1; transform: translateY(0); }
    }
    .hero-wrapper {
        background: linear-gradient(-45deg, #FFFFFF, #F0FFF8, #E8FBF1, #F5F6FA);
        background-size: 400% 400%;
        animation: gradientShift 10s ease infinite;
        border-radius: 20px;
        border: 1px solid #E5E7EB;
        padding: 3.5rem 2rem 3rem 2rem;
        text-align: center;
        margin-bottom: 2rem;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    }
    .hero-wrapper::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(ellipse at center,
            rgba(42,214,153,0.06) 0%,
            transparent 60%);
        pointer-events: none;
    }
    .hero-icon {
        font-size: 4.5rem;
        animation: float 3.5s ease-in-out infinite;
        display: inline-block;
        filter: drop-shadow(0 0 18px rgba(42,214,153,0.35));
    }
    .hero-title {
        font-size: 3rem;
        font-weight: 800;
        background: linear-gradient(135deg, #2AD699, #1A9068, #22B07D);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0.5rem 0 0.3rem 0;
        letter-spacing: -1px;
        animation: fadeUp 0.8s ease forwards;
    }
    .hero-subtitle {
        font-size: 1.15rem;
        color: #6B7280;
        margin: 0;
        font-weight: 400;
        animation: fadeUp 0.8s 0.2s ease both;
    }
    .hero-badges {
        display: flex;
        justify-content: center;
        gap: 0.7rem;
        flex-wrap: wrap;
        margin-top: 1.5rem;
        animation: fadeUp 0.8s 0.4s ease both;
    }
    .badge {
        background: rgba(42,214,153,0.1);
        border: 1px solid rgba(42,214,153,0.25);
        border-radius: 20px;
        padding: 0.3rem 0.9rem;
        font-size: 0.78rem;
        font-weight: 600;
        color: #1A9068;
        letter-spacing: 0.3px;
    }
    </style>

    <div class="hero-wrapper">
        <div class="hero-icon">🎓</div>
        <h1 class="hero-title">MTRX-TriAxis</h1>
        <p class="hero-subtitle">AI-Powered Classroom Assistant — smarter teaching, personalised learning.</p>
        <div class="hero-badges">
            <span class="badge">🧠 LLM-Powered</span>
            <span class="badge">📚 RAG Curriculum</span>
            <span class="badge">📊 Real-time Analytics</span>
            <span class="badge">🌤️ Weather-Aware</span>
            <span class="badge">🤖 Multi-Step Agent</span>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# ── Status Banner ─────────────────────────────────────────────
_icons  = lambda ok: ("✅", "#22C55E", "rgba(34,197,94,0.06)")   if ok else ("⚠️", "#F59E0B", "rgba(245,158,11,0.06)")
ok_i, ok_c, ok_bg   = _icons(ollama_ready)
vc_i, vc_c, vc_bg   = _icons(vc_ready)
st_i, st_c, st_bg   = _icons(len(students) > 0)

st.markdown(
    f"""
    <div style='display:flex; gap:0.7rem; flex-wrap:wrap; margin-bottom:2rem;'>
        <div style='flex:1; min-width:160px; background:{ok_bg}; border:1px solid {ok_c}30;
                    border-radius:12px; padding:0.7rem 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);'>
            <div style='font-size:0.7rem; color:#9CA3AF; font-weight:700;
                        text-transform:uppercase; letter-spacing:0.4px;'>LLM Engine</div>
            <div style='color:{ok_c}; font-weight:600; font-size:0.9rem; margin-top:2px;'>
                {ok_i} {'Ollama Online' if ollama_ready else 'Ollama Offline'}</div>
        </div>
        <div style='flex:1; min-width:160px; background:{vc_bg}; border:1px solid {vc_c}30;
                    border-radius:12px; padding:0.7rem 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);'>
            <div style='font-size:0.7rem; color:#9CA3AF; font-weight:700;
                        text-transform:uppercase; letter-spacing:0.4px;'>Curriculum</div>
            <div style='color:{vc_c}; font-weight:600; font-size:0.9rem; margin-top:2px;'>
                {vc_i} {'Content Ready' if vc_ready else 'Not Uploaded'}</div>
        </div>
        <div style='flex:1; min-width:160px; background:{st_bg}; border:1px solid {st_c}30;
                    border-radius:12px; padding:0.7rem 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);'>
            <div style='font-size:0.7rem; color:#9CA3AF; font-weight:700;
                        text-transform:uppercase; letter-spacing:0.4px;'>Roster</div>
            <div style='color:{st_c}; font-weight:600; font-size:0.9rem; margin-top:2px;'>
                {st_i} {len(students)} Student{'s' if len(students) != 1 else ''} Registered</div>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# ── Feature Grid ──────────────────────────────────────────────
st.markdown(
    "<h2 style='font-size:1.3rem; font-weight:700; color:#1A1D2E; margin-bottom:1rem;'>✨ Features</h2>",
    unsafe_allow_html=True,
)

FEATURES = [
    ("📄", "Smart PDF Processing",   "#2AD699",
     "Upload curriculum PDFs — AI extracts, cleans and chunks content into study-ready units."),
    ("🧠", "RAG-Powered Q&A",        "#22B07D",
     "Ask any doubt and get curriculum-grounded answers via Retrieval Augmented Generation."),
    ("📝", "Auto Quiz Generator",    "#38BDF8",
     "Generate MCQ quizzes from any topic. Scores tracked automatically per student."),
    ("🎯", "Personalised Paths",     "#F59E0B",
     "AI analyses each student's weak spots to build a custom step-by-step study plan."),
    ("👩‍🏫", "Teacher Insights",       "#FB923C",
     "Class analytics, weak topic detection, and AI teaching suggestions in one dashboard."),
    ("🌤️", "Weather-Aware Teaching", "#38BDF8",
     "Real-time weather integration adjusts lesson recommendations for rain, heat & more."),
    ("🤖", "Multi-Step AI Agent",    "#A78BFA",
     "Chain-of-thought reasoning agent that plans, researches, and synthesises insights."),
    ("📅", "Smart Calendar",         "#22C55E",
     "Holiday awareness with AI-powered planning suggestions for upcoming dates."),
]

cols = st.columns(4)
for i, (icon, title, color, desc) in enumerate(FEATURES):
    with cols[i % 4]:
        st.markdown(
            f"""
            <div style='
                background: #FFFFFF;
                border: 1px solid #E5E7EB;
                border-radius: 16px;
                padding: 1.3rem 1.1rem;
                margin-bottom: 1rem;
                transition: all 0.25s ease;
                position: relative;
                overflow: hidden;
                box-shadow: 0 2px 12px rgba(0,0,0,0.04);
            '>
                <div style='
                    position: absolute; top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, {color}80, {color}20);
                    border-radius: 16px 16px 0 0;
                '></div>
                <div style='font-size:1.8rem; margin-bottom:0.6rem;'>{icon}</div>
                <div style='font-size:0.9rem; font-weight:700; color:{color};
                            margin-bottom:0.4rem; letter-spacing:-0.2px;'>{title}</div>
                <div style='font-size:0.78rem; color:#6B7280; line-height:1.5;'>{desc}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

# ── Quick Start ───────────────────────────────────────────────
st.markdown("<hr>", unsafe_allow_html=True)
st.markdown(
    "<h2 style='font-size:1.3rem; font-weight:700; color:#1A1D2E; margin-bottom:1rem;'>🚀 Quick Start</h2>",
    unsafe_allow_html=True,
)

STEPS = [
    ("1", "#2AD699", "Upload Curriculum",
     "Go to <strong>Upload Curriculum</strong> → upload a PDF textbook → AI processes it automatically."),
    ("2", "#22B07D", "Add Students",
     "Go to <strong>Student Manager</strong> → add students with a unique Login ID each."),
    ("3", "#38BDF8", "Take a Quiz",
     "Go to <strong>Quiz Generator</strong> → pick a topic → generate and attempt an MCQ quiz."),
    ("4", "#F59E0B", "View Insights",
     "Check <strong>Teacher Dashboard</strong> for class analytics, weak topics & AI suggestions."),
    ("5", "#FB923C", "Ask the Agent",
     "Use the <strong>AI Agent</strong> for multi-step reasoning across your entire curriculum."),
]

for num, color, title, desc in STEPS:
    st.markdown(
        f"""
        <div style='
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-left: 4px solid {color};
            border-radius: 12px;
            padding: 0.85rem 1.1rem;
            margin-bottom: 0.6rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        '>
            <div style='
                min-width: 28px; height: 28px;
                background: {color}15;
                border: 1px solid {color}30;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 0.78rem; font-weight: 800; color: {color};
            '>{num}</div>
            <div>
                <div style='font-size:0.88rem; font-weight:700; color:#1A1D2E; margin-bottom:2px;'>{title}</div>
                <div style='font-size:0.8rem; color:#6B7280;'>{desc}</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

# ── Setup Reference ───────────────────────────────────────────
st.markdown("<hr>", unsafe_allow_html=True)
st.markdown(
    "<h2 style='font-size:1.3rem; font-weight:700; color:#1A1D2E; margin-bottom:1rem;'>⚙️ Setup Reference</h2>",
    unsafe_allow_html=True,
)

setup_col1, setup_col2 = st.columns(2)

with setup_col1:
    st.markdown(
        """
        <div style='background:#FFFFFF; border:1px solid #E5E7EB; border-radius:14px; padding:1.2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);'>
            <div style='font-size:0.85rem; font-weight:700; color:#22B07D; margin-bottom:0.8rem;'>
                🦙 Ollama (Local LLM)
            </div>
        """,
        unsafe_allow_html=True,
    )
    st.code(
        "# Install & pull models\ncurl -fsSL https://ollama.com/install.sh | sh\nollama pull mistral\nollama pull nomic-embed-text\nollama serve",
        language="bash",
    )
    st.markdown("</div>", unsafe_allow_html=True)

with setup_col2:
    st.markdown(
        """
        <div style='background:#FFFFFF; border:1px solid #E5E7EB; border-radius:14px; padding:1.2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);'>
            <div style='font-size:0.85rem; font-weight:700; color:#22B07D; margin-bottom:0.8rem;'>
                🐍 Python &amp; Environment
            </div>
        """,
        unsafe_allow_html=True,
    )
    st.code(
        "pip install -r requirements.txt\n\n# Copy and edit .env\ncp .env.example .env\n# Add OPENWEATHERMAP_API_KEY",
        language="bash",
    )
    st.markdown("</div>", unsafe_allow_html=True)
