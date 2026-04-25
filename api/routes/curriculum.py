"""Curriculum upload & management routes."""

from fastapi import APIRouter, UploadFile, File, HTTPException
import os

from backend.pdf_processor import process_pdf, save_pdf
from backend.rag_pipeline import (
    create_vectorstore, add_to_vectorstore,
    vectorstore_exists, get_available_topics,
)
from backend.paths import UPLOADS_DIR

router = APIRouter()


@router.get("/status")
def curriculum_status():
    return {"loaded": vectorstore_exists()}


@router.get("/topics")
def list_topics():
    if not vectorstore_exists():
        return {"topics": []}
    try:
        topics = get_available_topics()
        return {"topics": topics}
    except Exception:
        return {"topics": []}


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Save file
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    file_path = os.path.join(UPLOADS_DIR, file.filename)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Process
    try:
        chunks = process_pdf(file_path)
        if not chunks:
            return {"status": "warning", "message": "PDF processed but no extractable text found"}

        if vectorstore_exists():
            add_to_vectorstore(chunks)
        else:
            create_vectorstore(chunks)

        return {
            "status": "success",
            "filename": file.filename,
            "chunks": len(chunks),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files")
def list_uploaded_files():
    if not os.path.exists(UPLOADS_DIR):
        return {"files": []}
    files = [f for f in os.listdir(UPLOADS_DIR) if f.endswith(".pdf")]
    return {"files": files}


@router.delete("/files/{filename}")
def delete_file(filename: str):
    path = os.path.join(UPLOADS_DIR, filename)
    if os.path.exists(path):
        os.remove(path)
        return {"status": "deleted", "filename": filename}
    raise HTTPException(status_code=404, detail="File not found")
