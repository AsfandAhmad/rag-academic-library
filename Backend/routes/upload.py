from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import PyPDF2
import uuid
import json
import io

from db.database import get_db, UploadedDoc
from core.retriever import get_retriever
from routes.auth import get_current_user, User

router = APIRouter()

CHUNK_SIZE    = 500    # words per chunk
CHUNK_OVERLAP = 50     # overlapping words between chunks


def extract_text_from_pdf(file_bytes: bytes) -> list[dict]:
    """Extract text from PDF, returns list of {page, text}."""
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if text.strip():
            pages.append({"page": i + 1, "text": text.strip()})
    return pages


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping word chunks."""
    words  = text.split()
    chunks = []
    start  = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


@router.post("/pdf")
async def upload_pdf(
    file:         UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db)
):
    """
    Upload a PDF → extract text → chunk → embed → store in Pinecone.
    Accessible by all authenticated users.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:  # 20MB limit
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    # 1. Extract text per page
    pages = extract_text_from_pdf(file_bytes)
    if not pages:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    # 2. Chunk each page
    chunks_to_embed = []
    for page_data in pages:
        page_chunks = chunk_text(page_data["text"])
        for idx, chunk_text_content in enumerate(page_chunks):
            chunk_id = f"{file.filename}_{page_data['page']}_{idx}_{uuid.uuid4().hex[:8]}"
            chunks_to_embed.append({
                "id":   chunk_id,
                "text": chunk_text_content,
                "metadata": {
                    "filename": file.filename,
                    "page":     page_data["page"],
                    "chunk":    idx,
                    "user_id":  current_user.id,
                }
            })

    # 3. Embed + upsert to Pinecone
    retriever  = get_retriever()
    stored_ids = retriever.upsert_chunks(chunks_to_embed)

    # 4. Save record to SQLite
    doc = UploadedDoc(
        user_id=current_user.id,
        filename=file.filename,
        pinecone_ids=json.dumps(stored_ids),
        chunk_count=len(stored_ids)
    )
    db.add(doc)
    await db.commit()

    return {
        "message":     "PDF uploaded and indexed successfully",
        "filename":    file.filename,
        "pages":       len(pages),
        "chunks":      len(stored_ids),
        "document_id": doc.id
    }


@router.get("/my-docs")
async def get_my_docs(
    current_user: User = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db)
):
    """Get all documents uploaded by the current user."""
    result = await db.execute(
        select(UploadedDoc).where(UploadedDoc.user_id == current_user.id)
    )
    docs = result.scalars().all()
    return [
        {
            "id":          d.id,
            "filename":    d.filename,
            "chunk_count": d.chunk_count,
            "uploaded_at": d.uploaded_at.isoformat()
        }
        for d in docs
    ]


@router.delete("/{doc_id}")
async def delete_doc(
    doc_id:       int,
    current_user: User = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db)
):
    """Delete a document and remove its vectors from Pinecone."""
    result = await db.execute(
        select(UploadedDoc).where(
            UploadedDoc.id == doc_id,
            UploadedDoc.user_id == current_user.id
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from Pinecone
    ids = json.loads(doc.pinecone_ids or "[]")
    if ids:
        retriever = get_retriever()
        retriever.delete_by_ids(ids)

    # Delete from SQLite
    await db.delete(doc)
    await db.commit()

    return {"message": f"Document '{doc.filename}' deleted successfully"}