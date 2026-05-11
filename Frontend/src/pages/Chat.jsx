import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { askQuestion } from "../apis/axios";
import ChatBox from "../components/ChatBox";
import SourcePanel from "../components/SourcePanel";
import { useTheme } from "../context/ThemeContext";

export default function Chat() {
  const navigate = useNavigate();
  const bottomRef = useRef();
  const { colors, isDark, toggleTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hello! I'm your RAG-powered academic library assistant. Ask me anything about your uploaded documents!",
      sources: [],
      query_id: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const res = await askQuestion(question);
      const { answer, sources: srcs, query_id, response_time } = res.data;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: answer, sources: srcs, query_id, response_time },
      ]);
      setSources(srcs);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ ${err.response?.data?.detail || "Something went wrong. Please try again."}`,
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const styles = {
    layout: { display: "flex", height: "100vh", background: colors.bg, color: colors.text, overflow: "hidden" },
    sidebar: { 
      width: 230, 
      background: colors.bgSecondary, 
      padding: "24px 16px", 
      display: "flex", 
      flexDirection: "column", 
      gap: 8, 
      borderRight: `1px solid ${colors.border}`,
      boxShadow: isDark ? "none" : "2px 0 8px rgba(0,0,0,0.05)"
    },
    logo: { color: colors.text, marginBottom: 16, fontSize: 18, fontWeight: 700 },
    userBadge: { 
      display: "flex", 
      alignItems: "center", 
      gap: 10, 
      padding: "10px 12px", 
      background: colors.bg, 
      borderRadius: 10, 
      marginBottom: 16,
      border: `1px solid ${colors.border}`,
      boxShadow: isDark ? "none" : "0 2px 4px rgba(0,0,0,0.05)"
    },
    avatar: { width: 36, height: 36, borderRadius: "50%", background: colors.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#fff" },
    userName: { margin: 0, fontSize: 13, fontWeight: 600, color: colors.text },
    userRole: { margin: 0, fontSize: 11, color: colors.textTertiary, textTransform: "capitalize" },
    navBtn: { 
      padding: "10px 14px", 
      borderRadius: 8, 
      border: "none", 
      background: "transparent", 
      color: colors.textSecondary, 
      cursor: "pointer", 
      textAlign: "left", 
      fontSize: 14, 
      transition: "all 0.2s ease",
      fontWeight: 500
    },
    navActive: { background: colors.primary, color: "#fff", fontWeight: 600 },
    main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
    chatWindow: { 
      flex: 1, 
      overflowY: "auto", 
      padding: "24px 32px", 
      display: "flex", 
      flexDirection: "column", 
      gap: 16,
      background: isDark ? colors.bg : "#fafbfc"
    },
    typing: { display: "flex", gap: 6, padding: "12px 16px" },
    dot: { width: 8, height: 8, background: colors.primary, borderRadius: "50%", animation: "bounce 1s infinite" },
    inputRow: { 
      padding: "16px 32px", 
      borderTop: `1px solid ${colors.border}`, 
      display: "flex", 
      gap: 12, 
      alignItems: "flex-end",
      background: colors.bgSecondary,
      boxShadow: isDark ? "none" : "0 -2px 8px rgba(0,0,0,0.05)"
    },
    textarea: { 
      flex: 1, 
      background: colors.bg, 
      border: `1px solid ${colors.border}`, 
      borderRadius: 10, 
      padding: "12px 16px", 
      color: colors.text, 
      fontSize: 14, 
      resize: "none", 
      outline: "none",
      boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.05)"
    },
    sendBtn: { 
      padding: "12px 20px", 
      borderRadius: 10, 
      border: "none", 
      background: colors.primary, 
      color: "#fff", 
      fontSize: 20, 
      cursor: "pointer", 
      transition: "all 0.2s ease",
      boxShadow: isDark ? "none" : "0 2px 4px rgba(59,130,246,0.3)"
    },
    divider: { height: 1, background: colors.border, margin: "8px 0" },
  };

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>📚 RAG Library</h2>
        <div style={styles.userBadge}>
          <span style={styles.avatar}>{user.name?.[0]?.toUpperCase() || "U"}</span>
          <div>
            <p style={styles.userName}>{user.name}</p>
            <p style={styles.userRole}>{user.role}</p>
          </div>
        </div>
        <button style={{ ...styles.navBtn, ...styles.navActive }}>💬 Chat</button>
        <button style={styles.navBtn} onClick={() => navigate("/upload")}>
          📄 Upload PDFs
        </button>
        <button style={styles.navBtn} onClick={() => { setShowSources(!showSources); setSources(sources); }}>
          🔍 Sources {sources.length > 0 ? `(${sources.length})` : ""}
        </button>
        <div style={styles.divider} />
        <button 
          style={styles.navBtn} 
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        <button style={{ ...styles.navBtn, marginTop: "auto" }} onClick={() => { localStorage.clear(); navigate("/login"); }}>
          🚪 Logout
        </button>
      </aside>

      {/* Chat Area */}
      <main style={styles.main}>
        <div style={styles.chatWindow}>
          {messages.map((msg, i) => (
            <ChatBox key={i} message={msg} />
          ))}
          {loading && (
            <div style={styles.typing}>
              <span style={styles.dot} />
              <span style={styles.dot} />
              <span style={styles.dot} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={styles.inputRow}>
          <textarea
            style={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents... (Enter to send)"
            rows={2}
          />
          <button style={styles.sendBtn} onClick={handleSend} disabled={loading}>
            {loading ? "⏳" : "➤"}
          </button>
        </div>
      </main>

      {/* Sources Panel */}
      {showSources && <SourcePanel sources={sources} onClose={() => setShowSources(false)} />}
    </div>
  );
}
