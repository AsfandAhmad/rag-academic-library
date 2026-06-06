# Maktab e Kamil - Complete UI Redesign Implementation Plan

## 🎯 Overview

This document provides a complete step-by-step plan to redesign your RAG Academic Library into the Maktab e Kamil themed interface while keeping all backend logic intact.

---

## ✅ Completed

1. ✅ **`Frontend/src/styles/theme.css`** - Created with all CSS variables and global styles

---

## 📋 Implementation Order

### Phase 1: Core Setup (Priority: CRITICAL)

#### 1. Update `Frontend/index.html`
Add Google Fonts in `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/src/styles/theme.css">
```

#### 2. Update `Frontend/src/context/ThemeContext.jsx`
```javascript
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mkTheme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('mkTheme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

---

### Phase 2: Layout Components

#### 3. Create `Frontend/src/components/Navbar.jsx`

**Key Features:**
- Fixed top bar, 48px height
- Left: Logo (📖) + "Maktab e Kamil" in Playfair Display
- Center: Nav links (Chat, Library, Saved, Settings) with active state
- Right: User name + Sign Out button

**Styling:**
```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  z-index: 1000;
}

.navbar-brand {
  min-width: 210px;
  border-right: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
}

.navbar-logo {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.navbar-title {
  font-family: 'Playfair Display', serif;
  font-size: 14px;
  color: var(--gold2);
  font-weight: 600;
}

.navbar-links {
  flex: 1;
  display: flex;
  height: 100%;
}

.navbar-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text2);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.navbar-link:hover {
  color: var(--text);
}

.navbar-link.active {
  color: var(--gold);
  border-bottom-color: var(--gold);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
}

.navbar-user {
  font-size: 12px;
  color: var(--text2);
}

.navbar-signout {
  border: 1px solid rgba(192, 57, 43, 0.4);
  color: #e74c3c;
  background: transparent;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.navbar-signout:hover {
  background: rgba(192, 57, 43, 0.12);
}
```

---

#### 4. Create `Frontend/src/components/Sidebar.jsx`

**Structure:**
```jsx
<div className="sidebar">
  {/* Upload Section */}
  <div className="sidebar-section">
    <div className="section-header">UPLOAD DOCS</div>
    <div className="upload-zone" onDrop={handleDrop} onDragOver={handleDragOver}>
      {/* Cloud icon, text, input */}
    </div>
    <button className="btn-primary full-width">Choose File</button>
  </div>

  {/* Categories Section */}
  <div className="sidebar-section flex-1">
    <div className="section-header">CATEGORIES</div>
    <div className="categories-list">
      {categories.map(cat => (
        <div key={cat.name}>
          <div className="category-row" onClick={() => toggleCategory(cat.name)}>
            <span>📁 {cat.name}</span>
            <span className="badge">{cat.docs.length}</span>
            <span className={`chevron ${openCats[cat.name] ? 'open' : ''}`}>›</span>
          </div>
          {openCats[cat.name] && (
            <div className="doc-list">
              {cat.docs.map(doc => (
                <div key={doc.id} className={`doc-item ${selectedDoc?.id === doc.id ? 'selected' : ''}`}>
                  <span>{doc.filename}</span>
                  {doc.auto && <span className="auto-badge">auto</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
</div>
```

**Key CSS:**
```css
.sidebar {
  width: 210px;
  background: var(--bg2);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
  overflow: hidden;
}

.upload-zone {
  border: 1px dashed var(--border2);
  border-radius: 6px;
  margin: 10px;
  padding: 14px 10px;
  text-align: center;
  cursor: pointer;
  background: var(--bg4);
  transition: all 0.2s;
}

.upload-zone:hover {
  border-color: var(--gold);
  background: var(--gold3);
}

.category-row {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-row:hover {
  background: var(--bg4);
}

.chevron {
  margin-left: auto;
  transition: transform 0.2s;
}

.chevron.open {
  transform: rotate(90deg);
}

.doc-list {
  border-left: 2px solid var(--border);
  margin-left: 20px;
}

.doc-item {
  padding: 6px 12px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.doc-item:hover {
  background: var(--bg4);
}

.doc-item.selected {
  background: var(--gold3);
  color: var(--gold);
}

.auto-badge {
  background: #27ae60;
  color: white;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 6px;
}
```

---

#### 5. Create `Frontend/src/components/SourcePanel.jsx`

**Structure:**
- IR Metrics header with 2x2 stats grid
- Filter pills (All/High/Mid)
- Scrollable source cards

**Key Features:**
```jsx
const SourcePanel = ({ sources }) => {
  const [filter, setFilter] = useState('all');
  
  const filteredSources = sources.filter(s => {
    if (filter === 'high') return s.score >= 0.85;
    if (filter === 'mid') return s.score >= 0.6 && s.score < 0.85;
    return true;
  });

  const avgScore = sources.length > 0 
    ? Math.round(sources.reduce((acc, s) => acc + s.score, 0) / sources.length * 100) 
    : 0;

  return (
    <div className="source-panel">
      <div className="section-header">IR METRICS</div>
      <div className="stats-grid">
        <div className="stat">
          <span className="stat-label">Sources used</span>
          <span className="stat-value">{sources.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Avg score</span>
          <span className="stat-value">{avgScore}%</span>
        </div>
      </div>

      <div className="filter-section">
        <div className="section-header">FILTER BY RELEVANCE</div>
        <div className="filter-pills">
          {['all', 'high', 'mid'].map(f => (
            <button 
              key={f}
              className={`filter-pill ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="source-cards">
        {filteredSources.map((source, i) => (
          <div key={i} className="source-card">
            <div className="source-name">{source.filename}</div>
            <div className="source-page">Page {source.page}</div>
            <div className="source-excerpt">{source.excerpt}</div>
            <div className="source-score-row">
              <span className={`score-pill ${getScoreClass(source.score)}`}>
                {Math.round(source.score * 100)}%
              </span>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ width: `${source.score * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### Phase 3: Main Chat Component

#### 6. Update `Frontend/src/components/ChatBox.jsx`

**Structure:**
1. Chat header (title + subtitle + buttons)
2. Welcome state (lantern animation + greeting + quick prompts)
3. Message list (AI + user messages)
4. Document context bar (when doc selected)
5. Input area with send button
6. Footer note

**Lantern Animation CSS:**
```css
.lantern {
  width: 52px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto 20px;
}

.lantern-top {
  width: 22px;
  height: 8px;
  border: 1px solid var(--gold);
  border-bottom: none;
  border-radius: 2px 2px 0 0;
}

.lantern-body {
  width: 40px;
  height: 50px;
  border: 2px solid rgba(190, 145, 65, 0.6);
  border-radius: 4px 4px 8px 8px;
  background: rgba(255, 150, 30, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.flame {
  width: 10px;
  height: 13px;
  background: radial-gradient(ellipse at 50% 70%, #ffd060, #ff8c00 60%, transparent);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  animation: flame 1.5s ease-in-out infinite alternate;
}

@keyframes flame {
  0% { transform: scaleX(1) scaleY(1); }
  100% { transform: scaleX(0.8) scaleY(1.1); }
}
```

**Quick Prompt Chips:**
```jsx
const quickPrompts = [
  "Summarise this document",
  "What are the key concepts?",
  "List all topics covered",
  "Explain chapter 1",
  "Compare the main arguments"
];

<div className="quick-prompts">
  {quickPrompts.map((prompt, i) => (
    <button 
      key={i}
      className="prompt-chip"
      onClick={() => handleQuickPrompt(prompt)}
    >
      {prompt}
    </button>
  ))}
</div>
```

---

### Phase 4: Page Components

#### 7. Update `Frontend/src/pages/Chat.jsx`

**Layout:**
```jsx
const Chat = () => {
  return (
    <>
      <Navbar />
      <div className="chat-layout">
        <Sidebar 
          selectedDoc={selectedDoc}
          setSelectedDoc={setSelectedDoc}
          onUpload={handleUpload}
        />
        <ChatBox 
          selectedDoc={selectedDoc}
          messages={messages}
          setMessages={setMessages}
          isLoading={isLoading}
        />
        <SourcePanel 
          sources={sources}
        />
      </div>
    </>
  );
};
```

```css
.chat-layout {
  display: flex;
  height: calc(100vh - 48px);
  margin-top: 48px;
  overflow: hidden;
  background: var(--bg);
}
```

---

#### 8. Create `Frontend/src/pages/Library.jsx`

**Features:**
- Page header with title + upload button
- Stats cards (4-column grid)
- Category filter tabs
- Document grid (cards with actions)

**Document Card:**
```jsx
<div className="doc-card">
  <div className="doc-icon">📄</div>
  {doc.auto && <span className="auto-badge">auto</span>}
  <div className="doc-name">{doc.filename}</div>
  <span className="category-pill">{doc.category}</span>
  <div className="doc-meta">
    <span>{doc.pages} pages</span>
    <span>{formatDate(doc.uploaded_at)}</span>
  </div>
  <div className="doc-actions">
    <button className="btn-icon" onClick={() => preview(doc)}>👁️</button>
    <button className="btn-icon" onClick={() => download(doc)}>⬇️</button>
    <button className="btn-icon danger" onClick={() => deleteDoc(doc)}>🗑️</button>
  </div>
</div>
```

---

#### 9. Create `Frontend/src/pages/SavedChats.jsx`

**Structure:**
- Page header with "Clear All" button
- List of saved chat cards
- Each card: icon + title + meta + actions

---

#### 10. Create `Frontend/src/pages/Settings.jsx`

**Sections:**
1. **Appearance** - Theme toggle (Dark/Light buttons)
2. **Chat Behaviour** - Toggle switches
3. **Retrieval Settings** - Sliders
4. **Account** - User info + actions

**Theme Toggle:**
```jsx
const { theme, setTheme } = useTheme();

<div className="theme-buttons">
  <button 
    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
    onClick={() => setTheme('dark')}
  >
    🌙 Dark
  </button>
  <button 
    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
    onClick={() => setTheme('light')}
  >
    ☀️ Light
  </button>
</div>
```

**Toggle Switch:**
```jsx
const Toggle = ({ checked, onChange, label }) => (
  <div className="toggle-row">
    <span>{label}</span>
    <button 
      className={`toggle-switch ${checked ? 'on' : 'off'}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-dot" />
    </button>
  </div>
);
```

```css
.toggle-switch {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-switch.on {
  background: #7a4e14;
}

.toggle-dot {
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 0.2s;
}

.toggle-switch.on .toggle-dot {
  transform: translateX(16px);
}
```

---

### Phase 5: Integration

#### 11. Update `Frontend/App.jsx`

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './src/context/ThemeContext';
import LoginNew from './src/pages/LoginNew';
import Chat from './src/pages/Chat';
import Library from './src/pages/Library';
import SavedChats from './src/pages/SavedChats';
import Settings from './src/pages/Settings';
import Upload from './src/pages/Upload';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginNew />} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><SavedChats /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
```

---

## 🎨 Design Tokens Summary

### Typography
- **Brand/Titles:** Playfair Display (serif)
- **UI/Body:** Lato (sans-serif)
- **Headers:** 10px, uppercase, letter-spacing 2px
- **Body:** 11-13px

### Colors (Dark)
- Background: `#0f0804`
- Gold: `#c9974a`
- Text: `#e8d5a8`
- Border: `rgba(190,145,65,0.18)`

### Spacing
- Sidebar width: `210px`
- Navbar height: `48px`
- Border radius: `6px` (standard), `4px` (small)
- Gaps: `8px`, `12px`, `14px`

### Animations
- Theme transition: `0.2s`
- Hover effects: `0.2s`
- Flame flicker: `1.5s infinite alternate`

---

## 📦 Required Dependencies

Add to `package.json` if not present:
```bash
npm install react-hot-toast  # For toast notifications
```

---

## 🧪 Testing Checklist

After implementation:

- [ ] Theme toggle works (dark ↔ light)
- [ ] Navbar active state highlights current route
- [ ] Sidebar upload zone accepts drag & drop
- [ ] Categories expand/collapse
- [ ] Document selection highlights
- [ ] Auto-category detection works
- [ ] Chat displays welcome state when empty
- [ ] Quick prompts send messages
- [ ] Messages render with avatars
- [ ] Source panel shows correct scores
- [ ] Filter pills work
- [ ] Settings toggles save to localStorage
- [ ] All routes protected (redirect to login)

---

## 🚀 Quick Start Commands

```bash
# Install new dependencies (if any)
npm install react-hot-toast

# Run frontend
npm run dev

# Run backend (separate terminal)
cd Backend
source ../.venv/bin/activate
uvicorn main:app --reload
```

---

## 📝 Notes

- Keep all existing API calls in `axios.js` unchanged
- Backend code remains untouched
- Login page (LoginNew.jsx) already redesigned - keep it
- Store username as "mkUser" in localStorage on login
- All settings save to localStorage with "mk" prefix

---

**This is a comprehensive guide. Due to the size, I recommend implementing phase by phase, testing each before moving to the next.**

Would you like me to implement a specific phase/component first?
