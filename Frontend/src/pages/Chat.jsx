import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { askQuestion } from "../api/axios";
import ChatBox from "../components/ChatBox";
import SourcePanel from "../components/SourcePanel";

export default function Chat() {
  const navigate    = useNavigate();
  const bottomRef   = useRef();
  const user        = JSON.parse(localStorage.getItem("user") || "{}");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hello! I'm your RAG-powered academic library assistant. Ask me anything about your uploaded documents!",
      sources: [],
      query_id: null
    }
  ]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sources, setSources]   = useState([]);
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
        { role: "assistant", content: answer, sources: srcs, query_id, response_time }
      ]);
      setSources(srcs);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ ${err.response?.data?.detail || "Something went wrong. Please try again."}`,
          sources: []
        }
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
        <button style={styles.navBtn} onClick={() => navigate("/upload")}>📄 Upload PDFs</button>
        <button
          style={styles.navBtn}
          onClick={() => { setShowSources(!showSources); setSources(sources); }}
        >
          🔍 Sources {sources.length > 0 ? `(${sources.length})` : ""}
        </button>
        <button style={{ ...styles.navBtn, marginTop: "auto" }} onClick={() => {
          localStorage.clear(); navigate("/login");
        }}>🚪 Logout</button>
      </aside>

      {/* Chat Area */}
      <main style={styles.main}>
        <div style={styles.chatWindow}>
          {messages.map((msg, i) => (
            <ChatBox key={i} message={msg} />
          ))}
          {loading && (
            <div style={styles.typing}>
              <span style={styles.dot} /><span style={styles.dot} /><span style={styles.dot} />
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
      {showSources && (
        <SourcePanel sources={sources} onClose={() => setShowSources(false)} />
      )}
    </div>
  );
}

const styles = {
  layout:   { display: "flex", height: "100vh", background: "#0f172a", color: "#f1f5f9", overflow: "hidden" },
  sidebar:  { width: 230, background: "#1e293b", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 8 },
  logo:     { color: "#f1f5f9", marginBottom: 16, fontSize: 18 },
  userBadge:{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#0f172a", borderRadius: 10, marginBottom: 16 },
  avatar:   { width: 36, height: 36, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 },
  userName: { margin: 0, fontSize: 13, fontWeight: 600 },
  userRole: { margin: 0, fontSize: 11, color: "#64748b", textTransform: "capitalize" },
  navBtn:   { padding: "10px 14px", borderRadius: 8, border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", textAlign: "left", fontSize: 14 },
  navActive:{ background: "#1e40af", color: "#fff" },
  main:     { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  chatWindow:{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 16 },
  typing:   { display: "flex", gap: 6, padding: "12px 16px" },
  dot:      { width: 8, height: 8, background: "#3b82f6", borderRadius: "50%", animation: "bounce 1s infinite" },
  inputRow: { padding: "16px 32px", borderTop: "1px solid #1e293b", display: "flex", gap: 12, alignItems: "flex-end" },
  textarea: { flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "12px 16px", color: "#f1f5f9", fontSize: 14, resize: "none", outline: "none" },
  sendBtn:  { padding: "12px 20px", borderRadius: 10, border: "none", background: "#3b82f6", color: "#fff", fontSize: 20, cursor: "pointer" }
};