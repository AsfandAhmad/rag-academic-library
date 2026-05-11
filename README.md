# 📚 RAG Academic Library System

A full-stack **Retrieval-Augmented Generation (RAG)** system for academic document search and question answering. Built with FastAPI, React, Pinecone, and Groq LLM.

---

## 🎯 Project Overview

This system allows users to:
- Upload academic PDF documents
- Ask questions about uploaded documents
- Get AI-generated answers with proper citations
- View source documents and relevance scores
- Provide feedback on answer quality
- Switch between dark and light themes

---

## 🏗️ Architecture

### **Backend (FastAPI + Python)**
- **FastAPI** - Modern async web framework
- **SQLite** - User data, query logs, feedback storage
- **Pinecone** - Vector database for document embeddings
- **SciBERT** - Academic text embeddings (768-dim)
- **Cross-Encoder** - Re-ranking retrieved documents
- **Groq LLM** - Answer generation with citations

### **Frontend (React + Vite)**
- **React 18** - UI framework
- **Vite** - Fast build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Context API** - Theme management

---

## 📂 Project Structure

```
IR_Project/
├── Backend/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── embedder.py       # SciBERT embeddings
│   │   ├── retriever.py      # Pinecone vector search
│   │   ├── reranker.py       # Cross-encoder re-ranking
│   │   └── generator.py      # Groq LLM answer generation
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py       # SQLAlchemy models
│   │   └── rag_library.db    # SQLite database (auto-created)
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py           # Authentication (JWT)
│   │   ├── upload.py         # PDF upload & processing
│   │   ├── query.py          # RAG query pipeline
│   │   └── feedback.py       # User feedback
│   ├── main.py               # FastAPI app entry point
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables
├── Frontend/
│   ├── src/
│   │   ├── apis/
│   │   │   └── axios.js      # API client
│   │   ├── components/
│   │   │   ├── ChatBox.jsx   # Message bubble
│   │   │   ├── SourcePanel.jsx  # Sources sidebar
│   │   │   └── FeedbackBtn.jsx  # Thumbs up/down
│   │   ├── context/
│   │   │   └── ThemeContext.jsx # Dark/Light theme
│   │   └── pages/
│   │       ├── Login.jsx     # Login/Register
│   │       ├── Upload.jsx    # PDF upload
│   │       └── Chat.jsx      # Chat interface
│   ├── App.jsx               # Root component
│   ├── main.jsx              # React entry point
│   └── index.html            # HTML template
├── vite.config.js            # Vite configuration
├── package.json              # Node dependencies
└── README.md                 # This file
```

---

## 🚀 Installation & Setup

### **Prerequisites**
- Python 3.10+
- Node.js 18+
- Pinecone account (free tier)
- Groq API key (free tier)

### **Step 1: Clone Repository**
```bash
cd ~/Desktop/IR_Project
```

### **Step 2: Backend Setup**

#### 2.1 Create Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

#### 2.2 Install Dependencies
```bash
pip install -r Backend/requirements.txt
```

#### 2.3 Configure Environment Variables
Edit `Backend/.env`:
```env
# Groq API (Get from: https://console.groq.com)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Pinecone (Get from: https://www.pinecone.io)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=rag-library
PINECONE_REGION=us-east-1

# JWT Authentication
JWT_SECRET_KEY=your_super_secret_key_change_this
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60

# Database
DATABASE_URL=sqlite+aiosqlite:///./db/rag_library.db
```

#### 2.4 Start Backend Server
```bash
cd Backend
uvicorn main:app --reload
```

Backend will run on: **http://localhost:8000**
API docs available at: **http://localhost:8000/docs**

---

### **Step 3: Frontend Setup**

#### 3.1 Install Dependencies
```bash
# From project root
npm install
```

#### 3.2 Start Frontend Server
```bash
npm run dev
```

Frontend will run on: **http://localhost:3000**

---

## 🔑 API Endpoints

### **Authentication**
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### **Upload**
- `POST /upload/pdf` - Upload PDF document
- `GET /upload/my-docs` - List user's documents
- `DELETE /upload/{doc_id}` - Delete document

### **Query**
- `POST /query/ask` - Ask question (RAG pipeline)
- `GET /query/history` - Get query history

### **Feedback**
- `POST /feedback/` - Submit feedback (thumbs up/down)
- `GET /feedback/stats` - Get feedback statistics (admin/faculty only)

---

## 🔄 RAG Pipeline Flow

```
1. User uploads PDF
   ↓
2. Extract text per page (PyPDF2)
   ↓
3. Split into chunks (500 words, 50-word overlap)
   ↓
4. Generate embeddings (SciBERT)
   ↓
5. Store in Pinecone vector database
   ↓
6. User asks question
   ↓
7. Embed query (SciBERT)
   ↓
8. Retrieve top-10 similar chunks (Pinecone)
   ↓
9. Re-rank with Cross-Encoder (top-5)
   ↓
10. Generate answer with citations (Groq LLM)
    ↓
11. Return answer + sources + response time
    ↓
12. Log query to SQLite
    ↓
13. User provides feedback (optional)
```

---

## 🎨 Features

### **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (Student, Faculty, Admin)
- Protected routes
- Auto-logout on token expiry

### **PDF Processing**
- Drag-and-drop upload
- 20MB file size limit
- Text extraction per page
- Automatic chunking with overlap
- Progress indicators

### **RAG Query System**
- Semantic search with SciBERT
- Re-ranking for relevance
- LLM answer generation
- Source attribution
- Response time tracking

### **User Interface**
- 🌓 **Dark/Light theme toggle**
- Responsive design
- Real-time chat interface
- Expandable source citations
- Feedback buttons
- Document management

### **Feedback System**
- Thumbs up/down rating
- Query-specific feedback
- Admin dashboard (stats endpoint)

---

## 🛠️ Technology Stack

### **Backend**
| Technology | Purpose |
|------------|---------|
| FastAPI | Web framework |
| SQLAlchemy | ORM |
| SQLite | Database |
| Pinecone | Vector database |
| SciBERT | Text embeddings |
| Cross-Encoder | Re-ranking |
| Groq | LLM inference |
| PyPDF2 | PDF parsing |
| JWT | Authentication |
| Bcrypt | Password hashing |

### **Frontend**
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| React Router | Routing |
| Axios | HTTP client |
| Context API | State management |

---

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control (RBAC)
- Protected API endpoints
- CORS configuration
- Input validation
- SQL injection prevention (ORM)

---

## 📊 Database Schema

### **Users**
- id, email, name, hashed_password, role, google_id, created_at

### **QueryLog**
- id, user_id, question, answer, sources (JSON), response_time, created_at

### **Feedback**
- id, user_id, query_id, rating (0/1), comment, created_at

### **UploadedDoc**
- id, user_id, filename, pinecone_ids (JSON), chunk_count, uploaded_at

---

## 🎯 Usage Guide

### **1. Register/Login**
- Open http://localhost:3000
- Click "Register" tab
- Enter name, email, password, and role
- Click "Create Account"

### **2. Upload Documents**
- Navigate to "Upload PDFs" page
- Drag and drop PDF or click to browse
- Wait for processing (extraction + embedding)
- View uploaded documents list

### **3. Ask Questions**
- Navigate to "Chat" page
- Type question in textarea
- Press Enter or click send button
- View answer with citations
- Click source count to expand details
- Provide feedback (thumbs up/down)

### **4. View Sources**
- Click "🔍 Sources" button in sidebar
- See all retrieved documents
- View relevance scores
- Read excerpts

### **5. Theme Toggle**
- Click "☀️ Light" or "🌙 Dark" button
- Theme preference saved in localStorage

---

## 🐛 Troubleshooting

### **Backend Issues**

**Error: "Module not found"**
```bash
# Ensure __init__.py files exist
touch Backend/routes/__init__.py
touch Backend/core/__init__.py
touch Backend/db/__init__.py
```

**Error: "Pinecone API key invalid"**
- Check `.env` file has correct `PINECONE_API_KEY`
- Verify key at https://www.pinecone.io

**Error: "Groq API error"**
- Check `.env` file has correct `GROQ_API_KEY`
- Verify key at https://console.groq.com

**Error: "Database locked"**
- Stop all running backend instances
- Delete `Backend/db/rag_library.db`
- Restart backend (will auto-create)

### **Frontend Issues**

**Blank screen**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**API connection error**
- Ensure backend is running on port 8000
- Check browser console for CORS errors
- Verify `vite.config.js` proxy settings

**Theme not working**
- Clear localStorage: `localStorage.clear()`
- Refresh page

---

## 📈 Performance Optimization

- **Singleton pattern** for model loading (Embedder, Retriever, Reranker, Generator)
- **Batch embedding** for multiple chunks
- **Async database** operations
- **Connection pooling** for Pinecone
- **Lazy loading** of AI models
- **Client-side caching** (localStorage)

---

## 🔮 Future Enhancements

- [ ] Google OAuth integration
- [ ] Document sharing between users
- [ ] Bulk PDF upload
- [ ] Export chat history
- [ ] Advanced search filters
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Mobile app
- [ ] Rate limiting
- [ ] Redis caching
- [ ] Docker deployment
- [ ] CI/CD pipeline

---

## 📝 License

This project is for educational purposes.

---

## 👥 Contributors

- **Your Name** - Full Stack Development

---

## 📞 Support

For issues or questions:
- Check API docs: http://localhost:8000/docs
- Review logs in terminal
- Check browser console (F12)

---

## 🙏 Acknowledgments

- **SciBERT** - Allen Institute for AI
- **Pinecone** - Vector database
- **Groq** - Fast LLM inference
- **FastAPI** - Modern Python web framework
- **React** - UI library

---

**Happy Coding! 🚀**
