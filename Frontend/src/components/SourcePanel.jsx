import { useTheme } from "../context/ThemeContext";

export default function SourcePanel({ sources, onClose }) {
  const { colors, isDark } = useTheme();

  const styles = {
    panel: { 
      width: 320, 
      background: colors.bgSecondary, 
      borderLeft: `1px solid ${colors.border}`, 
      padding: 20, 
      overflowY: "auto", 
      display: "flex", 
      flexDirection: "column",
      boxShadow: isDark ? "none" : "-2px 0 8px rgba(0,0,0,0.05)"
    },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    title: { margin: 0, fontSize: 16, color: colors.text, fontWeight: 700 },
    closeBtn: { 
      background: "transparent", 
      border: "none", 
      color: colors.textSecondary, 
      cursor: "pointer", 
      fontSize: 20,
      padding: 4,
      transition: "all 0.2s ease",
      borderRadius: 4
    },
    subtitle: { color: colors.textTertiary, fontSize: 12, marginBottom: 16, fontWeight: 500 },
    empty: { color: colors.textTertiary, fontSize: 13, textAlign: "center", marginTop: 40 },
    list: { display: "flex", flexDirection: "column", gap: 12 },
    card: { 
      background: colors.bg, 
      borderRadius: 10, 
      padding: "12px 14px", 
      border: `1px solid ${colors.border}`,
      boxShadow: isDark ? "none" : "0 2px 4px rgba(0,0,0,0.05)",
      transition: "all 0.2s ease"
    },
    cardHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
    badge: { 
      color: colors.primary, 
      fontWeight: 700, 
      fontSize: 13, 
      flexShrink: 0,
      background: isDark ? colors.bgTertiary : colors.hover,
      padding: "2px 8px",
      borderRadius: 4
    },
    scoreContainer: { flex: 1, display: "flex", alignItems: "center", gap: 6 },
    scoreBar: { flex: 1, height: 6, background: colors.bgTertiary, borderRadius: 3, overflow: "hidden" },
    scoreFill: { height: "100%", background: colors.primary, borderRadius: 3, transition: "width 0.3s ease" },
    scoreText: { 
      fontSize: 11, 
      color: colors.textTertiary, 
      flexShrink: 0, 
      fontWeight: 600,
      minWidth: 35,
      textAlign: "right"
    },
    filename: { 
      margin: "0 0 6px", 
      fontSize: 13, 
      fontWeight: 600, 
      color: colors.text,
      display: "flex",
      alignItems: "center",
      gap: 6,
      wordWrap: "break-word",
      overflowWrap: "break-word"
    },
    fileIcon: { fontSize: 16 },
    page: { 
      margin: "0 0 8px", 
      fontSize: 11, 
      color: colors.textTertiary,
      background: isDark ? colors.bgTertiary : colors.bgSecondary,
      padding: "2px 8px",
      borderRadius: 4,
      display: "inline-block",
      fontWeight: 500
    },
    excerpt: { 
      margin: 0, 
      fontSize: 12, 
      color: colors.textSecondary, 
      fontStyle: "italic", 
      lineHeight: 1.5,
      borderLeft: `2px solid ${colors.border}`,
      paddingLeft: 10,
      wordWrap: "break-word",
      overflowWrap: "break-word",
      whiteSpace: "normal"
    },
  };

  // Helper function to normalize score (handle both 0-1 and 0-100+ ranges)
  const normalizeScore = (score) => {
    // Handle undefined, null, or invalid scores
    if (score === undefined || score === null || isNaN(score)) {
      return 0;
    }
    
    // Handle negative scores (shouldn't happen, but just in case)
    if (score < 0) {
      return 0;
    }
    
    // If score is already a percentage (>1), divide by 100
    if (score > 1) {
      return Math.min(score / 100, 1);
    }
    
    // Otherwise it's already normalized (0-1)
    return Math.min(score, 1);
  };

  const getScorePercentage = (score) => {
    const normalized = normalizeScore(score);
    return Math.round(normalized * 100);
  };

  const getScoreColor = (score) => {
    const percentage = getScorePercentage(score);
    if (percentage >= 80) return colors.success || '#22c55e';
    if (percentage >= 60) return colors.primary;
    if (percentage >= 40) return '#f59e0b'; // Orange
    return colors.textTertiary;
  };

  if (!sources || sources.length === 0) {
    return (
      <aside style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>🔍 Sources</h3>
          <button 
            style={styles.closeBtn} 
            onClick={onClose}
            onMouseEnter={(e) => e.target.style.background = colors.hover}
            onMouseLeave={(e) => e.target.style.background = "transparent"}
          >
            ✕
          </button>
        </div>
        <p style={styles.empty}>Ask a question to see retrieved sources here.</p>
      </aside>
    );
  }

  return (
    <aside style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>🔍 Sources</h3>
        <button 
          style={styles.closeBtn} 
          onClick={onClose}
          onMouseEnter={(e) => e.target.style.background = colors.hover}
          onMouseLeave={(e) => e.target.style.background = "transparent"}
        >
          ✕
        </button>
      </div>
      <p style={styles.subtitle}>
        {sources.length} source{sources.length > 1 ? 's' : ''} used in response
        <br />
        <span style={{ fontSize: 10, color: colors.textTertiary, fontStyle: "italic" }}>
          Score shows relevance to your question
        </span>
      </p>

      <div style={styles.list}>
        {sources.map((src, i) => (
          <div key={i} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.badge}>[{src.index}]</span>
              <div style={styles.scoreContainer}>
                <div style={styles.scoreBar}>
                  <div
                    style={{
                      ...styles.scoreFill,
                      width: `${getScorePercentage(src.score)}%`,
                      background: getScoreColor(src.score)
                    }}
                  />
                </div>
                <span style={styles.scoreText}>
                  {getScorePercentage(src.score)}%
                </span>
              </div>
            </div>
            <div style={styles.filename}>
              <span style={styles.fileIcon}>📄</span>
              <span>{src.filename}</span>
            </div>
            <span style={styles.page}>Page {src.page}</span>
            <p style={styles.excerpt}>{src.excerpt}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
