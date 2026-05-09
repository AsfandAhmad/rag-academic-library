import { useState } from "react";
import FeedbackBtn from "./FeedbackBtn";

export default function ChatBox({ message }) {
  const isUser = message.role === "user";
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ ...styles.wrapper, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && <span style={styles.avatar}>🤖</span>}

      <div style={{ maxWidth: "70%" }}>
        <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.aiBubble) }}>
          <p style={styles.text}>{message.content}</p>

          {/* Response time */}
          {message.response_time && (
            <p style={styles.meta}>⚡ {message.response_time}s response time</p>
          )}
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
                      <p style={styles.sourceMeta}>Page {src.page} · Score: {src.score}</p>
                      <p style={styles.sourceExcerpt}>{src.excerpt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Feedback */}
            {message.query_id && (
              <FeedbackBtn queryId={message.query_id} />
            )}
          </div>
        )}
      </div>

      {isUser && <span style={styles.userAvatar}>👤</span>}
    </div>
  );
}

const styles = {
  wrapper:     { display: "flex", alignItems: "flex-start", gap: 10 },
  avatar:      { fontSize: 28, flexShrink: 0, marginTop: 4 },
  userAvatar:  { fontSize: 28, flexShrink: 0, marginTop: 4 },
  bubble:      { borderRadius: 14, padding: "12px 16px" },
  userBubble:  { background: "#1e40af" },
  aiBubble:    { background: "#1e293b", border: "1px solid #334155" },
  text:        { margin: 0, fontSize: 14, lineHeight: 1.6, color: "#f1f5f9", whiteSpace: "pre-wrap" },
  meta:        { margin: "8px 0 0", fontSize: 11, color: "#64748b" },
  sourcesRow:  { marginTop: 8 },
  toggleBtn:   { background: "transparent", border: "1px solid #334155", borderRadius: 6, color: "#94a3b8", fontSize: 12, cursor: "pointer", padding: "4px 10px" },
  sourcesList: { marginTop: 8, display: "flex", flexDirection: "column", gap: 8 },
  sourceItem:  { display: "flex", gap: 10, background: "#0f172a", borderRadius: 8, padding: "10px 12px" },
  sourceNum:   { color: "#3b82f6", fontWeight: 700, flexShrink: 0, fontSize: 13 },
  sourceName:  { margin: 0, fontSize: 13, fontWeight: 600 },
  sourceMeta:  { margin: "2px 0", fontSize: 11, color: "#64748b" },
  sourceExcerpt: { margin: 0, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }
};