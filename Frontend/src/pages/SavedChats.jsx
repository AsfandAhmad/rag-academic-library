import { useState, useEffect } from 'react';
import { getHistory } from '../apis/axios';
import Navbar from '../components/Navbar';

export default function SavedChats() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await getHistory();
      setHistory(res.data || []);
    } catch (e) {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    if (!confirm('Clear all chat history?')) return;
    // TODO: Implement clear all API call
    setHistory([]);
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                    <button className="btn-danger">Delete</button>
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
