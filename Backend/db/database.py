from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Enum
from datetime import datetime
import enum
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./db/rag_library.db")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# ─── Enums ────────────────────────────────────────────────
class UserRole(str, enum.Enum):
    student = "student"
    faculty = "faculty"
    admin   = "admin"

# ─── Models ───────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    name          = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)   # null for Google OAuth users
    role          = Column(Enum(UserRole), default=UserRole.student)
    google_id     = Column(String, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)


class QueryLog(Base):
    __tablename__ = "query_logs"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, nullable=False)
    question      = Column(Text, nullable=False)
    answer        = Column(Text, nullable=False)
    sources       = Column(Text, nullable=True)       # JSON string of sources
    response_time = Column(Float, nullable=True)      # seconds
    created_at    = Column(DateTime, default=datetime.utcnow)


class Feedback(Base):
    __tablename__ = "feedbacks"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, nullable=False)
    query_id   = Column(Integer, nullable=False)
    rating     = Column(Integer, nullable=False)      # 1 = thumbs up, 0 = thumbs down
    comment    = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UploadedDoc(Base):
    __tablename__ = "uploaded_docs"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, nullable=False)
    filename     = Column(String, nullable=False)
    pinecone_ids = Column(Text, nullable=True)        # JSON list of vector IDs
    chunk_count  = Column(Integer, default=0)
    uploaded_at  = Column(DateTime, default=datetime.utcnow)


# ─── Helpers ──────────────────────────────────────────────
async def init_db():
    """Create all tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """Dependency: yields a DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()