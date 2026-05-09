from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional

from db.database import get_db, Feedback, QueryLog
from routes.auth import get_current_user, require_role, User, UserRole

router = APIRouter()

class FeedbackRequest(BaseModel):
    query_id: int
    rating:   int             # 1 = thumbs up, 0 = thumbs down
    comment:  Optional[str] = None

class FeedbackResponse(BaseModel):
    id:      int
    message: str


@router.post("/", response_model=FeedbackResponse)
async def submit_feedback(
    data:         FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db)
):
    """Submit thumbs up/down feedback for a query result."""
    if data.rating not in (0, 1):
        raise HTTPException(status_code=400, detail="Rating must be 0 (down) or 1 (up)")

    # Verify query exists and belongs to user
    result = await db.execute(
        select(QueryLog).where(
            QueryLog.id == data.query_id,
            QueryLog.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Query not found")

    feedback = Feedback(
        user_id=current_user.id,
        query_id=data.query_id,
        rating=data.rating,
        comment=data.comment
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)

    return FeedbackResponse(
        id=feedback.id,
        message="Feedback submitted. Thank you!"
    )


@router.get("/stats")
async def get_feedback_stats(
    # Only admin/faculty can see stats (RBAC)
    current_user: User = Depends(require_role(UserRole.admin, UserRole.faculty))
):
    """
    Get overall feedback stats.
    RBAC: admin and faculty only.
    """
    from db.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        total = await db.execute(select(func.count(Feedback.id)))
        thumbs_up = await db.execute(
            select(func.count(Feedback.id)).where(Feedback.rating == 1)
        )
        thumbs_down = await db.execute(
            select(func.count(Feedback.id)).where(Feedback.rating == 0)
        )

    total_count = total.scalar()
    up_count    = thumbs_up.scalar()
    down_count  = thumbs_down.scalar()

    return {
        "total_feedback":   total_count,
        "thumbs_up":        up_count,
        "thumbs_down":      down_count,
        "satisfaction_rate": f"{round((up_count / total_count * 100) if total_count else 0, 1)}%"
    }