import { useEffect, useRef, useState } from 'react';

export default function Sidebar({
  docs = [],
  selectedDoc,
  setSelectedDoc,
  onUpload,
  uploadStatus,
}) {
  const [openCategories, setOpenCategories] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const isUploading =
    uploadStatus?.state === 'uploading' ||
    uploadStatus?.state === 'processing';

  const categories = docs.reduce((acc, doc) => {
    const category = doc.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {});

  useEffect(() => {
    if (!selectedDoc) return;
    const matchingDoc = docs.find((doc) => doc.id === selectedDoc.id);
    const category = matchingDoc?.category || selectedDoc.category || 'Uncategorized';
    setOpenCategories((prev) => ({ ...prev, [category]: true }));
  }, [docs, selectedDoc]);

  const toggleCategory = (name) =>
    setOpenCategories((prev) => ({ ...prev, [name]: !prev[name] }));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && onUpload && !isUploading) onUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isUploading) setDragOver(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && onUpload) onUpload(file);
    e.target.value = '';
  };

  const openFilePicker = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  return (
    <div className="mk-sidebar">

      {/* ── Upload section (fixed, never scrolls away) ── */}
      <div className="sidebar-upload-section">
        <div className="sidebar-section-label">Upload Docs</div>

        <div
          className={`upload-zone${dragOver ? ' drag-over' : ''}${isUploading ? ' is-uploading' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={openFilePicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFilePicker();
            }
          }}
        >
          <div className="upload-icon">PDF</div>
          <div className="upload-text">
            {isUploading ? 'Uploading…' : 'Drop PDF here'}
          </div>
          <div className="upload-or">or choose a file</div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        <button
          className="btn-primary full-width"
          type="button"
          onClick={openFilePicker}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading…' : 'Choose File'}
        </button>

        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.state}`}>
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
      </div>

      {/* ── Categories section (scrollable) ── */}
      <div className="sidebar-categories-section">
        <div className="categories-list-header">Categories</div>
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
                  <span className="category-icon">DIR</span>
                  <span className="category-name">{name}</span>
                  <span className="badge">{catDocs.length}</span>
                  <span className={`chevron${openCategories[name] ? ' open' : ''}`}>
                    &gt;
                  </span>
                </div>

                {openCategories[name] && (
                  <div className="doc-list">
                    {catDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className={`doc-item${selectedDoc?.id === doc.id ? ' selected' : ''}`}
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