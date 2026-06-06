import { useState, useEffect } from 'react';
import { getAllDocs, deleteDocById } from '../apis/axios';
import Navbar from '../components/Navbar';

export default function Library() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
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

  const categories = [...new Set(docs.map(d => d.category || 'Uncategorized'))];
  const filteredDocs = filter === 'all' 
    ? docs 
    : docs.filter(d => (d.category || 'Uncategorized') === filter);

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="page-title">Document Library</h1>
              <p className="page-description">Manage your uploaded documents</p>
            </div>
            <button className="btn-primary">Upload New</button>
          </div>
        </div>

        <div className="page-content">
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
                {docs.reduce((acc, d) => acc + (d.pages || 0), 0)}
              </div>
              <div className="stat-card-label">Total Pages</div>
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
                  <div className="library-card-icon">📄</div>
                  {doc.auto && <span className="auto-badge">auto</span>}
                  <div className="library-card-name">{doc.filename}</div>
                  <span className="library-card-category">{doc.category || 'Uncategorized'}</span>
                  <div className="library-card-meta">
                    <span>{doc.pages || 0} pages</span>
                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                  <div className="library-card-actions">
                    <a 
                      href={`${apiBaseUrl}/upload/docs/${doc.id}/download`}
                      className="btn-icon"
                      title="Download"
                    >
                      ⬇️
                    </a>
                    {doc.can_delete && (
                      <button 
                        className="btn-icon danger"
                        onClick={() => handleDelete(doc.id, doc.filename)}
                        title="Delete"
                      >
                        🗑️
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
