from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Enum, UniqueConstraint, text
from datetime import datetime
import enum
import os
from pathlib import Path

# Ensure db directory exists
DB_DIR = Path(__file__).parent
DB_DIR.mkdir(exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DB_DIR}/rag_library.db")

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
    category     = Column(String, nullable=True)
    description  = Column(Text, nullable=True)
    preview_text = Column(Text, nullable=True)
    stored_path  = Column(String, nullable=True)
    downloads    = Column(Integer, default=0)
    read_count   = Column(Integer, default=0)


class FavoriteDoc(Base):
    __tablename__ = "favorite_docs"

    id        = Column(Integer, primary_key=True, index=True)
    user_id   = Column(Integer, nullable=False)
    doc_id    = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "doc_id", name="uq_favorite_user_doc"),
    )


# ─── Helpers ──────────────────────────────────────────────
async def init_db():
    """Create all tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _ensure_uploaded_doc_columns(conn)


async def _ensure_uploaded_doc_columns(conn):
    """Add missing columns for UploadedDoc when using SQLite without migrations."""
    result = await conn.execute(text("PRAGMA table_info(uploaded_docs)"))
    existing = {row[1] for row in result.fetchall()}

    columns = {
        "category": "ALTER TABLE uploaded_docs ADD COLUMN category VARCHAR",
        "description": "ALTER TABLE uploaded_docs ADD COLUMN description TEXT",
        "preview_text": "ALTER TABLE uploaded_docs ADD COLUMN preview_text TEXT",
        "stored_path": "ALTER TABLE uploaded_docs ADD COLUMN stored_path VARCHAR",
        "downloads": "ALTER TABLE uploaded_docs ADD COLUMN downloads INTEGER DEFAULT 0",
        "read_count": "ALTER TABLE uploaded_docs ADD COLUMN read_count INTEGER DEFAULT 0",
    }

    for name, stmt in columns.items():
        if name not in existing:
            await conn.execute(text(stmt))


async def get_db():
    """Dependency: yields a DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()