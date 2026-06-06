from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from pathlib import Path

from db.database import init_db
from routes import auth, upload, query, feedback

# Load .env file from Backend directory
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    print("✅ Database initialized")
    yield
    # Shutdown
    print("👋 Shutting down...")

app = FastAPI(
    title="Maktab e Kamil API",
    description="Retrieval Augmented Generation for Maktab e Kamil",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router,     prefix="/auth",     tags=["Authentication"])
app.include_router(upload.router,   prefix="/upload",   tags=["Upload"])
app.include_router(query.router,    prefix="/query",    tags=["Query"])
app.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])

@app.get("/")
async def root():
    return {
        "message": "Maktab e Kamil API is running",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}