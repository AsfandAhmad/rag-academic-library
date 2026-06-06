from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import asyncio
import PyPDF2
import uuid
import json
import io
import os
from pathlib import Path

from db.database import get_db, UploadedDoc, FavoriteDoc
from core.retriever import get_retriever
from routes.auth import get_current_user, User

router = APIRouter()

CHUNK_SIZE    = 500    # words per chunk
CHUNK_OVERLAP = 50     # overlapping words between chunks
UPLOAD_INDEX_TIMEOUT_SECONDS = int(os.getenv("UPLOAD_INDEX_TIMEOUT_SECONDS", "300"))

STORAGE_DIR = Path(__file__).resolve().parents[1] / "storage"
STORAGE_DIR.mkdir(exist_ok=True)


async def run_blocking_upload_step(label: str, func, *args):
    """Run slow upload work outside FastAPI's event loop with a clear timeout."""
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(func, *args),
            timeout=UPLOAD_INDEX_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError as exc:
        raise HTTPException(
            status_code=504,
            detail=(
                f"Upload timed out while {label}. "
                "Check backend logs, Pinecone connectivity, and the SciBERT model setup."
            ),
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Upload failed while {label}: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed while {label}: {exc}",
        ) from exc


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


def build_chunks(filename: str, pages: list[dict], user_id: int) -> list[dict]:
    chunks_to_embed = []
    for page_data in pages:
        page_chunks = chunk_text(page_data["text"])
        for idx, chunk_text_content in enumerate(page_chunks):
            chunk_id = f"{filename}_{page_data['page']}_{idx}_{uuid.uuid4().hex[:8]}"
            chunks_to_embed.append({
                "id":   chunk_id,
                "text": chunk_text_content,
                "metadata": {
                    "filename": filename,
                    "page":     page_data["page"],
                    "chunk":    idx,
                    "user_id":  user_id,
                }
            })
    return chunks_to_embed


def write_uploaded_file(path: Path, file_bytes: bytes):
    with open(path, "wb") as f:
        f.write(file_bytes)


@router.post("/pdf")
async def upload_pdf(
    file:         UploadFile = File(...),
    category:     str | None = Form(None),
    description:  str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db)
):
    """
    Upload a PDF → extract text → chunk → embed → store in Pinecone.
    Accessible by all authenticated users.
    """
    print(f"Upload started: {file.filename} for user {current_user.id}")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:  # 20MB limit
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    # 1. Extract text per page
    pages = await run_blocking_upload_step(
        "extracting text from the PDF",
        extract_text_from_pdf,
        file_bytes,
    )
    if not pages:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    print(f"Upload text extracted: {file.filename}, pages={len(pages)}")

    # 2. Chunk each page
    chunks_to_embed = await run_blocking_upload_step(
        "chunking extracted text",
        build_chunks,
        file.filename,
        pages,
        current_user.id,
    )
    print(f"Upload chunks built: {file.filename}, chunks={len(chunks_to_embed)}")

    # 3. Embed + upsert to Pinecone
    retriever = await run_blocking_upload_step(
        "connecting to Pinecone and loading the embedding model",
        get_retriever,
    )
    print(f"Upload indexing started: {file.filename}")
    stored_ids = await run_blocking_upload_step(
        "embedding and indexing the PDF",
        retriever.upsert_chunks,
        chunks_to_embed,
    )
    print(f"Upload indexing finished: {file.filename}, vectors={len(stored_ids)}")

    # 4. Save record to SQLite and store file
    stored_name = f"{uuid.uuid4().hex}_{file.filename}"
    stored_path = STORAGE_DIR / stored_name
    await run_blocking_upload_step(
        "saving the uploaded PDF",
        write_uploaded_file,
        stored_path,
        file_bytes,
    )

    preview_text = ""
    if chunks_to_embed:
        preview_text = chunks_to_embed[0]["text"][:1200]

    doc = UploadedDoc(
        user_id=current_user.id,
        filename=file.filename,
        pinecone_ids=json.dumps(stored_ids),
        chunk_count=len(stored_ids),
        category=category,
        description=description,
        preview_text=preview_text,
        stored_path=str(stored_path)
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    return {
        "message":     "PDF uploaded and indexed successfully",
        "filename":    file.filename,
        "pages":       len(pages),
        "chunks":      len(stored_ids),
        "document_id": doc.id
    }


@router.get("/docs")
async def get_docs(
    current_user: User = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db)
):
    """Return a lightweight list of uploaded docs for the current user."""
    result = await db.execute(
        select(UploadedDoc).where(UploadedDoc.user_id == current_user.id)
    )
    docs = result.scalars().all()
    return [
        {"id": d.id, "filename": d.filename, "uploaded_at": d.uploaded_at.isoformat()}
        for d in docs
    ]


@router.get("/docs/all")
async def get_all_docs(
    current_user: User = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db)
):
    """Return a list of all uploaded docs (for Library view)."""
    from sqlalchemy import select
    result = await db.execute(select(UploadedDoc))
    docs = result.scalars().all()

    # fetch uploader names
    user_ids = {d.user_id for d in docs}
    users = {}
    if user_ids:
        from db.database import User as UserModel
        q = await db.execute(select(UserModel).where(UserModel.id.in_(list(user_ids))))
        for u in q.scalars().all():
            users[u.id] = u.name

    return [
        {
            "id": d.id,
            "filename": d.filename,
            "uploaded_at": d.uploaded_at.isoformat(),
            "uploaded_by": users.get(d.user_id, "Unknown"),
            "can_delete": (current_user.role.value in ("admin", "faculty")) or (current_user.id == d.user_id)
        }
        for d in docs
    ]


@router.delete("/docs/{doc_id}")
async def delete_doc_by_id(
    doc_id:       int,
    current_user: User = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db)
):
    """Delete a document (alternative path) — mirrors `/upload/{doc_id}` logic."""
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

    # Remove stored file if present
    if doc.stored_path:
        try:
            Path(doc.stored_path).unlink(missing_ok=True)
        except Exception:
            pass

    # Remove favorites for this doc
    await db.execute(delete(FavoriteDoc).where(FavoriteDoc.doc_id == doc.id))

    # Delete from SQLite
    await db.delete(doc)
    await db.commit()

    return {"message": f"Document '{doc.filename}' deleted successfully"}


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

    fav_result = await db.execute(
        select(FavoriteDoc.doc_id).where(FavoriteDoc.user_id == current_user.id)
    )
    fav_ids = {row[0] for row in fav_result.fetchall()}
    return [
        {
            "id":          d.id,
            "filename":    d.filename,
            "chunk_count": d.chunk_count,
            "uploaded_at": d.uploaded_at.isoformat(),
            "category":    d.category,
            "description": d.description,
            "preview":     d.preview_text,
            "downloads":   d.downloads,
            "read_count":  d.read_count,
            "is_favorite": d.id in fav_ids
        }
        for d in docs
    ]


@router.get("/stats")
async def get_stats(
    current_user: User = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UploadedDoc).where(UploadedDoc.user_id == current_user.id)
    )
    docs = result.scalars().all()
    total_chunks = sum(d.chunk_count or 0 for d in docs)
    last_indexed = max((d.uploaded_at for d in docs), default=None)
    return {
        "total_docs": len(docs),
        "total_chunks": total_chunks,
        "last_indexed": last_indexed.isoformat() if last_indexed else None
    }


@router.get("/{doc_id}/preview")
async def get_doc_preview(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UploadedDoc).where(
            UploadedDoc.id == doc_id,
            UploadedDoc.user_id == current_user.id
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.read_count = (doc.read_count or 0) + 1
    await db.commit()

    return {"preview": doc.preview_text or ""}


@router.get("/{doc_id}/download")
async def download_doc(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UploadedDoc).where(
            UploadedDoc.id == doc_id,
            UploadedDoc.user_id == current_user.id
        )
    )
    doc = result.scalar_one_or_none()
    if not doc or not doc.stored_path:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.downloads = (doc.downloads or 0) + 1
    await db.commit()

    return FileResponse(path=doc.stored_path, filename=doc.filename, media_type="application/pdf")


@router.get("/docs/{doc_id}/download")
async def download_doc_public(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Public download endpoint used by Library page (requires authentication)."""
    result = await db.execute(
        select(UploadedDoc).where(UploadedDoc.id == doc_id)
    )
    doc = result.scalar_one_or_none()
    if not doc or not doc.stored_path:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.downloads = (doc.downloads or 0) + 1
    await db.commit()
    return FileResponse(path=doc.stored_path, filename=doc.filename, media_type="application/pdf")


@router.post("/{doc_id}/favorite")
async def toggle_favorite(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(
        select(FavoriteDoc).where(
            FavoriteDoc.user_id == current_user.id,
            FavoriteDoc.doc_id == doc_id
        )
    )
    fav = existing.scalar_one_or_none()
    if fav:
        await db.execute(delete(FavoriteDoc).where(FavoriteDoc.id == fav.id))
        await db.commit()
        return {"is_favorite": False}

    new_fav = FavoriteDoc(user_id=current_user.id, doc_id=doc_id)
    db.add(new_fav)
    await db.commit()
    return {"is_favorite": True}


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

    # Remove stored file if present
    if doc.stored_path:
        try:
            Path(doc.stored_path).unlink(missing_ok=True)
        except Exception:
            pass

    # Remove favorites for this doc
    await db.execute(delete(FavoriteDoc).where(FavoriteDoc.doc_id == doc.id))

    # Delete from SQLite
    await db.delete(doc)
    await db.commit()

    return {"message": f"Document '{doc.filename}' deleted successfully"}
