Project: Maktab e Kamil — short codebase explanation
===============================================

Overview
--------
- Purpose: Retrieval-Augmented Generation (RAG) system for academic PDFs: upload PDFs, index chunks in Pinecone, run semantic search + re-ranking, and generate cited answers via Groq LLM.
- Stack: FastAPI (backend), React + Vite (frontend), Pinecone (vector DB), SciBERT embeddings, Cross-Encoder reranker, Groq LLM.

Repository layout (high level)
------------------------------
- `Backend/` — FastAPI app and core RAG pipeline.
  - `main.py` — app entry, CORS, startup (DB init), route mounting.
  - `core/` — pipeline modules:
    - `embedder.py` — SciBERT SentenceTransformer singleton, embedding helpers.
    - `retriever.py` — Pinecone client wrapper: ensure index, upsert vectors, search, delete.
    - `reranker.py` — CrossEncoder re-ranker (rerank top candidates).
    - `generator.py` — Groq client wrapper: build prompt from chunks and call LLM to produce answer + formatted sources.
  - `db/database.py` — SQLAlchemy async models and DB init (Users, QueryLog, Feedback, UploadedDoc, FavoriteDoc). Also helper to add missing SQLite columns.
  - `routes/` — API endpoints:
    - `auth.py` — register/login (JWT), `get_me`, role-based access helper.
    - `upload.py` — PDF upload workflow: extract (PyPDF2), chunking, embed+upsert to Pinecone, store file metadata in SQLite, list/delete/docs preview/favorite.
    - `query.py` — RAG endpoint `/query/ask`: retrieve → rerank → generate → log query. Also history endpoint.
    - `feedback.py` — submit feedback and admin stats.
  - `requirements.txt` — Python dependencies.

- `Frontend/` — React app (Vite): UI for auth, upload, chat, sources, feedback.
  - `App.jsx`, `main.jsx`, `index.html` — app bootstrap and routing.
  - `src/apis/axios.js` — centralized API client with JWT interceptor and exported functions for auth/upload/query/feedback.
  - `src/pages/` — main views: `Login.jsx`, `Upload.jsx`, `Chat.jsx`.
  - `src/components/` — reusable UI: `ChatBox.jsx`, `SourcePanel.jsx`, `FeedbackBtn.jsx`.
  - `src/context/ThemeContext.jsx` — theme provider (dark/light).
  - `src/styles/bayt.css` — styling used across app.

Key flows (concise)
-------------------
- Upload flow: user uploads PDF → `upload.py` extracts per-page text → chunking (500 words, 50 overlap) → `Embedder` creates embeddings → `Retriever.upsert_chunks` stores vectors in Pinecone → record saved in SQLite and file stored under `Backend/storage/`.
- Query flow: user asks question → `Retriever.search` fetches top-K vector matches → `Reranker.rerank` reranks top candidates → `Generator.generate` builds prompt (chunks with source tags) and calls Groq → result returned with list of sources and logged to DB.
- Auth: JWT tokens created on login/register; `axios` client attaches token and auto-logs-out on 401.
- Feedback: users submit thumbs up/down per query; admin/faculty can view aggregated stats.

Important files & why they matter
--------------------------------
- `Backend/main.py` — app startup and DB initialization (calls `init_db`).
- `Backend/core/embedder.py` — heavy model; singleton pattern to avoid reloading SciBERT.
- `Backend/core/retriever.py` — Pinecone integration; crucial for vector storage and queries.
- `Backend/core/reranker.py` — improves relevance with a cross-encoder.
- `Backend/core/generator.py` — constructs LLM prompt and formats output with citations.
- `Backend/db/database.py` — DB models and async session; contains migration-lite column additions.
- `Frontend/src/apis/axios.js` — central API interface; handles auth and request/response lifecycle.
- `Frontend/src/pages/Chat.jsx` — main UX for asking questions and viewing sources & feedback.

Environment & runtime notes
---------------------------
- Backend expects environment variables in `Backend/.env`: `GROQ_API_KEY`, `GROQ_MODEL`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `PINECONE_REGION`, `JWT_SECRET_KEY`, `DATABASE_URL`.
- Python reqs in `Backend/requirements.txt` (FastAPI, sentence-transformers, torch, pinecone, groq, etc.).
- Frontend: Node + Vite; `package.json` defines `dev`, `build`, `preview` scripts. `VITE_API_URL` optional env var for backend base URL.

Security & limitations (concise)
-------------------------------
- JWT + bcrypt used for auth; role-based checks applied in routes.
- Generator enforces strict prompt rules to avoid hallucination: responses should cite only provided sources and admit when insufficient evidence exists.
- Heavy ML dependencies (SciBERT, CrossEncoder, torch) require GPU or significant CPU/RAM; Pinecone and Groq require external accounts/keys.

Quick start (local)
-------------------
1. Backend: create venv, install, set `Backend/.env`, then run:

   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r Backend/requirements.txt
   cd Backend
   uvicorn main:app --reload

2. Frontend: install and run dev server:

   npm install
   npm run dev

Where to look for changes
-------------------------
- Add or change extraction/chunking: `Backend/routes/upload.py`.
- Change embedding model or batching: `Backend/core/embedder.py`.
- Change search/rerank behavior: `Backend/core/retriever.py` and `Backend/core/reranker.py`.
- Modify LLM prompt or model: `Backend/core/generator.py`.
- Update UI flows: `Frontend/src/pages/*` and `Frontend/src/components/*`.

Notes
-----
- The README contains detailed setup and architecture notes.
- Database migrations are handled lazily via `_ensure_uploaded_doc_columns` in `db/database.py` (no Alembic present).

End of summary.
