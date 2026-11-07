import React from 'react'
import { PanelLeft, Download, RotateCcw, Cpu } from 'lucide-react'

export default function Navbar({
  sidebarOpen,
  onToggleSidebar,
  currentTitle,
  selectedModel,
  onModelChange,
  onClearChat,
  onExportChat,
  hasMessages,
}) {
  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button className="icon-btn" onClick={onToggleSidebar} title="Toggle Sidebar">
          <PanelLeft size={18} />
        </button>
        <span className="navbar-title">{currentTitle || 'Gemini Chat'}</span>
      </div>

      <div className="navbar-right">
        {/* Model Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={15} style={{ color: 'var(--text-muted)' }} />
          <select
            className="model-pill-select"
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
          >
            <option value="gemini-flash-lite-latest">gemini-flash-lite (Fastest) ⚡</option>
            <option value="gemini-flash-latest">gemini-flash-latest</option>
            <option value="gemini-pro-latest">gemini-pro-latest 🧠</option>
            <option value="gemini-3.8-flash">gemini-3.8-flash</option>
          </select>
        </div>

        {/* Export Chat */}
        {hasMessages && (
          <button className="icon-btn" onClick={onExportChat} title="Export Chat as Markdown">
            <Download size={16} />
          </button>
        )}

        {/* Clear Current Chat */}
        {hasMessages && (
          <button className="icon-btn" onClick={onClearChat} title="Clear Current Conversation">
            <RotateCcw size={16} />
          </button>
        )}
      </div>
    </header>
  )
}

