# Quick Reference Guide

## 🚀 Starting the Application

### Backend
```bash
cd Backend
source ../.venv/bin/activate
uvicorn main:app --reload
```
**URL:** http://localhost:8000

### Frontend
```bash
npm run dev
```
**URL:** http://localhost:3000

---

## 🧪 Testing

### Run All API Tests
```bash
./test_all_apis.sh
```

### Test Individual Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","name":"User","password":"pass123","role":"student"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@test.com&password=pass123"
```

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| `README.md` | Complete project documentation |
| `QUICKSTART.md` | Quick start guide |
| `PROJECT_SUMMARY.md` | Project overview |
| `DEPLOYMENT_CHECKLIST.md` | Deployment guide |
| `STATUS_REPORT.md` | Current project status |
| `FIXES_APPLIED.md` | All fixes applied |
| `LATEST_FIXES.md` | Most recent fixes |
| `API_TEST_RESULTS.md` | API test results |
| `QUICK_REFERENCE.md` | This file |

---

## 🔑 Key URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |
| OpenAPI JSON | http://localhost:8000/openapi.json |

---

## 🎨 Theme Toggle

**Location:** Sidebar navigation (both Chat and Upload pages)

**Button Text:**
- Dark mode: "🌙 Dark Mode"
- Light mode: "☀️ Light Mode"

**Persistence:** Theme preference saved in localStorage

---

## 🔧 Common Issues & Solutions

### Issue: CORS Error
**Solution:** Backend crashed. Check backend logs and restart.

### Issue: 404 on API calls
**Solution:** 
1. Check if backend is running
2. Verify you're logged in
3. Check token hasn't expired (60min)
4. Clear browser cache

### Issue: "No relevant documents found"
**Solution:** Upload PDF documents first via Upload page

### Issue: Grammarly console errors
**Solution:** Already filtered in `index.html`

---

## 📦 Environment Variables

### Backend (.env)
```env
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=rag-library
PINECONE_REGION=us-east-1
JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
DATABASE_URL=sqlite+aiosqlite:///./db/rag_library.db
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

---

## 🎯 User Roles

| Role | Description |
|------|-------------|
| `student` | Regular user, can upload and query |
| `faculty` | Faculty member, same permissions |
| `admin` | Administrator, same permissions |

**Note:** All roles currently have same permissions. RBAC can be extended.

---

## 📊 API Endpoints Quick Reference

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

### Upload
- `POST /upload/pdf` - Upload PDF (multipart/form-data)
- `GET /upload/my-docs` - Get user's documents
- `DELETE /upload/{doc_id}` - Delete document

### Query
- `POST /query/ask` - Ask question (JSON: `{"question": "..."}`)
- `GET /query/history` - Get query history

### Feedback
- `POST /feedback/` - Submit feedback (JSON: `{"query_id": 1, "rating": 1, "comment": "..."}`)

---

## 🔐 Authentication

### Getting a Token
1. Register or login via API
2. Extract `access_token` from response
3. Include in requests: `Authorization: Bearer <token>`

### Token Expiry
- **Lifetime:** 60 minutes
- **Renewal:** Login again to get new token
- **Auto-logout:** Frontend redirects to login on 401

---

## 🎨 Color Palette

### Dark Theme (Default)
```javascript
bg: '#0f172a'           // Slate-900
bgSecondary: '#1e293b'  // Slate-800
text: '#f1f5f9'         // Slate-100
primary: '#3b82f6'      // Blue-500
```

### Light Theme
```javascript
bg: '#ffffff'           // White
bgSecondary: '#f8fafc'  // Slate-50
text: '#0f172a'         // Slate-900
primary: '#3b82f6'      // Blue-500
```

---

## 🐛 Debugging

### Check Backend Logs
Backend runs in terminal, check for errors there.

### Check Frontend Console
Open browser DevTools (F12) → Console tab

### Check Network Requests
DevTools → Network tab → Filter by XHR

### Check Database
```bash
sqlite3 Backend/db/rag_library.db
.tables
SELECT * FROM users;
```

---

## 📈 Performance

### Expected Response Times
- Health check: < 10ms
- Authentication: < 100ms
- Document list: < 50ms
- PDF upload: 5-30 seconds (depends on size)
- Query with RAG: 2-5 seconds

### Optimization Tips
1. Keep PDFs under 20MB
2. Upload academic papers (SciBERT optimized for this)
3. Ask specific questions
4. Use re-ranking (already enabled)

---

## ✅ Verification Checklist

Before considering the app "working":

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can register new user
- [ ] Can login
- [ ] Can upload PDF
- [ ] Can view uploaded documents
- [ ] Can ask questions
- [ ] Can view sources
- [ ] Can toggle theme
- [ ] Theme persists on refresh
- [ ] Can submit feedback
- [ ] Can delete documents
- [ ] Can logout

---

## 🎓 Tech Stack

### Backend
- FastAPI (Python web framework)
- SQLite (database)
- Pinecone (vector store)
- SciBERT (embeddings)
- Groq (LLM)
- Cross-encoder (re-ranking)

### Frontend
- React 18
- Vite (build tool)
- React Router (navigation)
- Axios (HTTP client)
- Context API (state management)

---

## 📞 Support

### Documentation
- Check `README.md` for detailed info
- Check `API_TEST_RESULTS.md` for API verification
- Check `FIXES_APPLIED.md` for troubleshooting

### Testing
- Run `./test_all_apis.sh` to verify all APIs
- Check http://localhost:8000/docs for interactive API testing

---

**Last Updated:** May 11, 2026  
**Status:** ✅ All systems operational
