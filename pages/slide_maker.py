"""
MTRX-TriAxis | Lesson Slide Maker
Lets the teacher generate a branded, curriculum-grounded PowerPoint
presentation for any topic in the uploaded syllabus.
"""

import streamlit as st
from datetime import datetime

from backend.ui_components import page_header, section_header
from backend.rag_pipeline import vectorstore_exists, get_available_topics
from backend.slide_generator import generate_slide_content, build_pptx

# ── Page Header ─────────────────────────────────────────────────────────────
page_header(
    "🖥️", "Lesson Slide Maker",
    "Generate a ready-to-present PowerPoint from your uploaded curriculum.",
    accent="#22B07D",
)

# ── Curriculum Check ─────────────────────────────────────────────────────────
if not vectorstore_exists():
    st.warning(
        "⚠️ No curriculum loaded yet. Please upload a PDF in **Upload Curriculum** first.",
        icon="📄",
    )
    st.stop()

# ── Load Topics ───────────────────────────────────────────────────────────────
with st.spinner("Loading topics from curriculum…"):
    available_topics = get_available_topics()

if not available_topics:
    st.info("No topics found in the curriculum. Try re-uploading your PDF.")
    st.stop()

# ============================================================
# CONFIGURATION PANEL
# ============================================================
st.markdown(
    """
    <div style='background: rgba(42,214,153,0.06);
                border: 1px solid rgba(42,214,153,0.2); border-radius: 14px;
                padding: 1.2rem 1.4rem; margin-bottom: 1.2rem;'>
        <div style='font-size: 0.75rem; color: #1A9068; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.6rem;'>
            ⚙️ Presentation Settings
        </div>
    """,
    unsafe_allow_html=True,
)

cfg_col1, cfg_col2 = st.columns(2)

with cfg_col1:
    topic_choice = st.selectbox(
        "📚 Topic",
        options=available_topics,
        help="Choose a topic from your uploaded curriculum.",
    )

    custom_topic = st.text_input(
        "✏️ Or enter a custom topic",
        placeholder="e.g., Newton's Laws of Motion",
        help="If filled, this overrides the dropdown above.",
    )

    teacher_name = st.text_input(
        "👩‍🏫 Teacher Name",
        value="Teacher",
        placeholder="Your name for the title slide",
    )

with cfg_col2:
    num_slides = st.slider(
        "🗂️ Number of Slides",
        min_value=4,
        max_value=15,
        value=7,
        help="Total slides including title, objectives, and summary.",
    )

    teaching_style = st.selectbox(
        "🎨 Teaching Style",
        options=["Visual", "Storytelling", "Socratic", "Direct Instruction", "Problem-Based"],
        index=0,
        help="Influences how the AI frames each slide's content.",
    )

    difficulty = st.select_slider(
        "🎯 Difficulty Level",
        options=["Easy", "Medium", "Hard"],
        value="Medium",
    )

st.markdown("</div>", unsafe_allow_html=True)

# ── Extras ────────────────────────────────────────────────────────────────────
st.markdown(
    """
    <div style='font-size: 0.75rem; color: #6B7280; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.4rem;'>
        ✨ Optional Slides
    </div>
    """,
    unsafe_allow_html=True,
)

ex_col1, ex_col2, ex_col3 = st.columns(3)
with ex_col1:
    include_examples = st.checkbox("💡 Real-World Examples", value=True)
with ex_col2:
    include_key_terms = st.checkbox("📚 Key Terms / Glossary", value=True)
with ex_col3:
    include_quiz = st.checkbox("🧠 Quiz Question Slide", value=False)

st.markdown("<br>", unsafe_allow_html=True)

# ── Generate Button ───────────────────────────────────────────────────────────
final_topic = custom_topic.strip() if custom_topic.strip() else topic_choice

generate_col, _ = st.columns([2, 3])
with generate_col:
    generate_clicked = st.button(
        "✨ Generate Presentation",
        type="primary",
        use_container_width=True,
    )

if generate_clicked:
    if not final_topic:
        st.warning("Please select or enter a topic.")
        st.stop()

    with st.spinner(f"🤖 AI is building slides for **{final_topic}**… this may take 30–60 seconds."):
        try:
            slides = generate_slide_content(
                topic=final_topic,
                num_slides=num_slides,
                teaching_style=teaching_style,
                difficulty=difficulty.lower(),
                include_examples=include_examples,
                include_key_terms=include_key_terms,
                include_quiz_slide=include_quiz,
                teacher_name=teacher_name.strip() or "Teacher",
            )
            pptx_bytes = build_pptx(
                slides,
                topic=final_topic,
                teacher_name=teacher_name.strip() or "Teacher",
            )
            st.session_state["slide_data"]  = slides
            st.session_state["pptx_bytes"]  = pptx_bytes
            st.session_state["slide_topic"] = final_topic
        except Exception as e:
            st.error(f"❌ Generation failed: {str(e)}")
            st.stop()

# ============================================================
# RESULTS: PREVIEW + DOWNLOAD
# ============================================================
if "slide_data" in st.session_state and "pptx_bytes" in st.session_state:
    topic_label = st.session_state.get("slide_topic", "")
    slides      = st.session_state["slide_data"]
    pptx_bytes  = st.session_state["pptx_bytes"]

    st.markdown("---")

    # ── Download Button ────────────────────────────────────────────────────────
    safe_name = topic_label.replace(" ", "_").replace("/", "-")[:40]
    filename  = f"MTRX_{safe_name}_{datetime.today().strftime('%Y%m%d')}.pptx"

    dl_col, info_col = st.columns([1, 2])
    with dl_col:
        st.download_button(
            label="⬇️ Download .pptx",
            data=pptx_bytes,
            file_name=filename,
            mime="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            type="primary",
            use_container_width=True,
        )
    with info_col:
        st.markdown(
            f"""
            <div style='background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.3);
                        border-radius: 10px; padding: 0.7rem 1rem;'>
                ✅ <strong style='color:#22C55E;'>{len(slides)} slides generated</strong>
                for <em>{topic_label}</em><br>
                <span style='color:#6B7280; font-size:0.82rem;'>
                    Open in PowerPoint, Keynote, or LibreOffice Impress.
                </span>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # ── Slide Preview ──────────────────────────────────────────────────────────
    st.markdown("### 🔍 Slide Preview")
    st.caption("Expand each slide to review the generated content before downloading.")

    for i, slide in enumerate(slides, start=1):
        stype = slide.get("type", "content")
        type_labels = {
            "title":      ("🖥️", "Title Slide",      "#2AD699"),
            "objectives": ("🎯", "Objectives",        "#22B07D"),
            "content":    ("📖", "Content",           "#1A9068"),
            "key_terms":  ("📚", "Key Terms",         "#60A5FA"),
            "quiz":       ("🧠", "Quiz Question",     "#FB923C"),
            "summary":    ("✅", "Summary / Recap",   "#22C55E"),
        }
        icon, label, color = type_labels.get(stype, ("📄", "Slide", "#6B7280"))

        with st.expander(
            f"**Slide {i}** — {icon} {label}: _{slide.get('title', '')}_ ",
            expanded=(i == 1),
        ):
            # Type badge
            st.markdown(
                f"<span style='background:{color}22; color:{color}; border:1px solid {color}44;"
                f"border-radius:6px; padding:2px 8px; font-size:0.75rem; font-weight:700;'>"
                f"{icon} {label}</span>",
                unsafe_allow_html=True,
            )

            st.markdown(f"#### {slide.get('title', '')}")

            if stype == "title":
                st.markdown(f"*{slide.get('subtitle', '')}*")

            elif stype == "quiz":
                st.markdown(f"**Question:** {slide.get('question', '')}")
                opts = slide.get("options", [])
                for j, opt in enumerate(opts):
                    st.markdown(f"&emsp;{'ABCD'[j]}. {opt}")
                answer = slide.get("answer", "")
                st.markdown(
                    f"<span style='color:#22C55E; font-weight:600;'>✅ Answer: {answer}</span>",
                    unsafe_allow_html=True,
                )

            elif stype == "key_terms":
                for term in slide.get("terms", slide.get("bullets", [])):
                    parts = str(term).split(":", 1)
                    if len(parts) == 2:
                        st.markdown(f"- **{parts[0].strip()}:** {parts[1].strip()}")
                    else:
                        st.markdown(f"- {term}")

            else:
                for bullet in slide.get("bullets", []):
                    st.markdown(f"- {bullet}")

            notes = slide.get("speaker_notes", "")
            if notes:
                st.markdown(
                    f"<div style='background:rgba(42,214,153,0.06); border-left:3px solid #22B07D;"
                    f"border-radius:4px; padding:0.5rem 0.8rem; margin-top:0.5rem; font-size:0.84rem;"
                    f"color:#4B5563;'>🎙️ <strong>Speaker Notes:</strong> {notes}</div>",
                    unsafe_allow_html=True,
                )
