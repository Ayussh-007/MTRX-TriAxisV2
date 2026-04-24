"""
MTRX-TriAxis | PDF Upload Page
Upload and process curriculum PDFs through the AI pipeline.
"""

import streamlit as st
import os

from backend.paths import UPLOADS_DIR
from backend.pdf_processor import save_pdf, process_pdf
from backend.rag_pipeline import create_vectorstore, add_to_vectorstore, vectorstore_exists
from backend.ui_components import page_header, section_header, info_card


page_header(
    "📄", "Upload Curriculum",
    "Upload a textbook or curriculum PDF — AI will extract, clean, chunk and index it.",
    accent="#22B07D",
)

# ----- File Upload -----
uploaded_file = st.file_uploader(
    "Choose a PDF file",
    type=["pdf"],
    help="Upload a curriculum or textbook PDF. The AI will extract, clean, chunk, and index the content.",
)

# ----- Processing Options -----
opt_col1, opt_col2 = st.columns(2)
with opt_col1:
    use_llm_chunker = st.toggle(
        "🧠 Smart Chunking (LLM)",
        value=True,
        help="Use LLM to create intelligent chunks. Disable for faster basic splitting.",
    )
with opt_col2:
    append_mode = st.toggle(
        "➕ Append to Existing Curriculum",
        value=True if vectorstore_exists() else False,
        help="If ON, adds to existing content. If OFF, replaces everything.",
    )

# ----- Process Button -----
if uploaded_file is not None:
    st.markdown("<hr>", unsafe_allow_html=True)

    # File info card
    st.markdown(
        f"""
        <div style='
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 10px;
            padding: 0.9rem 1.1rem;
            display: flex;
            align-items: center;
            gap: 0.8rem;
            margin-bottom: 1rem;
        '>
            <span style='font-size:1.6rem;'>📄</span>
            <div>
                <div style='font-weight:600; color:#1A1D2E; font-size:0.9rem;'>{uploaded_file.name}</div>
                <div style='color:#6B7280; font-size:0.78rem; margin-top:2px;'>
                    {uploaded_file.size / 1024:.1f} KB · PDF Document
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    if st.button("🚀 Process PDF", type="primary", use_container_width=True):
        with st.spinner("Saving file..."):
            file_path = save_pdf(uploaded_file)
            st.success(f"✅ File saved to `{file_path}`")

        progress_bar = st.progress(0, text="Starting pipeline...")

        try:
            progress_bar.progress(10, text="📄 Extracting text from PDF...")

            with st.status("🔄 Processing PDF...", expanded=True) as status:
                st.write("📄 Extracting text from PDF...")
                progress_bar.progress(20, text="📄 Extracting text...")

                chunks = process_pdf(file_path, use_llm_chunker=use_llm_chunker)
                progress_bar.progress(60, text="✂️ Chunking complete...")

                if not chunks:
                    st.error("❌ No content could be extracted from the PDF.")
                    st.stop()

                st.write(f"✅ Created **{len(chunks)} chunks** from the PDF")

                st.write("📊 Creating embeddings and storing in vector database...")
                progress_bar.progress(70, text="📊 Building vector store...")

                if append_mode and vectorstore_exists():
                    add_to_vectorstore(chunks)
                    st.write("✅ Added to existing vector store")
                else:
                    create_vectorstore(chunks)
                    st.write("✅ Vector store created")

                progress_bar.progress(100, text="✅ Pipeline complete!")
                status.update(label="✅ Processing Complete!", state="complete")

            st.session_state["last_chunks"] = chunks

        except Exception as e:
            st.error(f"❌ Error during processing: {str(e)}")
            st.exception(e)

# ----- Chunk Preview -----
if "last_chunks" in st.session_state and st.session_state["last_chunks"]:
    st.markdown("<hr>", unsafe_allow_html=True)
    section_header("📋 Processed Chunks Preview", accent="#22B07D")

    chunks = st.session_state["last_chunks"]
    st.caption(f"Showing {min(10, len(chunks))} of {len(chunks)} total chunks")

    for i, chunk in enumerate(chunks[:10]):
        with st.expander(f"📌 {chunk.get('title', f'Chunk {i+1}')}", expanded=(i == 0)):
            st.markdown(chunk.get("content", "No content"))
            st.caption(f"Length: {len(chunk.get('content', ''))} characters")

# ----- Existing Files -----
st.markdown("<hr>", unsafe_allow_html=True)
section_header("📁 Uploaded Files", accent="#22B07D")

upload_dir = UPLOADS_DIR
if os.path.exists(upload_dir):
    files = [f for f in os.listdir(upload_dir) if f.endswith(".pdf")]
    if files:
        for f in files:
            file_size = os.path.getsize(os.path.join(upload_dir, f)) / 1024
            st.markdown(
                f"""
                <div style='background:#FFFFFF; border:1px solid #E5E7EB; border-radius:8px;
                            padding:0.6rem 0.9rem; margin-bottom:0.4rem;
                            display:flex; align-items:center; gap:0.6rem;'>
                    <span>📄</span>
                    <span style='color:#1A1D2E; font-size:0.85rem; font-weight:500;'>{f}</span>
                    <span style='color:#6B7280; font-size:0.78rem; margin-left:auto;'>{file_size:.1f} KB</span>
                </div>
                """,
                unsafe_allow_html=True,
            )
    else:
        info_card("No PDF files uploaded yet.", "📂", "#6B7280")
else:
    info_card("No PDF files uploaded yet.", "📂", "#6B7280")
