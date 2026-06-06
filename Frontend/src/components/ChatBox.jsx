import { useRef, useEffect } from 'react';

export default function ChatBox({ 
  selectedDoc, 
  messages = [], 
  input, 
  setInput, 
  onSend, 
  isLoading 
}) {
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const quickPrompts = [
    "Summarise this document",
    "What are the key concepts?",
    "List all topics covered",
    "Explain chapter 1",
    "Compare the main arguments"
  ];

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="mk-chatbox">
      {/* Chat Header */}
      <div className="chat-header">
        <div>
          <h2 className="chat-title">Chat with the Archive</h2>
          <p className="chat-subtitle">Ask questions about your documents</p>
        </div>
        <div className="chat-actions">
          <button className="btn-secondary">Clear Chat</button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          // Welcome State
          <div className="welcome-state">
            <div className="lantern-wrap">
              <div className="lantern-top"></div>
              <div className="lantern-body">
                <div className="flame"></div>
              </div>
            </div>
            <h3 className="welcome-title">Welcome to Maktab e Kamil</h3>
            <p className="welcome-text">
              The Archive awaits your inquiry. Every answer is drawn from your documents,
              with citations to source and page.
            </p>
            <div className="quick-prompts">
              <div className="prompts-label">Quick Prompts</div>
              {quickPrompts.map((prompt, i) => (
                <button 
                  key={i}
                  className="prompt-chip"
                  onClick={() => handleQuickPrompt(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Messages
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`message ${msg.role === 'assistant' ? 'ai' : 'user'}`}
            >
              <div className="message-avatar">
                {msg.role === 'assistant' ? '📚' : '👤'}
              </div>
              <div className="message-content">
                <div className="message-role">
                  {msg.role === 'assistant' ? 'Archive' : 'You'}
                </div>
                <div className="message-text">{msg.content}</div>
                {msg.response_time && (
                  <div className="message-meta">
                    ⚡ {msg.response_time}s response time
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Document Context Bar */}
      {selectedDoc && (
        <div className="context-bar">
          <span className="context-icon">📄</span>
          <span className="context-text">
            Asking about: <strong>{selectedDoc.filename}</strong>
          </span>
          <button className="context-clear">×</button>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        <p className="input-notice">
          Answers are generated only from your uploaded documents. 
          Every response cites its source file and page.
        </p>
        
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the archive..."
            className="chat-textarea"
            disabled={isLoading}
          />
          <button 
            className="send-btn" 
            onClick={onSend}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? '...' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}
