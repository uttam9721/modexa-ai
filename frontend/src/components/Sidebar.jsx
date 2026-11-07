import React from 'react'
import { Plus, MessageSquare, Trash2, Sparkles, Server } from 'lucide-react'

export default function Sidebar({
  isOpen,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  backendOnline,
}) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="brand-title">modexa</span>
            <span className="brand-badge">AI</span>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <button className="new-chat-btn" onClick={onNewChat}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} />
          <span>New Chat</span>
        </span>
        <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>Ctrl + K</span>
      </button>

      {/* Chat Sessions History */}
      <div className="sidebar-sessions">
        <div className="session-section-title">Recent Conversations</div>
        {sessions.length === 0 ? (
          <div style={{ padding: '16px 12px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            No chat history yet. Start a new conversation!
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
              onClick={() => onSelectSession(session.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <MessageSquare size={15} style={{ opacity: 0.7, flexShrink: 0 }} />
                <span className="session-title-text">{session.title || 'New Conversation'}</span>
              </div>
              <button
                className="session-delete-btn"
                title="Delete Chat"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSession(session.id)
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Info & Backend Status */}
      <div className="sidebar-footer">
        <div className="backend-status-pill">
          <Server size={14} style={{ color: 'var(--text-muted)' }} />
          <span>Backend:</span>
          <span className={`status-indicator-dot ${backendOnline ? 'online' : 'offline'}`} />
          <span style={{ color: backendOnline ? '#34d399' : '#f87171', fontWeight: 600 }}>
            {backendOnline ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>
    </aside>
  )
}

