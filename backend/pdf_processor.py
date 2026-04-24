"""
MTRX-TriAxis | Stage 1: PDF Processing Module
Extracts text from PDFs, cleans it with LLM, and chunks into study units.
"""

import os
import json
import fitz  # PyMuPDF

from backend.llm_utils import get_llm
from prompts.curriculum_analyzer import get_prompt as get_analyzer_prompt
from prompts.content_chunker import get_prompt as get_chunker_prompt
from langchain_text_splitters import RecursiveCharacterTextSplitter


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract all text from a PDF file.

    Args:
        file_path: Path to the PDF file.

    Returns:
        Raw text string from all pages.
    """
    text = ""
    # Open the PDF with PyMuPDF
    doc = fitz.open(file_path)

    for page_num, page in enumerate(doc):
        page_text = page.get_text()
        if page_text.strip():
            text += f"\n--- Page {page_num + 1} ---\n"
            text += page_text

    doc.close()
    return text.strip()


def clean_text_with_llm(raw_text: str) -> str:
    """
    Use the Curriculum Analyzer (Module 1) prompt to clean and structure raw text.

    Takes noisy PDF text and outputs a clean hierarchical structure:
      Topic:
        Subtopic:
          - Key points
          - Definitions

    Args:
        raw_text: Raw text extracted from PDF.

    Returns:
        Structured, cleaned text.
    """
    llm = get_llm(temperature=0.3)  # Low temperature for factual structuring
    prompt = get_analyzer_prompt()

    # Build the chain: prompt → LLM
    chain = prompt | llm

    # If the text is very long, process it in sections
    max_chunk_size = 4000  # Characters per LLM call (fits in context window)

    if len(raw_text) <= max_chunk_size:
        # Short document — process in one shot
        result = chain.invoke({"input_text": raw_text})
        return result
    else:
        # Long document — split into sections and process each
        sections = _split_into_sections(raw_text, max_chunk_size)
        structured_parts = []

        for i, section in enumerate(sections):
            print(f"  Processing section {i + 1}/{len(sections)}...")
            result = chain.invoke({"input_text": section})
            structured_parts.append(result)

        return "\n\n".join(structured_parts)


def chunk_content_with_llm(structured_text: str) -> list[dict]:
    """
    Use the Content Chunker (Module 2) prompt to split structured text
    into atomic concept chunks.

    Each chunk is a dict with:
      - "title": concept name
      - "content": explanation (100-300 words)

    Args:
        structured_text: Output from clean_text_with_llm().

    Returns:
        List of chunk dicts: [{"title": "...", "content": "..."}, ...]
    """
    llm = get_llm(temperature=0.3)
    prompt = get_chunker_prompt()
    chain = prompt | llm

    # Process in sections if text is long
    max_chunk_size = 3000
    all_chunks = []

    if len(structured_text) <= max_chunk_size:
        sections = [structured_text]
    else:
        sections = _split_into_sections(structured_text, max_chunk_size)

    for i, section in enumerate(sections):
        print(f"  Chunking section {i + 1}/{len(sections)}...")
        result = chain.invoke({"structured_text": section})

        # Parse the JSON response from LLM
        chunks = _parse_json_response(result)
        all_chunks.extend(chunks)

    return all_chunks


def chunk_content_fallback(text: str, chunk_size: int = 500, chunk_overlap: int = 100) -> list[dict]:
    """
    Fallback chunker using RecursiveCharacterTextSplitter.
    Use this if the LLM-based chunker fails or for quick processing.

    Args:
        text: Text to chunk.
        chunk_size: Target chunk size in characters.
        chunk_overlap: Overlap between chunks.

    Returns:
        List of chunk dicts with auto-generated titles.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    documents = splitter.create_documents([text])

    chunks = []
    for i, doc in enumerate(documents):
        # Auto-generate a title from the first line
        first_line = doc.page_content.split("\n")[0].strip()
        title = first_line[:80] if first_line else f"Chunk {i + 1}"

        chunks.append({
            "title": title,
            "content": doc.page_content,
        })

    return chunks


def process_pdf(file_path: str, use_llm_chunker: bool = True) -> list[dict]:
    """
    Full pipeline: PDF → Extract → Clean → Chunk.

    This is the main entry point for PDF processing.

    Args:
        file_path: Path to the PDF file.
        use_llm_chunker: If True, use LLM for smart chunking.
                         If False, use basic text splitting.

    Returns:
        List of chunk dicts ready for embedding.
    """
    print(f"[INFO] Extracting text from: {file_path}")
    raw_text = extract_text_from_pdf(file_path)

    if not raw_text:
        print("[WARN] No text found in PDF!")
        return []

    print(f"[INFO] Extracted {len(raw_text)} characters from PDF")

    # Step 2: Clean and structure with LLM
    print("[INFO] Cleaning and structuring text with LLM...")
    structured_text = clean_text_with_llm(raw_text)
    print(f"[OK] Structured text: {len(structured_text)} characters")

    # Step 3: Chunk into study units
    if use_llm_chunker:
        print("[INFO] Chunking with LLM (smart mode)...")
        chunks = chunk_content_with_llm(structured_text)

        # Fallback if LLM chunking produced nothing
        if not chunks:
            print("[WARN] LLM chunking failed, using fallback splitter...")
            chunks = chunk_content_fallback(structured_text)
    else:
        print("[INFO] Chunking with text splitter (fast mode)...")
        chunks = chunk_content_fallback(structured_text)

    print(f"[OK] Created {len(chunks)} chunks")
    return chunks


# ----- Helper Functions -----

def _split_into_sections(text: str, max_size: int) -> list[str]:
    """Split long text into sections that fit within max_size characters."""
    sections = []
    # Try to split on double newlines first (paragraph boundaries)
    paragraphs = text.split("\n\n")
    current_section = ""

    for para in paragraphs:
        if len(current_section) + len(para) + 2 <= max_size:
            current_section += para + "\n\n"
        else:
            if current_section.strip():
                sections.append(current_section.strip())
            current_section = para + "\n\n"

    if current_section.strip():
        sections.append(current_section.strip())

    return sections if sections else [text[:max_size]]


def _parse_json_response(response: str) -> list[dict]:
    """
    Parse JSON array from LLM response, handling common formatting issues.
    """
    # Try direct parsing first
    try:
        chunks = json.loads(response)
        if isinstance(chunks, list):
            return chunks
    except json.JSONDecodeError:
        pass

    # Try to find JSON array in the response (LLM may add extra text)
    import re
    json_match = re.search(r'\[[\s\S]*\]', response)
    if json_match:
        try:
            chunks = json.loads(json_match.group())
            if isinstance(chunks, list):
                return chunks
        except json.JSONDecodeError:
            pass

    # If all parsing fails, return empty list
    print("[WARN] Could not parse LLM response as JSON")
    return []


def save_pdf(uploaded_file, upload_dir: str = "data/uploads") -> str:
    """
    Save an uploaded file (from Streamlit) to the uploads directory.

    Args:
        uploaded_file: Streamlit UploadedFile object.
        upload_dir: Directory to save files to.

    Returns:
        Full path to the saved file.
    """
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, uploaded_file.name)

    with open(file_path, "wb") as f:
        f.write(uploaded_file.getbuffer())

    return file_path
