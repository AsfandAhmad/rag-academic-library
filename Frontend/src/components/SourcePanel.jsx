export default function SourcePanel({ sources, onClose }) {
  if (!sources || sources.length === 0) {
    return (
      <aside style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>🔍 Sources</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p style={styles.empty}>Ask a question to see retrieved sources here.</p>
      </aside>
    );
  }

  return (
    <aside style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>🔍 Retrieved Sources</h3>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
      <p style={styles.subtitle}>{sources.length} sources used in last response</p>

      <div style={styles.list}>
        {sources.map((src, i) => (
          <div key={i} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.badge}>[{src.index}]</span>
              <div style={styles.scoreBar}>
                <div
                  style={{
                    ...styles.scoreFill,
                    width: `${Math.min(src.score * 100, 100)}%`
                  }}
                />
              </div>
              <span style={styles.scoreText}>{(src.score * 100).toFixed(0)}%</span>
            </div>
            <p style={styles.filename}>📄 {src.filename}</p>
            <p style={styles.page}>Page {src.page}</p>
            <p style={styles.excerpt}>{src.excerpt}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

const styles = {
  panel:    { width: 300, background: "#1e293b", borderLeft: "1px solid #334155", padding: 20, overflowY: "auto", display: "flex", flexDirection: "column" },
  header:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title:    { margin: 0, fontSize: 16, color: "#f1f5f9" },
  closeBtn: { background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 },
  subtitle: { color: "#64748b", fontSize: 12, marginBottom: 16 },
  empty:    { color: "#475569", fontSize: 13 },
  list:     { display: "flex", flexDirection: "column", gap: 12 },
  card:     { background: "#0f172a", borderRadius: 10, padding: "12px 14px" },
  cardHeader:{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  badge:    { color: "#3b82f6", fontWeight: 700, fontSize: 13, flexShrink: 0 },
  scoreBar: { flex: 1, height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" },
  scoreFill:{ height: "100%", background: "#3b82f6", borderRadius: 3 },
  scoreText:{ fontSize: 11, color: "#64748b", flexShrink: 0 },
  filename: { margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#f1f5f9" },
  page:     { margin: "0 0 6px", fontSize: 11, color: "#64748b" },
  excerpt:  { margin: 0, fontSize: 12, color: "#94a3b8", fontStyle: "italic", lineHeight: 1.5 }
};