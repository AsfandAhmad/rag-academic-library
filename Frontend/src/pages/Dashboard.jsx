import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDocs, getHistory, getStats } from '../apis/axios';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [docsRes, historyRes, statsRes] = await Promise.all([
          getAllDocs(),
          getHistory(),
          getStats(),
        ]);

        setDocs(docsRes.data || []);
        setHistory(historyRes.data || []);
        setStats(statsRes.data || null);
      } catch (e) {
        setDocs([]);
        setHistory([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const latestDocs = useMemo(() => {
    return [...docs]
      .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
      .slice(0, 6);
  }, [docs]);

  const categories = useMemo(() => {
    return new Set(docs.map((doc) => doc.category || 'Uncategorized')).size;
  }, [docs]);

  const lastIndexed = stats?.last_indexed
    ? new Date(stats.last_indexed).toLocaleDateString()
    : 'No uploads yet';

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-description">Your academic library at a glance</p>
            </div>
            <div className="dashboard-header-actions">
              <button className="btn-primary" onClick={() => navigate('/chat')}>
                New Chat
              </button>
              <button className="btn-secondary" onClick={() => navigate('/library')}>
                View Library
              </button>
            </div>
          </div>
        </div>

        <div className="page-content">
          <div className="stats-row dashboard-stats">
            <div className="stat-card">
              <div className="stat-card-value">{docs.length}</div>
              <div className="stat-card-label">Uploaded Documents</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats?.total_chunks || 0}</div>
              <div className="stat-card-label">Indexed Chunks</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{history.length}</div>
              <div className="stat-card-label">Recent Chats</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{categories}</div>
              <div className="stat-card-label">Categories</div>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="dashboard-panel dashboard-actions-panel">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">Start Here</h2>
                <span className="dashboard-panel-meta">{lastIndexed}</span>
              </div>
              <div className="dashboard-action-list">
                <button className="dashboard-action" onClick={() => navigate('/chat')}>
                  <span className="dashboard-action-icon">+</span>
                  <span>
                    <strong>Create a new chat</strong>
                    <small>Ask questions across your indexed documents.</small>
                  </span>
                </button>
                <button className="dashboard-action" onClick={() => navigate('/library')}>
                  <span className="dashboard-action-icon">DOC</span>
                  <span>
                    <strong>Browse uploaded documents</strong>
                    <small>Review, download, and manage the full collection.</small>
                  </span>
                </button>
                <button className="dashboard-action" onClick={() => navigate('/upload')}>
                  <span className="dashboard-action-icon">UP</span>
                  <span>
                    <strong>Upload a PDF</strong>
                    <small>Add new reading material to the archive.</small>
                  </span>
                </button>
                <button className="dashboard-action" onClick={() => navigate('/saved')}>
                  <span className="dashboard-action-icon">HIS</span>
                  <span>
                    <strong>Review saved chats</strong>
                    <small>Return to recent research questions.</small>
                  </span>
                </button>
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">Uploaded Documents</h2>
                <button className="btn-secondary compact" onClick={() => navigate('/library')}>
                  All Documents
                </button>
              </div>
              {loading ? (
                <div className="loading-spinner"></div>
              ) : latestDocs.length === 0 ? (
                <div className="empty-state compact">No documents uploaded yet.</div>
              ) : (
                <div className="dashboard-doc-list">
                  {latestDocs.map((doc) => (
                    <button
                      key={doc.id}
                      className="dashboard-doc-row"
                      onClick={() => navigate('/library')}
                    >
                      <span className="dashboard-doc-icon">PDF</span>
                      <span className="dashboard-doc-info">
                        <strong>{doc.filename}</strong>
                        <small>
                          {(doc.uploaded_by || 'Unknown')} -{' '}
                          {doc.uploaded_at
                            ? new Date(doc.uploaded_at).toLocaleDateString()
                            : 'No date'}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">Recent Questions</h2>
                <button className="btn-secondary compact" onClick={() => navigate('/saved')}>
                  Saved Chats
                </button>
              </div>
              {loading ? (
                <div className="loading-spinner"></div>
              ) : history.length === 0 ? (
                <div className="empty-state compact">No chat history yet.</div>
              ) : (
                <div className="dashboard-history-list">
                  {history.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      className="dashboard-history-row"
                      onClick={() => navigate('/saved')}
                    >
                      <strong>{item.question}</strong>
                      <small>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : 'No date'}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
