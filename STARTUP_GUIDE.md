# 🚀 RAG Academic Library - Startup Guide

## Quick Start (3 Steps)

### 1️⃣ Start Backend
```bash
cd ~/Desktop/IR_Project && source .venv/bin/activate && cd Backend && uvicorn main:app --reload
```

### 2️⃣ Start Frontend (New Terminal)
```bash
cd ~/Desktop/IR_Project && npm run dev
```

### 3️⃣ Open Browser
```
http://localhost:3000
```

You'll see the stunning 3D library login page! ✨

---

## 📋 First Time Setup

### Step 1: Register an Account
1. On the beautiful 3D login page, click the **"Register"** tab
2. Fill in:
   - First name
   - Last name
   - Email
   - Role (Student/Teacher/Administrator)
   - Password
   - Confirm password
3. Click **"Create Account"**
4. You'll be automatically logged in and redirected to Chat

### Step 2: Upload Your First PDF
1. Click **"📄 Upload"** in the sidebar
2. Drag & drop a PDF or click to browse
3. Wait for processing (10-30 seconds depending on size)
4. You'll see "✅ Document uploaded successfully"

### Step 3: Ask Questions
1. Click **"💬 Chat"** in the sidebar
2. Type a question about your document
3. Press Enter or click the send button
4. Get AI-powered answers with source citations!

---

## 🎨 UI Features to Try

### Beautiful 3D Login Page
- **Mouse Parallax:** Move your mouse over the login card - it rotates!
- **Animated Lantern:** Watch the flickering flame
- **Floating Dust:** Atmospheric particles drifting upward
- **Library Background:** Procedurally generated bookshelves

### Dark/Light Theme
- Click **"☀️ Light Mode"** or **"🌙 Dark Mode"** in sidebar
- Theme saves automatically
- Works on all pages

### Source Citations
- Click **"🔍 Sources"** in Chat to see where answers came from
- Each source shows:
  - Document name
  - Page number
  - Relevance score (color-coded)
  - Text excerpt
- Hover over score to see detailed metrics

### Document Management
- **Upload Page:** See all your documents
- **Download:** Click download icon
- **Delete:** Click trash icon
- **View Stats:** See total documents and chunks

---

## 🐛 Understanding Console Messages

When you first open the app, you might see:

### ❌ These Are NORMAL (Don't Worry!)

```
404 (Not Found) on /upload/docs/1
```
**Why:** Trying to load document #1 before any exist  
**Fix:** Upload a document first

```
422 (Unprocessable Entity) on /query/ask
```
**Why:** Trying to query before any documents exist  
**Fix:** Upload a document first

```
grm ERROR [iterable]
```
**Why:** Grammarly browser extension (harmless noise)  
**Fix:** Already filtered - you can ignore it

### ✅ These Mean Success

```
✅ Database initialized
✅ SciBERT loaded on cpu
✅ Pinecone connected
✅ Groq client ready
```

---

## 💡 Common Issues & Solutions

### Issue: "CORS policy" error
**Cause:** Backend not running or crashed  
**Solution:** 
```bash
cd Backend
uvicorn main:app --reload
```

### Issue: "401 Unauthorized"
**Cause:** Not logged in or token expired (60 min)  
**Solution:** Login again

### Issue: "No relevant documents found"
**Cause:** No documents uploaded yet  
**Solution:** Go to Upload page and upload a PDF

### Issue: Canvas background not showing
**Cause:** Browser compatibility  
**Solution:** Use Chrome, Firefox, Safari, or Edge (latest versions)

### Issue: 3D effect not working
**Cause:** Hardware acceleration disabled  
**Solution:** Enable in browser settings

---

## 🎯 Best Practices

### For Best Results

1. **Upload Academic PDFs**
   - SciBERT is optimized for scientific/academic content
   - Works best with: research papers, textbooks, technical documents

2. **Ask Specific Questions**
   - ❌ Bad: "Tell me about this document"
   - ✅ Good: "What is the main conclusion in section 3?"

3. **Upload Multiple Documents**
   - System works better with more diverse content
   - Better score distribution

4. **Check Sources**
   - Always review the source citations
   - Verify relevance scores
   - Read the excerpts

---

## 📊 Understanding Relevance Scores

| Score | Color | Meaning |
|-------|-------|---------|
| 80-100% | 🟢 Green | Highly relevant - trust completely |
| 60-79% | 🔵 Blue | Very relevant - good source |
| 40-59% | 🟠 Orange | Moderately relevant - verify |
| 0-39% | ⚪ Gray | Less relevant - cross-check |

**Tip:** Hover over the percentage to see raw scores!

---

## 🎨 Customization

### Change Theme
```javascript
// In sidebar, click:
☀️ Light Mode  // Switch to light
🌙 Dark Mode   // Switch to dark
```

### Adjust API Settings
Edit `Backend/.env`:
```env
GROQ_MODEL=llama-3.3-70b-versatile  # Change LLM model
JWT_EXPIRE_MINUTES=60               # Token lifetime
```

Edit `Frontend/.env`:
```env
VITE_API_URL=http://localhost:8000  # Backend URL
```

---

## 🔧 Development

### Backend Changes
- Edit Python files in `Backend/`
- Server auto-reloads (watch terminal)
- Check logs for errors

### Frontend Changes
- Edit React files in `Frontend/src/`
- Page hot-reloads automatically
- Check browser console (F12) for errors

### Database Reset
```bash
cd Backend
rm db/rag_library.db
# Restart backend - database recreates
```

---

## 📚 File Structure

```
IR_Project/
├── Backend/
│   ├── core/           # AI components
│   │   ├── embedder.py    # SciBERT
│   │   ├── retriever.py   # Pinecone
│   │   ├── reranker.py    # Cross-encoder
│   │   └── generator.py   # Groq LLM
│   ├── db/             # Database
│   │   └── database.py
│   ├── routes/         # API endpoints
│   │   ├── auth.py
│   │   ├── upload.py
│   │   ├── query.py
│   │   └── feedback.py
│   ├── main.py         # FastAPI app
│   ├── requirements.txt
│   └── .env            # Config
├── Frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginNew.jsx  # 3D login
│   │   │   ├── Chat.jsx
│   │   │   └── Upload.jsx
│   │   ├── components/
│   │   │   ├── ChatBox.jsx
│   │   │   └── SourcePanel.jsx
│   │   ├── context/
│   │   │   └── ThemeContext.jsx
│   │   └── apis/
│   │       └── axios.js
│   ├── styles/
│   │   └── LoginNew.css
│   └── .env
└── Documentation/
    ├── README.md
    ├── QUICKSTART.md
    └── This file!
```

---

## 🎯 Testing Checklist

After starting the app, test these:

- [ ] 3D login page loads with library background
- [ ] Mouse parallax works on login card
- [ ] Animated lantern flame flickers
- [ ] Dust particles float upward
- [ ] Can register new account
- [ ] Can login with account
- [ ] Upload page loads
- [ ] Can upload PDF (10-30 sec)
- [ ] Document appears in list
- [ ] Chat page loads
- [ ] Can ask question about document
- [ ] Answer appears with sources
- [ ] Can expand/collapse source citations
- [ ] Relevance scores show correctly
- [ ] Can toggle theme (light/dark)
- [ ] Theme persists on refresh
- [ ] Can delete document
- [ ] Can logout

---

## 🚀 Performance Tips

### Backend
- First query takes 5-10 seconds (loading models)
- Subsequent queries: 2-5 seconds
- Upload time depends on PDF size

### Frontend
- Canvas renders once (fast)
- Smooth 60fps animations
- Theme switch is instant

### Optimization
- Keep PDFs under 20MB
- Upload academic/technical documents
- Ask specific questions
- Use Chrome/Firefox for best performance

---

## 🎓 Learning Resources

### Documentation
- `README.md` - Complete project documentation
- `QUICKSTART.md` - Quick start guide
- `API_ENDPOINTS_REFERENCE.md` - API documentation
- `NEW_LOGIN_DESIGN.md` - Login page details
- `SCORE_EXPLANATION.md` - Understanding relevance scores

### API Docs
- Interactive: http://localhost:8000/docs
- Alternative: http://localhost:8000/redoc

---

## ✅ You're Ready!

**Everything is set up and ready to use!**

1. ✅ Backend running
2. ✅ Frontend running
3. ✅ Beautiful 3D login page
4. ✅ All features working
5. ✅ Documentation complete

**Just open http://localhost:3000 and start exploring!** 🎨✨

---

**Questions?** Check the documentation files or the API docs at http://localhost:8000/docs

**Happy researching!** 📚🚀
