import { useState } from "react";
import { submitFeedback } from "../apis/axios";
import { useTheme } from "../context/ThemeContext";

export default function FeedbackBtn({ queryId }) {
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected] = useState(null);
  const { colors } = useTheme();

  const handleFeedback = async (rating) => {
    if (submitted) return;
    setSelected(rating);
    try {
      await submitFeedback(queryId, rating);
      setSubmitted(true);
    } catch {
      setSelected(null);
    }
  };

  const styles = {
    row: { display: "flex", alignItems: "center", gap: 8, marginTop: 8 },
    label: { fontSize: 12, color: colors.textTertiary },
    btn: { background: "transparent", border: `1px solid ${colors.border}`, borderRadius: 6, cursor: "pointer", fontSize: 16, padding: "2px 8px" },
    selected: { background: colors.successBg, borderColor: colors.success },
    selectedDown: { background: colors.errorBg, borderColor: colors.error },
    thanks: { fontSize: 12, color: colors.textTertiary, margin: "8px 0 0" },
  };

  if (submitted) {
    return <p style={styles.thanks}>{selected === 1 ? "👍 Thanks for the feedback!" : "👎 We'll improve this!"}</p>;
  }

  return (
    <div style={styles.row}>
      <span style={styles.label}>Was this helpful?</span>
      <button style={{ ...styles.btn, ...(selected === 1 ? styles.selected : {}) }} onClick={() => handleFeedback(1)}>
        👍
      </button>
      <button style={{ ...styles.btn, ...(selected === 0 ? styles.selectedDown : {}) }} onClick={() => handleFeedback(0)}>
        👎
      </button>
    </div>
  );
}
