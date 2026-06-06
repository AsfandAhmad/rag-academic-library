import { useState } from 'react';

export default function Sidebar({ docs = [], selectedDoc, setSelectedDoc, onUpload }) {
  const [openCategories, setOpenCategories] = useState({});
  const [dragOver, setDragOver] = useState(false);

  // Group docs by category
  const categories = docs.reduce((acc, doc) => {
    const category = doc.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {});

  const toggleCategory = (name) => {
    setOpenCategories(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && onUpload) onUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && onUpload) onUpload(file);
  };

  return (
    <div className="mk-sidebar">
      {/* Upload Section */}
      <div className="sidebar-section">
        <div className="section-header">UPLOAD DOCS</div>
        <div 
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
        >
          <div className="upload-icon">☁️</div>
          <div className="upload-text">Drop PDF here</div>
          <div className="upload-or">or</div>
        </div>
        <label className="btn-primary full-width">
          <input 
            type="file" 
            accept=".pdf" 
            style={{ display: 'none' }} 
            onChange={handleFileSelect}
          />
          Choose File
        </label>
      </div>

      {/* Categories Section */}
      <div className="sidebar-section flex-1">
        <div className="section-header">CATEGORIES</div>
        <div className="categories-list">
          {Object.keys(categories).length === 0 ? (
            <div className="empty-state">No documents yet</div>
          ) : (
            Object.entries(categories).map(([name, catDocs]) => (
              <div key={name}>
                <div 
                  className="category-row" 
                  onClick={() => toggleCategory(name)}
                >
                  <span className="category-icon">📁</span>
                  <span className="category-name">{name}</span>
                  <span className="badge">{catDocs.length}</span>
                  <span className={`chevron ${openCategories[name] ? 'open' : ''}`}>
                    ›
                  </span>
                </div>
                
                {openCategories[name] && (
                  <div className="doc-list">
                    {catDocs.map(doc => (
                      <div 
                        key={doc.id} 
                        className={`doc-item ${selectedDoc?.id === doc.id ? 'selected' : ''}`}
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <span className="doc-name">{doc.filename}</span>
                        {doc.auto && <span className="auto-badge">auto</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
