import { useState, useEffect, useRef } from "react";
import { uploadPDF, getDocs, deleteDocById } from "../apis/axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Upload() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const { colors } = useTheme();
  const [docs, setDocs] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await getDocs();
      setDocs(res.data || []);
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
      const res = await uploadPDF(file, category);
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
      await deleteDocById(id);
      setDocs(docs.filter((d) => d.id !== id));
      setMessage({ type: "success", text: `"${name}" deleted.` });
    } catch {
      setMessage({ type: "error", text: "Delete failed" });
    }
  };

  const styles = {
    dragging: { borderColor: "#c8902a", background: "#120904" },
    msg: {
      padding: "10px 12px",
      borderRadius: 6,
      marginBottom: 16,
      color: colors.text,
      fontSize: 12,
    },
  };

  return (
    <div className="upload-page">
      <aside className="bayt-sidebar">
        <div className="section-header">◆ Navigation</div>
        <div className="nav-item" onClick={() => navigate("/chat")}>Chat hall</div>
        <div className="nav-item active">Upload</div>
        <div className="nav-item" onClick={() => { localStorage.clear(); navigate("/login"); }}>Sign out</div>
      </aside>

      <main className="upload-main">
        <h1 style={{fontFamily:'Georgia,serif',color:'#d4a030',marginTop:0,marginBottom:24}}>Upload Manuscripts</h1>

        {/* Drop Zone */}
        <div
          className="upload-drop"
          style={{ ...(dragging ? styles.dragging : {}) }}
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
            <p>⏳ Uploading and indexing...</p>
          ) : (
            <>
              <p style={{fontSize:36,margin:0}}>📂</p>
              <p>Drag & drop PDF here, or click to browse</p>
              <p style={{fontSize:11,color:'#8a5a18'}}>Max 20MB · Academic PDFs only</p>
            </>
          )}
        </div>

        <div style={{marginBottom:24}}>
          <label style={{display:'block',fontSize:11,color:'#8a5a18',marginBottom:8,fontWeight:500}}>Category (optional)</label>
          <input className="bayt-input" value={category} onChange={(e)=>setCategory(e.target.value)} placeholder="e.g., Sciences" />
        </div>

        {/* Message */}
        {message && (
          <div style={{ ...styles.msg, background: message.type === "error" ? colors.errorBg : colors.successBg }}>
            {message.text}
          </div>
        )}

        {/* Uploaded Docs */}
        <h2 style={{fontFamily:'Georgia,serif',color:'#d4a030',marginTop:32,marginBottom:16}}>My Documents ({docs.length})</h2>
        {docs.length === 0 ? (
          <p style={{color:'#8a5a18'}}>No documents uploaded yet. Upload your first PDF above!</p>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {docs.map((doc) => (
              <div key={doc.id} className="upload-doc">
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span>📄</span>
                  <div style={{flex:1}}>
                    <p style={{margin:0,color:'#d4a030'}}>{doc.filename}</p>
                    <p style={{margin:0,fontSize:11,color:'#8a5a18'}}>
                      {new Date(doc.uploaded_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <button style={{background:'transparent',border:'none',color:colors.error,cursor:'pointer'}} onClick={() => handleDelete(doc.id, doc.filename)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
