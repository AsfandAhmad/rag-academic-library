# Backend Architecture & Logic Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [File Structure & Logic](#file-structure--logic)
4. [RAG Pipeline Workflow](#rag-pipeline-workflow)
5. [Frontend-Backend Connection](#frontend-backend-connection)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Data Flow Diagrams](#data-flow-diagrams)

---

## Overview

**Maktab e Kamil** is a Retrieval Augmented Generation (RAG) system that allows users to:
- Upload PDFs to a vector database
- Ask questions about their documents
- Receive AI-generated answers with proper citations
- Track query history and provide feedback

The backend uses:
- **FastAPI** - REST API framework
- **SciBERT** - Academic text embeddings (768-dimensional vectors)
- **Pinecone** - Vector database for semantic search
- **Cross-Encoder** - Re-ranking retrieved documents
- **Groq LLM** - Fast inference for answer generation
- **SQLAlchemy + SQLite** - User data & query logging
- **JWT** - Authentication & authorization

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend (3001)                     │
├─────────────────────────────────────────────────────────────────┤
│  Login → Upload PDF → Ask Question → View Results → Give Feedback │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP/JSON
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend (8000)                      │
├─────────────────────────────────────────────────────────────────┤
│  Routes: /auth, /upload, /query, /feedback                       │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐        │
│  │   Auth     │  │ Upload   │  │  Query   │  │Feedback │        │
│  │ Register   │  │ Extract  │  │ RAG      │  │ Logging │        │
│  │ Login      │  │ Chunk    │  │ Pipeline │  │ Rating  │        │
│  │ JWT Tokens │  │ Embed    │  │ Retrieve │  │         │        │
│  └────────────┘  └──────────┘  └──────────┘  └─────────┘        │
│          │              │              │                         │
│          ↓              ↓              ↓                         │
│  ┌──────────────────────────────────────┐                       │
│  │         Core RAG Engine              │                       │
│  │  ┌──────────┐  ┌──────────┐         │                       │
│  │  │Embedder  │  │Retriever │         │                       │
│  │  │(SciBERT) │  │(Pinecone)│         │                       │
│  │  └──────────┘  └──────────┘         │                       │
│  │  ┌──────────┐  ┌──────────┐         │                       │
│  │  │Reranker  │  │Generator │         │                       │
│  │  │(CrossEnc)│  │(Groq LLM)│         │                       │
│  │  └──────────┘  └──────────┘         │                       │
│  └──────────────────────────────────────┘                       │
│          │              │                                        │
│          ↓              ↓                                        │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ SQLite       │  │ Pinecone     │                            │
│  │ (Users,      │  │ (Vectors,    │                            │
│  │  QueryLogs,  │  │  Embeddings) │                            │
│  │  Feedback)   │  │              │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure & Logic

### 1. **main.py** - FastAPI Application Entry Point

**Purpose**: Initialize and configure the FastAPI app with all routes and middleware.

**Key Logic**:
```python
- Load environment variables from .env
- Initialize SQLite database on startup
- Setup CORS middleware (allows requests from localhost:3000 & 3001)
- Register four route modules: auth, upload, query, feedback
- Provide health check endpoints
```

**Key Code**:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    await init_db()
    yield
    # Shutdown: cleanup
```

**Frontend Connection**:
- Frontend makes requests to this app on `http://localhost:8000`
- CORS middleware allows cross-origin requests from frontend

---

### 2. **db/database.py** - Database Models & ORM

**Purpose**: Define SQLAlchemy models for all data stored in SQLite.

**Database Tables**:

#### `users` Table
```python
- id: Primary key
- email: Unique email for login
- name: User full name
- hashed_password: Bcrypt hashed password
- role: student/faculty/admin (Enum)
- google_id: For future OAuth integration
- created_at: Registration timestamp
```

#### `uploaded_docs` Table
```python
- id: Primary key
- user_id: Foreign key to users (who uploaded)
- filename: Original PDF filename
- pinecone_ids: JSON list of vector IDs stored in Pinecone
- chunk_count: How many chunks this PDF was split into
- uploaded_at: Timestamp
- category: Optional document category
- description: Optional description
- preview_text: First 200 chars for preview
- stored_path: Local filesystem path to PDF
- downloads: Download count (future feature)
- read_count: View count (future feature)
```

#### `query_logs` Table
```python
- id: Primary key
- user_id: Who asked the question
- question: User's question text
- answer: Generated answer
- sources: JSON array of source citations
- response_time: Seconds taken to generate answer
- created_at: Timestamp
```

#### `feedbacks` Table
```python
- id: Primary key
- user_id: Who gave feedback
- query_id: Which query they're rating
- rating: 1 (thumbs up) or 0 (thumbs down)
- comment: Optional comment
- created_at: Timestamp
```

#### `favorite_docs` Table
```python
- id: Primary key
- user_id: Who marked as favorite
- doc_id: Which document
- created_at: Timestamp
- Unique constraint: (user_id, doc_id) - each user can favorite each doc once
```

**Key Logic**:
```python
async def init_db():
    """Create all tables on FastAPI startup"""
    
async def get_db():
    """Dependency injection - provides DB session to routes"""
```

**Frontend Connection**:
- Frontend never directly accesses SQLite
- Backend uses this to store user sessions, query history, uploads
- Frontend receives data via API endpoints

---

### 3. **core/embedder.py** - Text Vectorization

**Purpose**: Convert text into 768-dimensional vectors using SciBERT (academic-focused model).

**Key Logic**:

#### Singleton Pattern
```python
class Embedder:
    _instance = None  # Load model only once
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()  # Lazy load on first access
        return cls._instance
```

**Why**: SciBERT is large (~100MB); loading once and reusing saves memory & time.

#### Methods:

**`embed_text(text: str) -> List[float]`**
- Converts single string → 768-dimensional vector
- Used for questions and individual chunks

**`embed_batch(texts: List[str]) -> List[List[float]]`**
- Converts multiple texts in batch (faster)
- Used during PDF upload when creating many embeddings
- Batch size = 32 for efficiency

**Why SciBERT?**
- Trained on scientific/academic papers
- Better for domain-specific text than general models
- Dimension = 768 (Pinecone requirement)

**Frontend Connection**:
- Frontend never calls embedder directly
- Called internally during PDF upload and query processing
- Embeddings are stored in Pinecone, not sent to frontend

---

### 4. **core/retriever.py** - Vector Database Interface

**Purpose**: Connect to Pinecone and retrieve semantically similar documents.

**Key Logic**:

#### Initialization
```python
def __init__(self):
    # Load API key from .env at runtime
    self.api_key = os.getenv("PINECONE_API_KEY")
    # Create Pinecone client
    self.pc = Pinecone(api_key=self.api_key)
    # Ensure index exists (create if missing)
    self._ensure_index()
```

#### `_ensure_index()`
- Checks if `rag-library` index exists in Pinecone
- Creates it if missing with:
  - **Dimension**: 768 (SciBERT output)
  - **Metric**: cosine similarity (how similar vectors are)
  - **Spec**: Serverless AWS in us-east-1 region

#### `upsert_chunks(chunks: List[Dict])`
```
chunks = [
    {
        "id": "unique_vector_id",
        "text": "chunk text content",
        "metadata": {
            "filename": "document.pdf",
            "page": 1,
            "user_id": 5,
            "text": "full text stored for later retrieval"
        }
    }
]

→ Embed each text using embedder.embed_batch()
→ Store in Pinecone with metadata
→ Return list of stored vector IDs for logging in SQLite
```

#### `search(query: str, top_k: int = 10) -> List[Dict]`
```
1. Embed user's question using SciBERT
2. Query Pinecone for top_k most similar vectors (cosine similarity)
3. Return: [
     {
         "id": "vector_id",
         "text": "chunk text",
         "filename": "doc.pdf",
         "page": 3,
         "score": 0.87  # similarity score 0-1
     },
     ...
   ]
```

**Frontend Connection**:
- Frontend never calls retriever directly
- Used internally during `/query/ask` request
- Results sent back as part of answer response

---

### 5. **core/reranker.py** - Re-Ranking Retrieved Results

**Purpose**: Use cross-encoder to re-rank retrieved chunks by relevance to the question.

**Why Re-rank?**
- Embedding search finds semantically similar text
- But may not match exact user intent
- Cross-encoder re-scores results specifically for (question, passage) relevance

**Model**: `cross-encoder/ms-marco-MiniLM-L-6-v2`
- Trained on Microsoft's MARCO dataset (Q&A passages)
- Implements SEER concept from academic paper

**Key Logic**:

#### `rerank(query: str, chunks: List[Dict], top_k: int = 5)`
```
1. Build (query, passage) pairs from retrieved chunks
   pairs = [(query, chunk["text"]), ...]

2. Score each pair using cross-encoder
   scores = model.predict(pairs)  → [0.45, 0.82, 0.61, ...]

3. Normalize scores to 0-1 range
   - Find min/max scores
   - Scale: (score - min) / (max - min)
   - Handles edge case where all scores are identical

4. Attach scores to each chunk
   chunk["rerank_score"] = 0.82

5. Sort by score descending
   Return top_k highest-scoring chunks
```

**Output Example**:
```python
[
    {
        "text": "...",
        "filename": "paper.pdf",
        "page": 5,
        "rerank_score": 0.92,  # ← normalized 0-1
        "raw_rerank_score": 2.15  # ← raw cross-encoder score
    },
    {
        "text": "...",
        "rerank_score": 0.78,
        ...
    }
]
```

**Frontend Connection**:
- Rerank scores sent to frontend in response
- Frontend displays as relevance indicators (shown in SourcePanel)
- Determines which sources appear in Source Panel

---

### 6. **core/generator.py** - Answer Generation with Groq LLM

**Purpose**: Generate AI responses to user questions using retrieved context.

**Model**: `llama-3.3-70b-versatile` (from Groq API)
- Fast inference (very low latency)
- Large context window (handles many sources)

**Key Logic**:

#### `build_prompt(query: str, chunks: List[Dict]) -> str`
```
Constructs prompt template:

1. System instructions:
   - Act as academic research assistant
   - Use ONLY provided sources
   - Always cite sources with [Source N]
   - If insufficient info, say so explicitly
   - Don't hallucinate

2. Context section:
   For each source chunk:
   [Source 1] File: paper.pdf | Page: 3
   <chunk text>
   
   [Source 2] File: book.pdf | Page: 15
   <chunk text>
   ...

3. User question:
   USER QUESTION:
   <user's actual question>

4. Empty answer placeholder
```

#### `generate(query: str, chunks: List[Dict]) -> Dict`
```
1. Build the full prompt with context
2. Send to Groq API via HTTP
3. Response format:
   {
       "answer": "Generated answer with [Source N] citations...",
       "sources": [
           {"filename": "paper.pdf", "page": 3, "text": "..."},
           {"filename": "book.pdf", "page": 15, "text": "..."}
       ]
   }
```

**Example Output**:
```
Generated Answer:
"According to the research [Source 1], climate change affects sea levels. 
This is further supported by data from [Source 2] showing temperature trends."

References:
[Source 1] paper.pdf, Page 5
[Source 2] book.pdf, Page 12
```

**Frontend Connection**:
- Backend returns answer + sources in JSON
- Frontend displays answer in ChatBox
- Frontend displays sources in SourcePanel with citations

---

### 7. **routes/auth.py** - User Authentication & Authorization

**Purpose**: Handle user registration, login, and JWT token management.

**Key Models**:
```python
class RegisterRequest(BaseModel):
    email: str      # Must be valid email
    name: str       # User's full name
    password: str   # Plain text (hashed on backend)
    role: UserRole  # student/faculty/admin (default: student)

class TokenResponse(BaseModel):
    access_token: str  # JWT token
    token_type: str    # "bearer"
    user: dict         # {id, email, name, role}
```

**Key Logic**:

#### `hash_password(password: str) -> str`
```
- Use bcrypt algorithm
- Handle 72-byte UTF-8 limit
- Never store plain text passwords
```

#### `create_token(data: dict) -> str`
```
1. Create JWT payload with:
   - sub: user_id (subject)
   - role: user_role
   - exp: expiration time (default: 60 minutes from now)

2. Sign with:
   - SECRET_KEY from .env
   - ALGORITHM: HS256 (HMAC-SHA256)

3. Return token string (format: eyJhbGc... <header>.<payload>.<signature>)
```

#### `get_current_user(token: str) -> User`
```
1. Extract token from Authorization header
2. Decode JWT with SECRET_KEY
3. Extract user_id from payload
4. Query SQLite for User record
5. Return User or raise 401 error

This is used as a Dependency in all protected routes.
```

#### `@router.post("/register")`
```
1. Check if email already exists
   - If yes: return 400 "Email already registered"
2. Hash password with bcrypt
3. Create User record in SQLite
4. Generate JWT token
5. Return token + user data
```

#### `@router.post("/login")`
```
1. Extract email & password from form data
2. Find user by email in SQLite
3. Verify password using bcrypt
4. If match: generate JWT token and return
5. If not match: return 401 "Invalid email or password"
```

#### `@router.get("/me")`
```
1. Use get_current_user dependency (validates token)
2. Return current user's info (id, email, name, role)
3. Used by frontend to check if logged in
```

#### `require_role(*roles: UserRole)` - RBAC
```
Dependency factory for role-based access control.
Example: @router.post("/admin", dependencies=[Depends(require_role(UserRole.admin))])
- Only admin users can access
```

**Frontend Connection**:
- Frontend sends `/auth/register` with email, password, name
- Frontend sends `/auth/login` with email, password (URL-encoded)
- Backend returns JWT token
- Frontend stores token in localStorage
- Frontend includes token in all subsequent requests:
  ```
  Authorization: Bearer <token>
  ```
- Backend validates token on each protected request
- If token invalid/expired: return 401, frontend redirects to login

---

### 8. **routes/upload.py** - PDF Upload & Chunking

**Purpose**: Handle PDF uploads, extract text, create embeddings, store in vector DB.

**Key Logic**:

#### `extract_text_from_pdf(file_bytes: bytes) -> List[Dict]`
```
Using PyPDF2:
1. Parse PDF binary data
2. For each page:
   - Extract text using OCR/text extraction
   - Return: {"page": 1, "text": "page content"}
3. Filter empty pages

Returns: [
    {"page": 1, "text": "Introduction..."},
    {"page": 2, "text": "Methods..."},
    ...
]
```

#### `chunk_text(text: str, chunk_size: int, overlap: int) -> List[str]`
```
Split text into overlapping chunks:

Example: text = "word1 word2 word3 word4 word5..."
         chunk_size = 10, overlap = 2

Chunk 1: word1 word2 ... word10
Chunk 2:           word9 word10 word11 ... word19
Chunk 3:                          word18 word19 ... word27
...

Why overlap? 
- Prevents losing context at chunk boundaries
- Chunk 2 starts at word 9 (2 words before Chunk 1 ends)
- Better semantic coherence
```

#### `@router.post("/pdf")` - Upload PDF Endpoint
```
1. Validate:
   - User must be authenticated (JWT token)
   - File must be .pdf
   - File size < 20MB

2. Extract text from PDF pages
   pages = extract_text_from_pdf(file_bytes)

3. Chunk each page:
   For each page:
     - Split into overlapping chunks
     - Create unique ID: f"{filename}_{page}_{idx}_{uuid}"
     - Store: {id, text, metadata: {filename, page, chunk, user_id}}

4. Embed chunks:
   - Use Embedder to convert all chunks to vectors
   - Batch embedding for efficiency

5. Store in Pinecone:
   - Upsert vectors with metadata
   - Get back list of stored vector IDs

6. Save to SQLite:
   - Create UploadedDoc record
   - Store filename, user_id, pinecone_ids, chunk_count
   - Save PDF file to disk in /storage/

7. Return success response:
   {
       "doc_id": 42,
       "filename": "document.pdf",
       "chunks": 150,
       "message": "Successfully uploaded and indexed"
   }
```

**Frontend Connection**:
- Frontend sends multipart form with PDF file
- Frontend displays upload progress (if using uploadPDFWithProgress)
- Backend processes in background
- Frontend receives doc_id to track upload
- Uploaded docs appear in Sidebar

---

### 9. **routes/query.py** - RAG Query Processing

**Purpose**: Process user questions through full RAG pipeline.

**Models**:
```python
class QueryRequest(BaseModel):
    question: str        # User's question
    top_k_fetch: int = 10    # Retrieve this many from Pinecone
    top_k_rerank: int = 5    # Re-rank to this many

class QueryResponse(BaseModel):
    query_id: int        # Log ID for reference
    question: str        # Echo back question
    answer: str          # Generated answer
    sources: List[Dict]  # Citation sources
    response_time: float # Seconds taken
```

#### `@router.post("/ask")` - Full RAG Pipeline

**Step 1: Validate**
```python
- User must be authenticated (JWT required)
- Question cannot be empty
- Check question.strip() has content
```

**Step 2: Retrieve from Vector DB**
```python
retriever = get_retriever()
raw_chunks = retriever.search(question, top_k=10)

Calls Pinecone:
- Embeds question to 768D vector
- Finds top-10 most similar chunks by cosine similarity
- Returns: [
    {
        "text": "chunk text",
        "filename": "doc.pdf",
        "page": 5,
        "score": 0.87
    },
    ...
  ]
```

**Step 3: Re-rank for Relevance**
```python
reranker = get_reranker()
ranked_chunks = reranker.rerank(question, raw_chunks, top_k=5)

For each (question, passage) pair:
- Score relevance using cross-encoder
- Sort by relevance score descending
- Keep only top-5 most relevant

Output: [
    {
        "text": "most relevant chunk",
        "rerank_score": 0.95,
        "filename": "doc.pdf",
        "page": 5
    },
    ...
  ]
```

**Step 4: Generate Answer**
```python
generator = get_generator()
result = generator.generate(question, ranked_chunks)

- Build prompt with context from top-5 chunks
- Call Groq LLM
- Get back answer with citations

Returns: {
    "answer": "Based on [Source 1]... [Source 2]...",
    "sources": [
        {"filename": "doc.pdf", "page": 5, "text": "..."},
        ...
    ]
}
```

**Step 5: Log Query**
```python
# Create QueryLog record in SQLite
log = QueryLog(
    user_id = current_user.id,
    question = question,
    answer = result["answer"],
    sources = json.dumps(result["sources"]),
    response_time = response_time  # seconds
)

# Save to SQLite for history
db.add(log)
await db.commit()
```

**Step 6: Return Response**
```json
{
    "query_id": 42,
    "question": "What is machine learning?",
    "answer": "Machine learning... [Source 1]... [Source 2]...",
    "sources": [
        {
            "filename": "textbook.pdf",
            "page": 12,
            "text": "Machine learning is..."
        }
    ],
    "response_time": 3.45
}
```

**Frontend Connection**:
- Frontend sends `{question: "user input"}` to `/query/ask`
- Backend processes through RAG pipeline (takes 2-5 seconds)
- Frontend receives answer in ChatBox
- Frontend displays sources in SourcePanel
- Frontend logs response time

#### `@router.get("/history")` - Query History
```
Returns last 20 queries by current user:
[
    {
        "id": 42,
        "question": "What is...",
        "answer": "..." (truncated to 300 chars),
        "response_time": 3.45,
        "created_at": "2024-01-15T10:30:00"
    },
    ...
]

Used by frontend to show chat history.
```

---

### 10. **routes/feedback.py** - User Feedback & Rating

**Purpose**: Log user ratings on answer quality.

#### `@router.post("/")` - Submit Feedback
```python
{
    "query_id": 42,
    "rating": 1,        # 1 = thumbs up, 0 = thumbs down
    "comment": "Great answer!"  # Optional
}

Creates Feedback record in SQLite:
- Links to Query via query_id
- Links to User via current_user
- Stores rating (binary: good/bad)
- Stores optional comment

Used for ML model improvement and quality tracking.
```

---

## RAG Pipeline Workflow

### Complete End-to-End Flow

```
╔═══════════════════════════════════════════════════════════════════╗
║                    USER UPLOADS PDF                               ║
╚═════════════════════════╦═════════════════════════════════════════╝
                          │
                          ↓
        ┌─────────────────────────────────┐
        │ 1. PDF Upload Handler           │
        │    - Validate file format       │
        │    - Extract text per page      │
        │    - Chunk into 500-word pieces │
        │      with 50-word overlap       │
        └──────────────┬────────────────┬─┘
                       │                │
                       ↓                ↓
        ┌──────────────────┐  ┌─────────────────────┐
        │ 2a. Embedder     │  │ 2b. Store metadata  │
        │ - SciBERT model  │  │ - SQLite UploadedDoc│
        │ - 768-D vectors  │  │ - File path         │
        │ - Batch encode   │  │ - Chunk count       │
        └────────┬─────────┘  └─────────────────────┘
                 │
                 ↓
        ┌────────────────────┐
        │ 3. Pinecone Store  │
        │ - Upsert vectors   │
        │ - Store metadata   │
        │ - Index for search │
        └────────────────────┘
                 │
        ╔════════╩════════╗
        │  PDF Uploaded! │
        └════════════════┘

════════════════════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════════════════╗
║               USER ASKS QUESTION IN CHAT                          ║
╚═════════════════════════╦═════════════════════════════════════════╝
                          │
                          ↓
        ┌──────────────────────────┐
        │ 1. Validate Query        │
        │ - Check authenticated    │
        │ - Check not empty        │
        │ - Timestamp              │
        └────────────┬─────────────┘
                     │
                     ↓
        ┌──────────────────────────┐
        │ 2. Embed Question        │
        │ - SciBERT encodes Q      │
        │ - Produces 768-D vector  │
        └────────────┬─────────────┘
                     │
                     ↓
        ┌──────────────────────────┐
        │ 3. Retrieve (Pinecone)   │
        │ - Cosine similarity      │
        │ - Top-10 chunks          │
        │ - Score: 0.45-0.95       │
        └────────────┬─────────────┘
                     │
                     ↓
        ┌──────────────────────────┐
        │ 4. Re-rank               │
        │ - Cross-encoder          │
        │ - Re-score (Q, passage)  │
        │ - Keep top-5             │
        │ - Normalize 0-1          │
        └────────────┬─────────────┘
                     │
                     ↓
        ┌──────────────────────────┐
        │ 5. Generate Answer       │
        │ - Build prompt           │
        │ - Groq LLM inference     │
        │ - Extract citations      │
        └────────────┬─────────────┘
                     │
        ╔════════════╩════════════╗
        │ 6. Log Query            │ → SQLite: QueryLog
        │ - Store Q + A           │
        │ - Store sources         │
        │ - Response time         │
        └────────────┬────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │ RETURN RESPONSE            │
        │ {                          │
        │   answer: "...[Source 1]...",
        │   sources: [...],          │
        │   response_time: 3.45,     │
        │   query_id: 42             │
        │ }                          │
        └────────────────────────────┘
                     │
        ╔════════════╩════════════╗
        │  Response sent to       │
        │  React Frontend         │
        └════════════════════════╝
```

---

## Frontend-Backend Connection

### Authentication Flow

```
┌─────────────────────┐
│   React Frontend    │
│ (localhost:3000)    │
└────────────┬────────┘
             │
             ├─→ POST /auth/register
             │   {email, name, password, role}
             │
             ├─→ POST /auth/login
             │   {username: email, password}  (form-urlencoded)
             │
             ↓
    ┌────────────────────┐
    │ FastAPI Backend    │
    │ (localhost:8000)   │
    └────────┬───────────┘
             │
             ├─ Hash password (bcrypt)
             ├─ Create/verify User in SQLite
             ├─ Generate JWT token
             │
             ↓
    ┌─────────────────────────────┐
    │ Return TokenResponse        │
    │ {                           │
    │   access_token: "eyJ...",   │
    │   token_type: "bearer",     │
    │   user: {id, email, name, role}
    │ }                           │
    └────────┬────────────────────┘
             │
             ↓
    ┌────────────────────────────┐
    │ Frontend stores in         │
    │ localStorage:              │
    │ - token: "eyJ..."          │
    │ - user: {id, email, name}  │
    └────────┬───────────────────┘
             │
    ┌────────↓──────────────────┐
    │ Include token in every    │
    │ subsequent request:       │
    │ Authorization: Bearer ... │
    └──────────────────────────┘
```

### Request/Response Flow

```
Frontend API Call (axios.js):

const response = await askQuestion({question: "What is ML?"})

↓↓↓

POST http://localhost:8000/query/ask
Headers: {
    Content-Type: application/json,
    Authorization: Bearer eyJ...  ← Added by interceptor
}
Body: {
    question: "What is ML?"
}

↓↓↓ (Backend processes through RAG pipeline) ↓↓↓

Response:
{
    query_id: 42,
    question: "What is ML?",
    answer: "Machine learning is... [Source 1]...",
    sources: [
        {filename: "textbook.pdf", page: 12, text: "..."},
        {filename: "paper.pdf", page: 5, text: "..."}
    ],
    response_time: 3.45
}

↓↓↓

Frontend updates state:
- messages array: add assistant message
- sources array: add new sources
- loading: set to false
- Display in ChatBox and SourcePanel
```

### Data Persistence

```
Frontend (React):
└─ useState (volatile - lost on refresh)
   └─ localStorage (persistent - survives refresh)
      └─ token: JWT for authentication
      └─ user: {id, email, name}

Backend (SQLite):
├─ Users table
│  └─ Stores user account info
├─ UploadedDocs table
│  └─ Tracks which PDFs user uploaded
├─ QueryLogs table
│  └─ Stores all questions and answers
└─ Feedbacks table
   └─ Stores user ratings
```

---

## API Endpoints Reference

### Authentication Routes

```
POST /auth/register
├─ Request: {email, name, password, role}
├─ Response: {access_token, token_type, user}
├─ Auth: None (public)
└─ Errors: 400 (email taken)

POST /auth/login
├─ Request: form-urlencoded {username, password}
├─ Response: {access_token, token_type, user}
├─ Auth: None (public)
└─ Errors: 401 (invalid credentials)

GET /auth/me
├─ Request: None
├─ Response: {id, email, name, role}
├─ Auth: Required (JWT)
└─ Errors: 401 (invalid/expired token)
```

### Upload Routes

```
POST /upload/pdf
├─ Request: multipart form {file, category?, description?}
├─ Response: {doc_id, filename, chunks, message}
├─ Auth: Required (JWT)
├─ Process:
│  1. Extract PDF text
│  2. Chunk text (500 words, 50 overlap)
│  3. Embed chunks (SciBERT)
│  4. Store in Pinecone
│  5. Log in SQLite
└─ Errors: 400 (invalid file), 413 (too large)

GET /upload/docs
├─ Request: None
├─ Response: [{doc_id, filename, chunk_count, uploaded_at, category}, ...]
├─ Auth: Required (JWT)
└─ Returns: All user's uploaded PDFs

DELETE /upload/docs/{doc_id}
├─ Request: None
├─ Response: {message: "Deleted"}
├─ Auth: Required (JWT)
└─ Deletes:
   1. From SQLite (UploadedDoc, Pinecone IDs logged)
   2. From local storage
   3. From Pinecone (vectors)
```

### Query Routes

```
POST /query/ask
├─ Request: {question, top_k_fetch?, top_k_rerank?}
├─ Response: {query_id, question, answer, sources, response_time}
├─ Auth: Required (JWT)
├─ Pipeline:
│  1. Embed question (SciBERT)
│  2. Retrieve top-10 (Pinecone)
│  3. Re-rank top-5 (Cross-encoder)
│  4. Generate answer (Groq LLM)
│  5. Log to SQLite
├─ Response time: 2-5 seconds
└─ Errors: 404 (no docs uploaded), 400 (empty question)

GET /query/history
├─ Request: None
├─ Response: [{id, question, answer, response_time, created_at}, ...] (last 20)
├─ Auth: Required (JWT)
└─ Returns: User's past queries for history
```

### Feedback Routes

```
POST /feedback/
├─ Request: {query_id, rating, comment?}
├─ Response: {id, message: "Feedback recorded"}
├─ Auth: Required (JWT)
├─ Stores: User's rating (1=good, 0=bad)
└─ Used for: Quality tracking & model improvement
```

---

## Data Flow Diagrams

### PDF Upload Data Flow

```
User Browser
    │
    ├─→ Select PDF file
    ├─→ POST /upload/pdf (multipart/form-data)
    │   Headers: {Authorization: Bearer <token>}
    │   Body: {file: binary_pdf, category?: "...", description?: "..."}
    │
    ↓ Network
    
FastAPI Backend
    │
    ├─→ routes/upload.py handler
    ├─→ PyPDF2.extract_text() → raw text per page
    ├─→ chunk_text() → break into 500-word pieces
    ├─→ Embedder.embed_batch() → SciBERT vectors (768-D)
    ├─→ Retriever.upsert_chunks() → Pinecone storage
    │   - Store vectors with cosine metric
    │   - Attach metadata (filename, page, user_id)
    │
    ├─→ Save local file: /Backend/storage/<uuid>_<filename>
    ├─→ Create UploadedDoc in SQLite:
    │   - filename, pinecone_ids, chunk_count, user_id
    │
    ↓ Network
    
Response: {doc_id: 42, filename: "...", chunks: 150}
    │
    ↓ Browser
    
Update React state:
    - Add to docs array
    - Refresh Sidebar
    - Show success message
```

### Question & Answer Data Flow

```
User Browser (Chat.jsx)
    │
    ├─ User types: "What is machine learning?"
    ├─ Click Send or press Enter
    ├─ POST /query/ask
    │  Headers: {Authorization: Bearer <token>}
    │  Body: {question: "What is machine learning?"}
    │
    ↓ Network (2-5 seconds)
    
FastAPI Backend (routes/query.py)
    │
    ├─ Step 1: Embed question
    │  └─ Embedder.embed_text("What is...") → 768-D vector
    │
    ├─ Step 2: Retrieve from Pinecone
    │  └─ Retriever.search(query, top_k=10)
    │     Pinecone API:
    │     - Query with 768-D vector
    │     - Cosine similarity search
    │     - Return top-10 chunks with scores
    │
    │  Raw results: [{text: "...", score: 0.87}, ...]
    │
    ├─ Step 3: Re-rank
    │  └─ Reranker.rerank(question, chunks, top_k=5)
    │     Cross-encoder model:
    │     - Score (question, each_chunk)
    │     - Sort by score descending
    │     - Return top-5 with normalized scores
    │
    │  Re-ranked: [{text: "...", rerank_score: 0.92}, ...]
    │
    ├─ Step 4: Generate answer
    │  └─ Generator.generate(question, ranked_chunks)
    │     Build prompt: "You are assistant... Here is context... Q: ..."
    │     Call Groq LLM API:
    │     - Send prompt
    │     - Get response with [Source 1], [Source 2] citations
    │
    │  Generated: {answer: "...text...[Source 1]...", sources: [...]}
    │
    ├─ Step 5: Log query
    │  └─ QueryLog(user_id, question, answer, sources, response_time)
    │     SQLite insert:
    │     - Store full answer
    │     - Store sources as JSON
    │     - Store response_time
    │
    ↓ Network
    
Response JSON:
{
    query_id: 42,
    question: "What is machine learning?",
    answer: "Machine learning is...technology [Source 1]...models [Source 2]...",
    sources: [
        {filename: "textbook.pdf", page: 12, text: "ML is a subset of AI..."},
        {filename: "paper.pdf", page: 5, text: "Modern ML systems use..."}
    ],
    response_time: 3.45
}
    │
    ↓ Browser
    
React ChatBox (Chat.jsx):
    │
    ├─ Update messages state:
    │  └─ Add {role: "assistant", content: answer, response_time: 3.45}
    │
    ├─ Update sources state:
    │  └─ setSources([...sources_from_response])
    │
    ├─ Display in ChatBox component:
    │  ├─ Render answer text with citations
    │  └─ Show "Response time: 3.45s"
    │
    ├─ Display in SourcePanel component:
    │  ├─ Show source cards
    │  ├─ Display filename, page, rerank_score
    │  ├─ Show excerpt text
    │  └─ Allow filtering by score
```

---

## Key Technologies & Why They're Used

| Component | Technology | Why |
|-----------|-----------|-----|
| **API Framework** | FastAPI | Fast async, auto OpenAPI docs, type hints |
| **Authentication** | JWT (HS256) | Stateless, secure, works with SPA frontend |
| **Password Hashing** | bcrypt | Industry standard, resistant to attacks |
| **Text Embeddings** | SciBERT (768-D) | Academic text domain, well-validated |
| **Vector Search** | Pinecone | Managed service, cosine similarity, serverless |
| **Re-ranking** | Cross-Encoder (MARCO) | Better relevance than embedding similarity alone |
| **LLM Inference** | Groq | Fast, low latency, good for chat |
| **PDF Processing** | PyPDF2 | Simple, reliable text extraction |
| **Database** | SQLite + SQLAlchemy | Lightweight, async ORM, good for prototyping |
| **Async Runtime** | AsyncIO + Uvicorn | Handles concurrent requests efficiently |

---

## Security Considerations

```
✅ Implemented:
- JWT tokens with expiration (60 min default)
- Bcrypt password hashing (72-byte limit handled)
- CORS middleware (only allow localhost:3000, 3001)
- SQL injection prevention (SQLAlchemy parameterized queries)
- Authentication on all protected endpoints
- Rate limiting not implemented (could add)

⚠️ Future Improvements:
- Add refresh token rotation
- Implement rate limiting per user
- Add HTTPS in production
- Validate file content (not just extension)
- Sanitize user inputs
- Add request size limits
- Monitor for suspicious patterns
```

---

## Performance Characteristics

```
PDF Upload (for 100-page PDF):
├─ Text extraction: ~2-3 seconds
├─ Chunking: ~0.5 seconds
├─ Embedding (batch): ~5 seconds (100-150 chunks)
├─ Pinecone upsert: ~2 seconds
└─ Total: ~10 seconds

Query Processing:
├─ Embedding question: ~0.3 seconds
├─ Pinecone retrieve: ~0.5 seconds (top-10)
├─ Re-ranking (cross-encoder): ~1 second (10→5)
├─ LLM generation (Groq): ~1.5 seconds
├─ Database logging: ~0.1 seconds
└─ Total: ~3.5 seconds average (2-5 sec range)

Pinecone Storage:
├─ 768-D vectors
├─ ~1000 vectors = 1.5MB storage
├─ One 100-page PDF ≈ 150 chunks ≈ 225KB
└─ Pricing: Pay-as-you-go based on storage/queries
```

---

## Troubleshooting Common Issues

### Issue: 422 Unprocessable Entity
**Cause**: Request validation failed or token missing
**Solution**: 
- Check Authorization header includes Bearer token
- Validate request body matches schema
- Check token not expired (JWT expires in 60 min)

### Issue: Pinecone Connection Error
**Cause**: API key invalid or index not created
**Solution**:
- Verify PINECONE_API_KEY in .env
- Check index name matches PINECONE_INDEX_NAME
- Ensure AWS region is correct

### Issue: Query Returns No Results
**Cause**: No PDFs uploaded or keywords don't match
**Solution**:
- Upload at least one PDF first
- Try rephrasing question
- Check Pinecone has vectors (check index stats)

### Issue: Slow Response Times
**Cause**: 
- Large number of chunks (>100)
- Network latency to Pinecone/Groq
- LLM inference queue
**Solution**:
- Optimize chunk size
- Reduce top_k_fetch
- Scale Groq plan

---

## Future Enhancements

1. **Multi-user document sharing**
   - Share PDFs with other users
   - Collaborative annotations

2. **Advanced filtering**
   - Search by date range
   - Filter by source type
   - Tag-based organization

3. **Export features**
   - Download answers as PDF
   - Export chat history
   - Generate reports

4. **Admin dashboard**
   - User analytics
   - Query performance metrics
   - System health monitoring

5. **Fine-tuned models**
   - Domain-specific LLM
   - Custom embeddings
   - Specialized re-ranker

6. **Multi-language support**
   - Translate questions
   - Multilingual embeddings
   - Regional deployments

---

**Last Updated**: June 6, 2026
**Backend Version**: 1.0.0
**RAG Pipeline**: Complete implementation
