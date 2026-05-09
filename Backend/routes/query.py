from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
import json, time

from db.database import get_db, QueryLog
from core.retriever import get_retriever
from core.reranker import get_reranker
from core.generator import get_generator
from routes.auth import get_current_user, User

router = APIRouter()

class QueryRequest(BaseModel):
    question:      str
    top_k_fetch:   int = 10   # fetch this many from Pinecone
    top_k_rerank:  int = 5    # keep this many after re-ranking

class QueryResponse(BaseModel):
    query_id:      int
    question:      str
    answer:        str
    sources:       list
    response_time: float


@router.post("/ask", response_model=QueryResponse)
async def ask_question(
    request:      QueryRequest,
    current_user: User = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db)
):
    """
    Full RAG pipeline:
    1. Embed user query (SciBERT)
    2. Retrieve top-k chunks from Pinecone
    3. Re-rank with Cross-Encoder (SEER)
    4. Generate answer with Groq LLM + citations
    5. Log query to SQLite
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    start_time = time.time()

    # Step 1 + 2: Retrieve
    retriever = get_retriever()
    raw_chunks = retriever.search(request.question, top_k=request.top_k_fetch)

    if not raw_chunks:
        raise HTTPException(
            status_code=404,
            detail="No relevant documents found. Please upload some PDFs first."
        )

    # Step 3: Re-rank (SEER)
    reranker      = get_reranker()
    ranked_chunks = reranker.rerank(request.question, raw_chunks, top_k=request.top_k_rerank)

    # Step 4: Generate answer
    generator = get_generator()
    result    = generator.generate(request.question, ranked_chunks)

    response_time = round(time.time() - start_time, 3)

    # Step 5: Log to SQLite
    log = QueryLog(
        user_id=current_user.id,
        question=request.question,
        answer=result["answer"],
        sources=json.dumps(result["sources"]),
        response_time=response_time
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    return QueryResponse(
        query_id=log.id,
        question=request.question,
        answer=result["answer"],
        sources=result["sources"],
        response_time=response_time
    )


@router.get("/history")
async def get_query_history(
    current_user: User = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db)
):
    """Get last 20 queries for the current user."""
    from sqlalchemy import select, desc
    result = await db.execute(
        select(QueryLog)
        .where(QueryLog.user_id == current_user.id)
        .order_by(desc(QueryLog.created_at))
        .limit(20)
    )
    logs = result.scalars().all()
    return [
        {
            "id":            l.id,
            "question":      l.question,
            "answer":        l.answer[:300] + "...",
            "response_time": l.response_time,
            "created_at":    l.created_at.isoformat()
        }
        for l in logs
    ]