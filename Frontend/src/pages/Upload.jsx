import { useState, useEffect, useRef } from "react";
import { uploadPDF, getMyDocs, deleteDoc } from "../apis/axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Upload() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const { colors, isDark, toggleTheme } = useTheme();
  const [docs, setDocs] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await getMyDocs();
      setDocs(res.data);
    } catch {}
  };

  const handleUpload = async (file) => {
    if (!file || !file.name.endsWith(".pdf")) {
      setMessage({ type: "error", text: "Please upload a PDF file only." });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const res = await uploadPDF(file);
      setMessage({
        type: "success",
        text: `✅ "${res.data.filename}" uploaded — ${res.data.chunks} chunks indexed!`,
      });
      fetchDocs();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteDoc(id);
      setDocs(docs.filter((d) => d.id !== id));
      setMessage({ type: "success", text: `"${name}" deleted.` });
    } catch {
      setMessage({ type: "error", text: "Delete failed" });
    }
  };

  const styles = {
    page: { display: "flex", minHeight: "100vh", background: colors.bg, color: colors.text },
    sidebar: { 
      width: 220, 
      background: colors.bgSecondary, 
      padding: "24px 16px", 
      display: "flex", 
      flexDirection: "column", 
      gap: 8, 
      borderRight: `1px solid ${colors.border}`,
      boxShadow: isDark ? "none" : "2px 0 8px rgba(0,0,0,0.05)"
    },
    logo: { color: colors.text, marginBottom: 24, fontSize: 18, fontWeight: 700 },
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
    main: { 
      flex: 1, 
      padding: "40px 48px", 
      overflowY: "auto",
      background: isDark ? colors.bg : "#fafbfc"
    },
    title: { fontSize: 28, marginBottom: 28, color: colors.text, fontWeight: 700 },
    dropZone: { 
      border: `2px dashed ${colors.border}`, 
      borderRadius: 16, 
      padding: "60px 40px", 
      textAlign: "center", 
      cursor: "pointer", 
      transition: "all 0.2s", 
      marginBottom: 20, 
      background: colors.bgSecondary,
      boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.05)"
    },
    dragging: { borderColor: colors.primary, background: colors.hover },
    dropIcon: { fontSize: 48, margin: "0 0 12px" },
    dropText: { fontSize: 16, color: colors.textSecondary, fontWeight: 500 },
    dropSub: { fontSize: 13, color: colors.textTertiary, marginTop: 6 },
    msg: { 
      padding: "12px 16px", 
      borderRadius: 8, 
      marginBottom: 20, 
      color: colors.text, 
      fontSize: 14,
      boxShadow: isDark ? "none" : "0 2px 4px rgba(0,0,0,0.08)"
    },
    sectionTitle: { fontSize: 18, marginBottom: 16, color: colors.text, fontWeight: 600 },
    empty: { color: colors.textTertiary },
    docGrid: { display: "flex", flexDirection: "column", gap: 12 },
    docCard: { 
      display: "flex", 
      alignItems: "center", 
      gap: 14, 
      background: colors.bgSecondary, 
      borderRadius: 10, 
      padding: "14px 18px", 
      border: `1px solid ${colors.border}`,
      boxShadow: isDark ? "none" : "0 2px 4px rgba(0,0,0,0.05)",
      transition: "all 0.2s ease"
    },
    docIcon: { fontSize: 24 },
    docInfo: { flex: 1 },
    docName: { margin: 0, fontWeight: 600, fontSize: 14, color: colors.text },
    docMeta: { margin: 0, color: colors.textTertiary, fontSize: 12, marginTop: 4 },
    deleteBtn: { 
      background: "transparent", 
      border: "none", 
      cursor: "pointer", 
      fontSize: 18, 
      padding: 4, 
      color: colors.error,
      transition: "all 0.2s ease"
    },
    divider: { height: 1, background: colors.border, margin: "8px 0" },
  };

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>📚 RAG Library</h2>
        <button style={styles.navBtn} onClick={() => navigate("/chat")}>
          💬 Chat
        </button>
        <button style={{ ...styles.navBtn, ...styles.navActive }}>📄 Upload</button>
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

      {/* Main */}
      <main style={styles.main}>
        <h1 style={styles.title}>Upload Academic PDFs</h1>

        {/* Drop Zone */}
        <div
          style={{ ...styles.dropZone, ...(dragging ? styles.dragging : {}) }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleUpload(e.dataTransfer.files[0]);
          }}
          onClick={() => fileRef.current.click()}
        >
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => handleUpload(e.target.files[0])} />
          {uploading ? (
            <p style={styles.dropText}>⏳ Uploading and indexing...</p>
          ) : (
            <>
              <p style={styles.dropIcon}>📂</p>
              <p style={styles.dropText}>Drag & drop PDF here, or click to browse</p>
              <p style={styles.dropSub}>Max 20MB · Academic PDFs only</p>
            </>
          )}
        </div>

        {/* Message */}
        {message && (
          <div style={{ ...styles.msg, background: message.type === "error" ? colors.errorBg : colors.successBg }}>
            {message.text}
          </div>
        )}

        {/* Uploaded Docs */}
        <h2 style={styles.sectionTitle}>My Documents ({docs.length})</h2>
        {docs.length === 0 ? (
          <p style={styles.empty}>No documents uploaded yet. Upload your first PDF above!</p>
        ) : (
          <div style={styles.docGrid}>
            {docs.map((doc) => (
              <div key={doc.id} style={styles.docCard}>
                <span style={styles.docIcon}>📄</span>
                <div style={styles.docInfo}>
                  <p style={styles.docName}>{doc.filename}</p>
                  <p style={styles.docMeta}>
                    {doc.chunk_count} chunks · {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <button style={styles.deleteBtn} onClick={() => handleDelete(doc.id, doc.filename)}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
