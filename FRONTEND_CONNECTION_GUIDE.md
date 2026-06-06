# Frontend Architecture & Connection Guide

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Frontend Architecture](#frontend-architecture)
4. [API Configuration & Axios Setup](#api-configuration--axios-setup)
5. [Routing & Navigation](#routing--navigation)
6. [Components & Their Logic](#components--their-logic)
7. [State Management & Data Flow](#state-management--data-flow)
8. [API Calls Reference](#api-calls-reference)
9. [Error Handling & Debugging](#error-handling--debugging)
10. [Common Issues & Solutions](#common-issues--solutions)

---

## Overview

**Frontend Stack**:
- **React 18.3.1** - UI framework
- **Vite 6.4.2** - Build tool
- **React Router v6** - Routing
- **Axios 1.6.0** - HTTP client
- **CSS (No Tailwind)** - Three stylesheet system (bayt.css, theme.css, LoginNew.css)

**Purpose**: Single Page Application (SPA) that allows users to:
1. Register/Login with JWT authentication
2. Upload PDF documents
3. Ask questions about uploaded documents
4. View AI-generated answers with source citations
5. Manage their documents and chat history

---

## Project Structure

```
Frontend/
├── src/
│   ├── apis/
│   │   └── axios.js                 ← HTTP client configuration
│   │
│   ├── components/
│   │   ├── Navbar.jsx               ← Top navigation bar
│   │   ├── Sidebar.jsx              ← Left panel (upload & docs)
│   │   ├── ChatBox.jsx              ← Center panel (messages & input)
│   │   ├── SourcePanel.jsx          ← Right panel (sources & metrics)
│   │   ├── FeedbackBtn.jsx          ← Feedback button (not active)
│   │   └── ThemeContext.jsx         ← Theme provider (dark mode)
│   │
│   ├── context/
│   │   └── ThemeContext.jsx         ← Theme state management
│   │
│   ├── pages/
│   │   ├── LoginNew.jsx             ← Login/Register page (3D card)
│   │   ├── Chat.jsx                 ← Main chat interface
│   │   ├── Upload.jsx               ← Document upload page
│   │   ├── Library.jsx              ← Document library (placeholder)
│   │   ├── SavedChats.jsx           ← Saved conversations (placeholder)
│   │   └── Settings.jsx             ← User settings (placeholder)
│   │
│   ├── styles/
│   │   ├── bayt.css                 ← Upload/Auth pages styling
│   │   ├── theme.css                ← Dashboard (3-column) styling
│   │   └── LoginNew.css             ← Login 3D card effects
│   │
│   ├── App.jsx                      ← Main app with routing
│   ├── index.html                   ← HTML entry point
│   └── main.jsx                     ← React app entry point
│
├── vite.config.js                   ← Vite configuration
├── package.json                     ← Dependencies
└── public/
    └── (static assets)
```

---

## Frontend Architecture

### Application Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        User Browser                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Vite Dev Server                          │ │
│  │              (http://localhost:3000)                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   App.jsx (Root)                           │ │
│  │  - ThemeProvider context                                   │ │
│  │  - BrowserRouter for navigation                            │ │
│  │  - Route definitions                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          ↓                                       │
│  ┌─────────────┬────────────────────────┬─────────────────────┐ │
│  │  LoginNew   │      Chat.jsx          │     Upload.jsx      │ │
│  │  (public)   │   (protected route)    │  (protected route)  │ │
│  └─────────────┴────────────────────────┴─────────────────────┘ │
│        │                  ↓                                      │
│        │       ┌──────────────────────┐                          │
│        │       │   Navbar             │                          │
│        │       │   Sidebar            │                          │
│        │       │   ChatBox            │                          │
│        │       │   SourcePanel        │                          │
│        │       └──────────────────────┘                          │
│        │                  ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │        localStorage                                          │ │
│  │  - token (JWT from backend)                                 │ │
│  │  - user (user info)                                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/JSON
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│              Backend FastAPI Server (8000)                       │
│  /auth, /upload, /query, /feedback endpoints                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## API Configuration & Axios Setup

### File: `src/apis/axios.js`

**Purpose**: Configure Axios HTTP client with authentication interceptors.

#### Base Configuration
```javascript
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});
```

**Key Points**:
- `baseURL`: Backend URL (from .env or default localhost:8000)
- All requests go through `API` instance
- Default Content-Type is JSON (except form data)

#### Request Interceptor (Authentication)
```javascript
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**What it does**:
1. Before each request, reads JWT token from localStorage
2. If token exists, adds it to Authorization header
3. Format: `Authorization: Bearer eyJ...` (JWT token)
4. Sent with every protected endpoint request

**Why it matters**:
- Backend verifies this token on protected routes
- Without token: 401 Unauthorized
- With expired token: 401 → auto logout

#### Response Interceptor (Auto Logout)
```javascript
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
```

**What it does**:
1. Intercepts responses
2. If status code is 401 (Unauthorized):
   - Clear localStorage (remove token & user)
   - Redirect to login page
   - Force session restart
3. Otherwise, pass through normally

**Why it matters**:
- Handles expired tokens gracefully
- Prevents stale sessions
- Auto-redirects to login

---

### API Export Functions

#### Authentication

```javascript
// Register new user
export const registerUser = (data) => API.post("/auth/register", data);
// Request: {email: "...", name: "...", password: "...", role: "student"}
// Response: {access_token: "eyJ...", token_type: "bearer", user: {...}}

// Login user
export const loginUser = (email, password) => {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  return axios.post(..., form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
};
// Note: Uses plain axios, not API instance (special form encoding)

// Get current user info
export const getMe = () => API.get("/auth/me");
// Response: {id: 1, email: "...", name: "...", role: "student"}
```

**Important**: `loginUser` uses plain `axios`, not `API` instance because:
- Backend expects form-urlencoded format for OAuth2
- Must use `application/x-www-form-urlencoded` header
- Token interceptor not needed yet (before login)

#### Document Upload

```javascript
// Upload PDF file
export const uploadPDF = (file, category = "", description = "") => {
  const fd = new FormData();
  fd.append("file", file);
  if (category) fd.append("category", category);
  if (description) fd.append("description", description);
  return API.post("/upload/pdf", fd);
};
// Request: multipart/form-data with file
// Response: {doc_id: 42, filename: "...", chunks: 150, message: "..."}

// Upload with progress tracking
export const uploadPDFWithProgress = (file, onProgress, category = "", description = "") => {
  // Same as uploadPDF but with:
  // onUploadProgress: callback with {loaded, total} for progress bar
};

// Fetch all user's documents
export const getAllDocs = () => API.get("/upload/docs/all");
// Response: [{id: 1, filename: "...", chunks: 50, uploaded_at: "..."}, ...]

// Delete specific document
export const deleteDocById = (id) => API.delete(`/upload/docs/${id}`);
// Response: {message: "Deleted"}
```

#### Query & Chat

```javascript
// Ask a question
export const askQuestion = (question) =>
  API.post("/query/ask", { question });
// Request: {question: "What is machine learning?"}
// Response: {
//   query_id: 42,
//   question: "...",
//   answer: "...with [Source 1] citations...",
//   sources: [{filename: "...", page: 3, text: "..."}, ...],
//   response_time: 3.45
// }

// Get query history
export const getHistory = () => API.get("/query/history");
// Response: [{id, question, answer, response_time, created_at}, ...]
```

#### Feedback

```javascript
// Submit feedback on answer
export const submitFeedback = (query_id, rating, comment = "") =>
  API.post("/feedback/", { query_id, rating, comment });
// Request: {query_id: 42, rating: 1, comment: "Great answer!"}
// Response: {id: 1, message: "Feedback recorded"}
```

---

## Routing & Navigation

### File: `App.jsx`

```javascript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// PrivateRoute component - protects routes that need authentication
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route - anyone can access */}
          <Route path="/login" element={<LoginNew />} />
          
          {/* Protected routes - require valid JWT token */}
          <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          
          {/* Catch-all - redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
```

**Route Flow**:

```
User accesses URL
    ↓
Route matches?
    ├─ /login → LoginNew page (public)
    ├─ /chat  → Check token?
    │           ├─ Token exists → Chat page
    │           └─ No token → Redirect to /login
    ├─ /upload → Check token?
    │            ├─ Token exists → Upload page
    │            └─ No token → Redirect to /login
    └─ /other → Redirect to /login
```

---

## Components & Their Logic

### 1. LoginNew.jsx - Login & Registration Page

**Purpose**: User authentication with 3D visual effects.

**State Variables**:
```javascript
const [isLogin, setIsLogin] = useState(true);        // Toggle login/register mode
const [loading, setLoading] = useState(false);       // Show loading spinner
const [error, setError] = useState("");              // Display error messages
const [loginData, setLoginData] = useState({
  email: "",
  password: ""
});
const [registerData, setRegisterData] = useState({
  firstName: "",
  lastName: "",
  email: "",
  role: "student",
  password: "",
  confirmPassword: ""
});
```

**Key Logic**:

#### `handleLogin` Function
```javascript
const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    // 1. Send email & password to backend
    const response = await loginUser(loginData.email, loginData.password);
    
    // 2. Save JWT token to localStorage
    localStorage.setItem("token", response.data.access_token);
    
    // 3. Save user info to localStorage
    localStorage.setItem("user", JSON.stringify(response.data.user));
    
    // 4. Redirect to /chat
    navigate("/chat");
  } catch (err) {
    // Show error if login fails
    setError(err.response?.data?.detail || "Invalid credentials");
  } finally {
    setLoading(false);
  }
};
```

**Error Handling**:
- `401 Unauthorized` → "Invalid email or password"
- `400 Bad Request` → Display backend error message
- Network error → Catch and display

#### `handleRegister` Function
```javascript
const handleRegister = async (e) => {
  // 1. Validate passwords match
  if (registerData.password !== registerData.confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  // 2. Send registration request
  const response = await registerUser({
    email: registerData.email,
    name: `${registerData.firstName} ${registerData.lastName}`,
    password: registerData.password,
    role: registerData.role
  });

  // 3. Save token & user (auto-login)
  localStorage.setItem("token", response.data.access_token);
  localStorage.setItem("user", JSON.stringify(response.data.user));

  // 4. Redirect to /chat
  navigate("/chat");
};
```

**Frontend-Backend Connection**:
```
User fills form
    ↓
Click "Register" or "Login"
    ↓
Frontend: loginUser(email, password)
    ↓
HTTP POST /auth/login (form-urlencoded)
    ↓
Backend validates credentials
    ↓
Response: {access_token: "eyJ...", user: {...}}
    ↓
Frontend: localStorage.setItem("token", token)
    ↓
Frontend: navigate("/chat")
    ↓
Chat component loads, fetches documents
```

---

### 2. Chat.jsx - Main Chat Interface

**Purpose**: Main page with three-column layout (Sidebar, ChatBox, SourcePanel).

**State Variables**:
```javascript
const [messages, setMessages] = useState([]);        // Chat messages
const [input, setInput] = useState("");              // Input textarea
const [loading, setLoading] = useState(false);       // Loading spinner
const [sources, setSources] = useState([]);          // Retrieved sources
const [docs, setDocs] = useState([]);                // User's uploaded documents
const [selectedDoc, setSelectedDoc] = useState(null);// Currently selected doc
```

**Key Effects**:

#### Load Documents on Mount
```javascript
useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    fetchDocs();  // Load user's documents
  }
}, []);  // Runs once on component mount

const fetchDocs = async () => {
  try {
    const res = await getAllDocs();
    setDocs(res.data || []);
  } catch (e) {
    setDocs([]);  // Empty array on error
  }
};
```

**Why**: 
- Check if user is logged in (token exists)
- Fetch list of user's uploaded PDFs
- Display in Sidebar for selection

#### `handleSend` Function - Ask Question
```javascript
const handleSend = async () => {
  const q = input?.trim();
  if (!q) return;  // Don't send empty questions

  // 1. Add user message to chat (optimistic update)
  const userMsg = { role: "user", content: q };
  setMessages((m) => [...m, userMsg]);
  setInput("");  // Clear input field
  setLoading(true);  // Show loading spinner

  try {
    // 2. Send question to backend
    const res = await askQuestion({ question: q });

    // 3. Add assistant response
    const assistant = { 
      role: "assistant", 
      content: res.data.answer || "", 
      response_time: res.data.response_time 
    };
    setMessages((m) => [...m, assistant]);

    // 4. Update sources for SourcePanel
    setSources(res.data.sources || []);

  } catch (err) {
    // 5. Show error if request fails
    const errMsg = { 
      role: "assistant", 
      content: "Error: could not contact server." 
    };
    setMessages((m) => [...m, errMsg]);
  } finally {
    setLoading(false);  // Hide spinner
  }
};
```

**Data Flow**:
```
User types question
    ↓
handleSend() called
    ↓
Add user message to messages array (display immediately)
    ↓
Send to backend: POST /query/ask {question: "..."}
    ↓
Backend RAG pipeline (2-5 seconds)
    ↓
Response: {answer: "...", sources: [...], response_time: 3.45}
    ↓
Add assistant message to messages array
    ↓
setSources() for right panel
    ↓
Display answer in ChatBox
    ↓
Display sources in SourcePanel
```

#### `handleUpload` Function - Upload PDF
```javascript
const handleUpload = async (file) => {
  if (!file) return;
  
  // Validate file type
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    alert('Please upload PDF files only');
    return;
  }

  try {
    // 1. Upload file to backend
    await uploadPDF(file);  // Returns {doc_id, filename, chunks}

    // 2. Refresh documents list
    await fetchDocs();

    // 3. Show success message
    alert(`Uploaded: ${file.name}`);

  } catch (err) {
    console.error(err);
    alert('Upload failed');
  }
};
```

**Backend Connection**:
```
User selects PDF file
    ↓
handleUpload(file) called
    ↓
Upload to POST /upload/pdf (multipart/form-data)
    ↓
Backend:
  1. Extract text from PDF
  2. Chunk into 500-word pieces
  3. Embed with SciBERT
  4. Store in Pinecone
  5. Save metadata to SQLite
    ↓
Response: {doc_id: 42, filename: "...", chunks: 150}
    ↓
Frontend: fetchDocs() to refresh list
    ↓
New document appears in Sidebar
```

**Component Structure**:
```jsx
<Chat>
  ├─ <Navbar>
  ├─ <div class="chat-layout">
  │  ├─ <Sidebar
  │  │    docs={docs}
  │  │    selectedDoc={selectedDoc}
  │  │    onUpload={handleUpload}
  │  │  />
  │  ├─ <ChatBox
  │  │    messages={messages}
  │  │    input={input}
  │  │    setInput={setInput}
  │  │    onSend={handleSend}
  │  │    isLoading={loading}
  │  │  />
  │  └─ <SourcePanel
  │       sources={sources}
  │     />
  └─ </div>
</Chat>
```

---

### 3. Sidebar.jsx - Document Navigation

**Purpose**: Display uploaded documents, handle PDF upload.

**State Variables**:
```javascript
const [openCategories, setOpenCategories] = useState({});  // Expand/collapse
const [dragOver, setDragOver] = useState(false);           // Drag over state
```

**Key Features**:

#### Document Organization
```javascript
// Group documents by category
const categories = docs.reduce((acc, doc) => {
  const category = doc.category || 'Uncategorized';
  if (!acc[category]) acc[category] = [];
  acc[category].push(doc);
  return acc;
}, {});

// Render categories with collapsible lists
Object.entries(categories).map(([name, catDocs]) => (
  <div key={name}>
    <div className="category-row" onClick={() => toggleCategory(name)}>
      <span>{name}</span>
      <span className="badge">{catDocs.length}</span>
    </div>
    {openCategories[name] && (
      <div className="doc-list">
        {catDocs.map(doc => (
          <div 
            className="doc-item"
            onClick={() => setSelectedDoc(doc)}
          >
            {doc.filename}
          </div>
        ))}
      </div>
    )}
  </div>
))
```

#### Drag & Drop Upload
```javascript
const handleDrop = (e) => {
  e.preventDefault();
  setDragOver(false);
  const file = e.dataTransfer.files[0];
  if (file && onUpload) onUpload(file);  // Call Chat's handleUpload
};

const handleDragOver = (e) => {
  e.preventDefault();
  setDragOver(true);  // Show drag-over state
};

return (
  <div
    className="upload-zone"
    onDrop={handleDrop}
    onDragOver={handleDragOver}
    onDragLeave={() => setDragOver(false)}
  >
    Drop PDF here
  </div>
);
```

**Props Received**:
- `docs`: Array of user's documents
- `selectedDoc`: Currently selected document
- `setSelectedDoc`: Function to select document
- `onUpload`: Function to handle file upload (from Chat.jsx)

---

### 4. ChatBox.jsx - Message Display & Input

**Purpose**: Display chat messages and input field.

**State Variables** (from parent):
```javascript
messages = [];          // Array of {role: "user"|"assistant", content, response_time?}
input = "";             // Current input text
setInput = fn;          // Update input
onSend = fn;            // Send message handler
isLoading = false;      // Show loading state
```

**Message Rendering**:
```javascript
messages.map((msg, idx) => (
  <div className={`message ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
    <div className="message-avatar">
      {msg.role === 'assistant' ? '📚' : '👤'}
    </div>
    <div className="message-content">
      <div className="message-role">
        {msg.role === 'assistant' ? 'Archive' : 'You'}
      </div>
      <div className="message-text">{msg.content}</div>
      {msg.response_time && (
        <div className="message-meta">
          ⚡ {msg.response_time}s response time
        </div>
      )}
    </div>
  </div>
))
```

**Input Handling**:
```javascript
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    onSend();  // Send message
  }
  // Shift+Enter allows newline
};

<textarea
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={handleKeyDown}
  disabled={isLoading}
  placeholder="Ask the archive..."
/>
```

**Send Button**:
```javascript
<button 
  className="send-btn" 
  onClick={onSend}
  disabled={isLoading || !input.trim()}
>
  {isLoading ? '...' : '➤'}
</button>
```

---

### 5. SourcePanel.jsx - Retrieved Document Sources

**Purpose**: Display documents retrieved for the answer, with relevance scores.

**Filtering Logic**:
```javascript
const [filter, setFilter] = useState('all');

const filteredSources = sources.filter(s => {
  const score = s.score || 0;
  if (filter === 'high') return score >= 0.85;  // 85%+
  if (filter === 'mid') return score >= 0.6 && score < 0.85;  // 60-85%
  return true;  // Show all
});
```

**Metrics Display**:
```javascript
const avgScore = sources.length > 0 
  ? Math.round(sources.reduce((acc, s) => acc + (s.score || 0), 0) / sources.length * 100) 
  : 0;

// Display:
// - Sources used: number of chunks
// - Avg score: average relevance
// - High quality: count >= 85%
// - Total chunks: total retrieved
```

**Source Cards**:
```javascript
filteredSources.map((source, i) => (
  <div className="source-card">
    <div className="source-header">
      <span className="file-name">{source.filename}</span>
      <span className="source-page">Page {source.page}</span>
    </div>
    <div className="source-score">
      <span className={`score-badge ${getScoreClass(source.score)}`}>
        {formatScore(source.score)}  {/* 0.92 → "92%" */}
      </span>
    </div>
    <div className="source-excerpt">
      {source.text}  {/* First 200 chars of chunk */}
    </div>
  </div>
))
```

**Data Flow**:
```
Backend returns sources with askQuestion():
[
  {
    filename: "textbook.pdf",
    page: 5,
    score: 0.92,
    text: "Machine learning is..."
  },
  {
    filename: "paper.pdf",
    page: 12,
    score: 0.78,
    text: "Neural networks..."
  }
]
    ↓
Frontend: setSources(sources)
    ↓
SourcePanel displays:
  - Filter pills (All, High 85%+, Mid 60-85%)
  - Metrics (2 sources, 85% avg score)
  - Source cards with filenames, pages, scores
```

---

### 6. Navbar.jsx - Top Navigation

**Purpose**: Display navigation links and user info.

**Logic**:
```javascript
const user = JSON.parse(localStorage.getItem('user') || '{}');
const username = user.name || 'Guest';

// Display current username
<span className="navbar-user">{username}</span>

// Sign out handler
const handleSignOut = () => {
  localStorage.clear();  // Remove token & user
  navigate('/login');    // Redirect to login
};
```

**Navigation Links**:
- `/chat` - Main chat interface (active)
- `/library` - Document library (placeholder)
- `/saved` - Saved conversations (placeholder)
- `/settings` - User settings (placeholder)

---

## State Management & Data Flow

### Local Storage Data Structure

```javascript
// After successful login/register:
localStorage = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: {
    id: 1,
    email: "user@example.com",
    name: "John Doe",
    role: "student"
  }
}

// Token is extracted by axios interceptor:
// Authorization: Bearer eyJ...
```

### Component State Hierarchy

```
App.jsx (Root)
  ├─ ThemeProvider (context for dark mode)
  └─ BrowserRouter
      └─ Routes
          ├─ LoginNew.jsx (public)
          │   ├─ isLogin state
          │   ├─ loading state
          │   ├─ loginData state
          │   └─ registerData state
          │
          └─ Chat.jsx (protected)
              ├─ messages state
              ├─ input state
              ├─ loading state
              ├─ sources state
              ├─ docs state
              └─ selectedDoc state
                  │
                  Passed to child components:
                  ├─ Sidebar (docs, selectedDoc, onUpload)
                  ├─ ChatBox (messages, input, onSend, isLoading)
                  └─ SourcePanel (sources)
```

### Message State Structure

```javascript
// Each message in messages array:
{
  role: "user",  // "user" or "assistant"
  content: "What is machine learning?",
  response_time: 3.45  // Only for assistant messages
}

// Example messages array:
[
  { role: "user", content: "What is ML?" },
  { role: "assistant", content: "ML is...", response_time: 3.45 },
  { role: "user", content: "Explain more" },
  { role: "assistant", content: "Further explanation...", response_time: 2.10 }
]
```

---

## API Calls Reference

### Authentication Flow

```
┌─────────────────────────────────────────┐
│   User fills login form                  │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│   POST /auth/login                       │
│   Body: {username: email, password}      │
│   Headers: application/x-www-form-... │
└────────────┬────────────────────────────┘
             │
             ↓ (Backend validates)
             │
    ┌────────┴────────┐
    │                 │
    ↓                 ↓
 Invalid          Valid
(401)            (200)
    │                 │
    ↓                 ↓
Display        Response:
error          {
               access_token: "eyJ...",
               token_type: "bearer",
               user: {id, email, name, role}
               }
                     │
                     ↓
              localStorage.setItem(
                "token", access_token
              )
              localStorage.setItem(
                "user", user
              )
                     │
                     ↓
              navigate("/chat")
```

### Chat Query Flow

```
┌────────────────────────────────────┐
│   User asks question                │
└────────────┬────────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│   handleSend() called               │
│   1. Add user message to state      │
│   2. Clear input field              │
│   3. Show loading spinner           │
└────────────┬────────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│   POST /query/ask                   │
│   Headers: Authorization: Bearer... │
│   Body: {question: "..."}           │
└────────────┬────────────────────────┘
             │
    (2-5 second wait for backend RAG)
             │
             ↓
┌────────────────────────────────────┐
│   Response received:                │
│   {                                 │
│     query_id: 42,                   │
│     answer: "...[Source 1]...",     │
│     sources: [...],                 │
│     response_time: 3.45             │
│   }                                 │
└────────────┬────────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│   Frontend updates state:           │
│   - Add assistant message          │
│   - setSources(sources)            │
│   - setLoading(false)              │
└────────────┬────────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│   Re-render components:             │
│   - ChatBox shows new answer       │
│   - SourcePanel shows sources      │
└────────────────────────────────────┘
```

### PDF Upload Flow

```
┌────────────────────────────────────┐
│   User selects PDF file             │
└────────────┬────────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│   handleUpload(file) called         │
│   Validate:                         │
│   - File exists                     │
│   - Is .pdf format                  │
└────────────┬────────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│   POST /upload/pdf                  │
│   Body: FormData {                  │
│     file: <binary PDF>,             │
│     category?: "...",               │
│     description?: "..."             │
│   }                                 │
│   Headers: multipart/form-data      │
└────────────┬────────────────────────┘
             │
    (Backend: extract, chunk, embed,
     store in Pinecone + SQLite)
             │
             ↓
┌────────────────────────────────────┐
│   Response: {                       │
│     doc_id: 42,                     │
│     filename: "...",                │
│     chunks: 150                     │
│   }                                 │
└────────────┬────────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│   fetchDocs() called to refresh     │
│   GET /upload/docs/all              │
└────────────┬────────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│   setDocs([...new docs list])       │
│   Sidebar updates to show new doc   │
└────────────────────────────────────┘
```

---

## Error Handling & Debugging

### Common Error Scenarios

#### 1. 422 Unprocessable Entity
**Cause**: Request validation failed or missing token

**Debugging**:
1. Check browser console (F12 → Console)
2. Look for "POST /query/ask 422" error
3. Check if token exists: 
   ```javascript
   // In browser console:
   localStorage.getItem('token')  // Should show JWT token
   ```
4. If no token: Login again
5. If token exists but still 422: Check request format

**Solution**:
- Re-login to get fresh token
- Check if token expired (60 min default)

#### 2. CORS Error
**Cause**: Backend doesn't allow requests from frontend origin

**Error Message**: 
```
Access to XMLHttpRequest at 'http://localhost:8000/query/ask' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution**:
- Backend CORS already configured for localhost:3000 & 3001
- If custom port, update Backend/main.py:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:YOUR_PORT"],
      ...
  )
  ```

#### 3. Backend Not Responding
**Error**: `Failed to load resource: net::ERR_FAILED`

**Debugging**:
1. Check if backend is running:
   ```bash
   ps aux | grep uvicorn
   ```
2. Check port 8000 is listening:
   ```bash
   lsof -i :8000
   ```
3. Test backend directly:
   ```bash
   curl http://localhost:8000/health
   ```

**Solution**:
- Start backend: `cd Backend && python -m uvicorn main:app --reload`
- Wait for "Uvicorn running on http://0.0.0.0:8000"

#### 4. Token Expired - Auto Logout
**When it happens**:
- User logged in > 60 minutes ago
- User tries to use any feature
- Backend returns 401

**How it works**:
```javascript
// axios.js response interceptor catches 401
if (err.response?.status === 401) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";  // Force redirect
}
```

**User Experience**:
- Any request gets 401
- Auto-redirected to login
- Must login again

### Debugging Techniques

#### Using Browser DevTools

**Console** (F12 → Console tab):
```javascript
// Check stored data
localStorage.getItem('token')
JSON.parse(localStorage.getItem('user'))

// Check API response
// Make a request and inspect Network tab

// Test API call
fetch('http://localhost:8000/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(console.log)
```

**Network** (F12 → Network tab):
1. Perform action (login, upload, chat)
2. Look for HTTP requests
3. Check:
   - Request URL
   - Request Headers (Authorization?)
   - Response Status (200, 401, 422?)
   - Response Body (error message?)

**Typical Request**:
```
POST /query/ask HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ...
Content-Type: application/json

{"question":"What is ML?"}

---

HTTP/1.1 200 OK
Content-Type: application/json

{
  "query_id": 42,
  "answer": "...",
  "sources": [...],
  "response_time": 3.45
}
```

#### React DevTools
- Install "React Developer Tools" extension
- View component tree
- Check props and state of each component
- Inspect which components re-render

---

## Common Issues & Solutions

### Issue 1: "Failed to load resource 422" on Chat

**Symptoms**:
- Type question → Click send
- Nothing happens
- Browser console shows: "POST /query/ask 422"

**Root Causes**:
1. Not logged in (no token)
2. Token expired
3. No documents uploaded

**Solutions**:

**Step 1**: Check if logged in
```javascript
// Browser console:
localStorage.getItem('token')  // Should return JWT string
```

**Step 2**: If no token → login again
- Go to http://localhost:3000/login
- Enter credentials
- Check localStorage for token

**Step 3**: If token exists but still 422 → check backend
- Backend might be rejecting request format
- Check axios.js request format
- Verify token is in Authorization header

**Step 4**: Try uploading a PDF first
- Backend might return "No documents found"
- Upload a PDF to Sidebar
- Try chat again

---

### Issue 2: "Upload failed" when selecting PDF

**Symptoms**:
- Select PDF file
- Alert says "Upload failed"
- No error in browser console

**Root Causes**:
1. File is too large (>20MB)
2. Backend crashed
3. Not logged in

**Solutions**:

```javascript
// In Chat.jsx handleUpload:
const handleUpload = async (file) => {
  if (!file) return;
  
  // Log file details
  console.log('Uploading:', file.name, file.size);
  
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    alert('Please upload PDF files only');
    return;
  }

  try {
    const res = await uploadPDF(file);
    console.log('Upload response:', res);
    await fetchDocs();
    alert(`Uploaded: ${file.name}`);
  } catch (err) {
    console.error('Upload error:', err.response?.data);
    alert('Upload failed: ' + err.response?.data?.detail);
  }
};
```

**Check**:
- File size < 20MB
- File is .pdf format
- Backend is running
- Token exists

---

### Issue 3: Sidebar shows "No documents yet" but uploaded before

**Symptoms**:
- Uploaded PDF yesterday
- Document not in Sidebar today
- Logged in with different session

**Root Cause**: 
- Each user sees only their own documents
- Login with different account → different documents
- localStorage was cleared

**Solutions**:
- Check if correct user is logged in:
  ```javascript
  // Browser console:
  JSON.parse(localStorage.getItem('user')).email
  ```
- If wrong user, logout and login with correct account
- Documents are stored per-user in backend

---

### Issue 4: Response slow or "Error: could not contact server"

**Symptoms**:
- Click send → loading spinner spins forever
- After 30+ seconds → "Error: could not contact server"

**Root Causes**:
1. Backend is slow
2. Pinecone search is slow
3. LLM generation is slow
4. Backend crashed

**Solutions**:

```javascript
// Add timeout to know when it fails
// In axios.js:
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,  // 30 seconds
});

// Check backend is running and responsive:
fetch('http://localhost:8000/health').then(r => r.json()).then(console.log)

// Look for slow step:
// - If immediate error: backend down
// - If 2-5 sec: normal RAG pipeline
// - If 10+ sec: check if documents uploaded
```

---

### Issue 5: Logout not working / Token not clearing

**Symptoms**:
- Click "Sign Out"
- Page still shows username
- Refreshing doesn't redirect to login

**Solution**:

```javascript
// In Navbar.jsx handleSignOut:
const handleSignOut = () => {
  localStorage.clear();  // Clears ALL localStorage
  navigate('/login');    // Redirect
  window.location.reload();  // Force page reload to clear React state
};
```

---

## Performance Tips

```javascript
// Good: Batch state updates
setMessages(prev => [...prev, msg]);
setSources(data.sources);

// Bad: Multiple individual updates (causes re-renders)
setMessages([...messages, msg]);
setSources(sources);

// Good: Use conditional rendering
{messages.length === 0 ? <Welcome /> : <MessageList />}

// Bad: Render everything always
<div style={{display: messages.length === 0 ? 'block' : 'none'}}>
  <Welcome />
</div>
```

---

## Browser DevTools Workflow

### To Debug Chat Issue:

1. **Open DevTools** (F12)
2. **Navigate to Network tab**
3. **Type a question in chat**
4. **Look for POST /query/ask request**
5. **Click on it**
6. **Check**:
   - **Headers**: Is Authorization header present?
   - **Payload**: Is {question: "..."} correct?
   - **Response**: Status 200 or error?
   - **Response Body**: Full error message?

### To Debug Upload Issue:

1. **Open DevTools** (F12)
2. **Navigate to Network tab**
3. **Select PDF file**
4. **Look for POST /upload/pdf request**
5. **Click on it**
6. **Check**:
   - **Request Form Data**: File present?
   - **Response Status**: 200 or error?
   - **Response Body**: {doc_id, filename, chunks} or error?

---

## Configuration Environment Variables

### File: `.env` (in project root)

```dotenv
# Frontend can't access this file directly in production
# But Vite exposes VITE_* variables to frontend

VITE_API_URL=http://localhost:8000
```

**Usage in Frontend**:
```javascript
// axios.js
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000"
```

**To change API URL**:
1. Edit `.env` in project root
2. Restart dev server (`npm run dev`)
3. Changes take effect

---

## Deployment Considerations

### Production Checklist

- [ ] Update VITE_API_URL to production backend URL
- [ ] Change JWT_SECRET_KEY to strong random value
- [ ] Set NODE_ENV=production
- [ ] Build frontend: `npm run build`
- [ ] Serve dist/ folder from web server
- [ ] Enable HTTPS
- [ ] Update CORS allowed origins in backend
- [ ] Set long cache expiration on static files
- [ ] Minify and tree-shake unused code

---

**Last Updated**: June 6, 2026
**Frontend Version**: 1.0.0
**React Version**: 18.3.1
**Vite Version**: 6.4.2
