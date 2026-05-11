import { useState } from "react";
import FeedbackBtn from "./FeedbackBtn";
import { useTheme } from "../context/ThemeContext";

export default function ChatBox({ message }) {
  const isUser = message.role === "user";
  const [expanded, setExpanded] = useState(false);
  const { colors, isDark } = useTheme();

  const styles = {
    wrapper: { display: "flex", alignItems: "flex-start", gap: 10, justifyContent: isUser ? "flex-end" : "flex-start" },
    avatar: { fontSize: 28, flexShrink: 0, marginTop: 4 },
    userAvatar: { fontSize: 28, flexShrink: 0, marginTop: 4 },
    bubble: { 
      borderRadius: 14, 
      padding: "12px 16px",
      boxShadow: isDark ? "none" : "0 2px 4px rgba(0,0,0,0.08)"
    },
    userBubble: { background: colors.primary },
    aiBubble: { background: colors.bgSecondary, border: `1px solid ${colors.border}` },
    text: { margin: 0, fontSize: 14, lineHeight: 1.6, color: isUser ? "#fff" : colors.text, whiteSpace: "pre-wrap" },
    meta: { margin: "8px 0 0", fontSize: 11, color: colors.textTertiary },
    sourcesRow: { marginTop: 8 },
    toggleBtn: { 
      background: "transparent", 
      border: `1px solid ${colors.border}`, 
      borderRadius: 6, 
      color: colors.textSecondary, 
      fontSize: 12, 
      cursor: "pointer", 
      padding: "4px 10px",
      transition: "all 0.2s ease"
    },
    sourcesList: { marginTop: 8, display: "flex", flexDirection: "column", gap: 8 },
    sourceItem: { 
      display: "flex", 
      gap: 10, 
      background: colors.bg, 
      borderRadius: 8, 
      padding: "10px 12px", 
      border: `1px solid ${colors.border}`,
      boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.05)"
    },
    sourceNum: { color: colors.primary, fontWeight: 700, flexShrink: 0, fontSize: 13 },
    sourceName: { margin: 0, fontSize: 13, fontWeight: 600, color: colors.text },
    sourceMeta: { margin: "2px 0", fontSize: 11, color: colors.textTertiary },
    sourceExcerpt: { margin: 0, fontSize: 12, color: colors.textSecondary, fontStyle: "italic" },
  };

  return (
    <div style={styles.wrapper}>
      {!isUser && <span style={styles.avatar}>🤖</span>}

      <div style={{ maxWidth: "70%" }}>
        <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.aiBubble) }}>
          <p style={styles.text}>{message.content}</p>

          {/* Response time */}
          {message.response_time && <p style={styles.meta}>⚡ {message.response_time}s response time</p>}
        </div>

        {/* Sources toggle */}
        {!isUser && message.sources?.length > 0 && (
          <div style={styles.sourcesRow}>
            <button style={styles.toggleBtn} onClick={() => setExpanded(!expanded)}>
              📎 {message.sources.length} source{message.sources.length > 1 ? "s" : ""} {expanded ? "▲" : "▼"}
            </button>

            {expanded && (
              <div style={styles.sourcesList}>
                {message.sources.map((src, i) => (
                  <div key={i} style={styles.sourceItem}>
                    <span style={styles.sourceNum}>[{src.index}]</span>
                    <div>
                      <p style={styles.sourceName}>📄 {src.filename}</p>
                      <p style={styles.sourceMeta}>
                        Page {src.page} · Score: {src.score}
                      </p>
                      <p style={styles.sourceExcerpt}>{src.excerpt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Feedback */}
            {message.query_id && <FeedbackBtn queryId={message.query_id} />}
          </div>
        )}
      </div>

      {isUser && <span style={styles.userAvatar}>👤</span>}
    </div>
  );
}
