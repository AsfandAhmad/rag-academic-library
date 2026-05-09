import { useState } from "react";
import { submitFeedback } from "../api/axios";

export default function FeedbackBtn({ queryId }) {
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected]   = useState(null);

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

  if (submitted) {
    return (
      <p style={styles.thanks}>
        {selected === 1 ? "👍 Thanks for the feedback!" : "👎 We'll improve this!"}
      </p>
    );
  }

  return (
    <div style={styles.row}>
      <span style={styles.label}>Was this helpful?</span>
      <button
        style={{ ...styles.btn, ...(selected === 1 ? styles.selected : {}) }}
        onClick={() => handleFeedback(1)}
      >👍</button>
      <button
        style={{ ...styles.btn, ...(selected === 0 ? styles.selectedDown : {}) }}
        onClick={() => handleFeedback(0)}
      >👎</button>
    </div>
  );
}

const styles = {
  row:          { display: "flex", alignItems: "center", gap: 8, marginTop: 8 },
  label:        { fontSize: 12, color: "#64748b" },
  btn:          { background: "transparent", border: "1px solid #334155", borderRadius: 6, cursor: "pointer", fontSize: 16, padding: "2px 8px" },
  selected:     { background: "#052e16", borderColor: "#22c55e" },
  selectedDown: { background: "#450a0a", borderColor: "#ef4444" },
  thanks:       { fontSize: 12, color: "#64748b", margin: "8px 0 0" }
};