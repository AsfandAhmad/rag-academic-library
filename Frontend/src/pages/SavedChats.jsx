import { useState, useEffect } from 'react';
import { clearHistory, deleteHistoryItem, getHistory } from '../apis/axios';
import Navbar from '../components/Navbar';

export default function SavedChats() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const getItemId = (item) => item?.id ?? item?.query_id ?? item?.queryId;

  const fetchHistory = async () => {
    try {
      const res = await getHistory();
      setHistory(
        (res.data || []).map((item) => ({
          ...item,
          id: getItemId(item),
        }))
      );
    } catch (e) {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, question) => {
    if (id === undefined || id === null) {
      alert('Delete failed: missing chat history ID');
      return;
    }

    if (!confirm(`Delete this saved chat?\n\n${question}`)) return;

    setDeletingId(id);
    try {
      await deleteHistoryItem(id);
      await fetchHistory();
    } catch (e) {
      alert(e.response?.data?.detail || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all chat history?')) return;
    try {
      await clearHistory();
      setHistory([]);
    } catch (e) {
      alert(e.response?.data?.detail || 'Clear all failed');
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">Saved Chats</h1>
              <p className="page-description">Your conversation history</p>
            </div>
            <button className="btn-danger" onClick={handleClearAll}>
              Clear All
            </button>
          </div>
        </div>

        <div className="page-content">
          {loading ? (
            <div className="loading-spinner"></div>
          ) : history.length === 0 ? (
            <div className="empty-state">No chat history yet</div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-card">
                  <div className="history-icon">💬</div>
                  <div className="history-content">
                    <div className="history-question">{item.question}</div>
                    <div className="history-meta">
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="history-actions">
                    <button className="btn-secondary">View</button>
                    <button
                      className="btn-danger"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id, item.question)}
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
