import { useRef, useState, useEffect } from 'react';
import { getAllDocs, deleteDocById, uploadPDFWithProgress } from '../apis/axios';
import Navbar from '../components/Navbar';

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="action-icon-svg">
    <path d="M12 3v11" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="action-icon-svg">
    <path d="M4 7h16" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M6 7l1 15h10l1-15" />
    <path d="M9 7V4h6v3" />
  </svg>
);

export default function Library() {
  const fileInputRef = useRef(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [uploadStatus, setUploadStatus] = useState(null);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await getAllDocs();
      setDocs(res.data || []);
    } catch (e) {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteDocById(id);
      setDocs(docs.filter(d => d.id !== id));
    } catch (e) {
      alert('Delete failed');
    }
  };

  const handleUploadNew = () => {
    if (uploadStatus?.state === 'uploading' || uploadStatus?.state === 'processing') return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadStatus({
        state: 'error',
        fileName: file.name,
        progress: 0,
        message: 'Please choose a PDF file.',
      });
      return;
    }

    setUploadStatus({
      state: 'uploading',
      fileName: file.name,
      progress: 0,
      message: 'Starting upload',
    });

    try {
      const res = await uploadPDFWithProgress(file, (progress) => {
        setUploadStatus({
          state: progress >= 100 ? 'processing' : 'uploading',
          fileName: file.name,
          progress,
          message: progress >= 100 ? 'Indexing document' : `${progress}% uploaded`,
        });
      });

      await fetchDocs();
      setUploadStatus({
        state: 'complete',
        fileName: res.data.filename || file.name,
        progress: 100,
        message: `${res.data.chunks || 0} chunks indexed`,
      });

      window.setTimeout(() => {
        setUploadStatus((current) =>
          current?.fileName === (res.data.filename || file.name) ? null : current
        );
      }, 3500);
    } catch (err) {
      setUploadStatus({
        state: 'error',
        fileName: file.name,
        progress: 0,
        message: err.response?.data?.detail || err.message || 'Upload failed',
      });
    }
  };

  const categories = [...new Set(docs.map(d => d.category || 'Uncategorized'))];
  const filteredDocs = filter === 'all' 
    ? docs 
    : docs.filter(d => (d.category || 'Uncategorized') === filter);

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">Document Library</h1>
              <p className="page-description">Manage your uploaded documents</p>
            </div>
            <button
              className="btn-primary"
              onClick={handleUploadNew}
              disabled={uploadStatus?.state === 'uploading' || uploadStatus?.state === 'processing'}
            >
              {uploadStatus?.state === 'uploading' || uploadStatus?.state === 'processing'
                ? 'Uploading...'
                : 'Upload New'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="sr-only-file"
              onChange={handleFileSelected}
            />
          </div>
        </div>

        <div className="page-content">
          {uploadStatus && (
            <div className={`library-upload-status ${uploadStatus.state}`}>
              <div className="upload-status-row">
                <span className="upload-status-name">{uploadStatus.fileName}</span>
                <span className="upload-status-percent">{uploadStatus.progress}%</span>
              </div>
              <div
                className="upload-progress-track"
                role="progressbar"
                aria-valuenow={uploadStatus.progress}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  className="upload-progress-fill"
                  style={{ width: `${uploadStatus.progress}%` }}
                />
              </div>
              <div className="upload-status-message">{uploadStatus.message}</div>
            </div>
          )}

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-card-value">{docs.length}</div>
              <div className="stat-card-label">Total Documents</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{categories.length}</div>
              <div className="stat-card-label">Categories</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">
                {docs.reduce((acc, d) => acc + (d.chunk_count || 0), 0)}
              </div>
              <div className="stat-card-label">Indexed Chunks</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">
                {docs.filter(d => d.auto).length}
              </div>
              <div className="stat-card-label">Auto-categorized</div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="category-filter">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                className={`filter-btn ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Document Grid */}
          <div className="doc-grid">
            {loading ? (
              <div className="loading-spinner"></div>
            ) : filteredDocs.length === 0 ? (
              <div className="empty-state">No documents found</div>
            ) : (
              filteredDocs.map(doc => (
                <div key={doc.id} className="library-card">
                  <div className="library-card-icon">PDF</div>
                  {doc.auto && <span className="auto-badge">auto</span>}
                  <div className="library-card-name">{doc.filename}</div>
                  <span className="library-card-category">{doc.category || 'Uncategorized'}</span>
                  <div className="library-card-meta">
                    <span>{doc.chunk_count || 0} chunks</span>
                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                  <div className="library-card-actions">
                    <a 
                      href={`${apiBaseUrl}/upload/docs/${doc.id}/download`}
                      className="btn-icon"
                      title="Download"
                      aria-label={`Download ${doc.filename}`}
                    >
                      <DownloadIcon />
                    </a>
                    {doc.can_delete && (
                      <button 
                        className="btn-icon danger"
                        onClick={() => handleDelete(doc.id, doc.filename)}
                        title="Delete"
                        aria-label={`Delete ${doc.filename}`}
                      >
                        <DeleteIcon />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
