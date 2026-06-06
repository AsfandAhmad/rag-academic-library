import { useState } from 'react';

export default function SourcePanel({ sources = [] }) {
  const [filter, setFilter] = useState('all');

  const filteredSources = sources.filter(s => {
    const score = s.score || 0;
    if (filter === 'high') return score >= 0.85;
    if (filter === 'mid') return score >= 0.6 && score < 0.85;
    return true;
  });

  const avgScore = sources.length > 0 
    ? Math.round(sources.reduce((acc, s) => acc + (s.score || 0), 0) / sources.length * 100) 
    : 0;

  const getScoreClass = (score) => {
    if (score >= 0.85) return 'high';
    if (score >= 0.6) return 'mid';
    return 'low';
  };

  const formatScore = (score) => {
    if (typeof score === 'undefined' || score === null) return 'n/a';
    return Math.round(score * 100) + '%';
  };

  return (
    <div className="mk-source-panel">
      {/* IR Metrics Section */}
      <div className="panel-header">
        <div className="section-header">IR METRICS</div>
        <div className="section-subtitle">Information Retrieval Statistics</div>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-label">Sources used</span>
          <span className="stat-value">{sources.length}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Avg score</span>
          <span className="stat-value">{avgScore}%</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">High quality</span>
          <span className="stat-value">{sources.filter(s => (s.score || 0) >= 0.85).length}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Total chunks</span>
          <span className="stat-value">{sources.length}</span>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="section-header">FILTER BY RELEVANCE</div>
        <div className="filter-pills">
          <button 
            className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({sources.length})
          </button>
          <button 
            className={`filter-pill ${filter === 'high' ? 'active' : ''}`}
            onClick={() => setFilter('high')}
          >
            High ({sources.filter(s => (s.score || 0) >= 0.85).length})
          </button>
          <button 
            className={`filter-pill ${filter === 'mid' ? 'active' : ''}`}
            onClick={() => setFilter('mid')}
          >
            Mid ({sources.filter(s => {
              const score = s.score || 0;
              return score >= 0.6 && score < 0.85;
            }).length})
          </button>
        </div>
      </div>

      {/* Source Cards */}
      <div className="source-cards">
        {filteredSources.length === 0 ? (
          <div className="empty-state">
            {sources.length === 0 
              ? 'Ask a question to see retrieved sources'
              : 'No sources match this filter'
            }
          </div>
        ) : (
          filteredSources.map((source, i) => (
            <div key={i} className="source-card">
              <div className="source-header">
                <div className="source-file">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{source.filename}</span>
                </div>
                <span className="source-page">Page {source.page}</span>
              </div>

              <div className="source-excerpt">{source.excerpt}</div>

              <div className="source-scores">
                <div className="score-row">
                  <span className="score-label">Final Score</span>
                  <span className={`score-pill ${getScoreClass(source.score || 0)}`}>
                    {formatScore(source.score)}
                  </span>
                </div>
                <div className="score-bar-container">
                  <div 
                    className={`score-bar-fill ${getScoreClass(source.score || 0)}`}
                    style={{ width: `${(source.score || 0) * 100}%` }}
                  />
                </div>
                <div className="score-details">
                  <span className="score-detail">
                    Rerank: {formatScore(source.rerank_score)}
                  </span>
                  <span className="score-detail">
                    Embed: {formatScore(source.embedding_score)}
                  </span>
                </div>
              </div>

              <div className="source-meta">
                <span className="chunk-info">Chunk {source.chunk ?? '-'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
