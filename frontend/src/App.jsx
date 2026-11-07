import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import ChatArea from './components/ChatArea'
import ChatInput from './components/ChatInput'

// Automatic API base detection
const isHostedOnBackend = window.location.origin.includes(':5000')
const API_BASE = isHostedOnBackend ? '' : 'http://localhost:5000'
const CHAT_URL = `${API_BASE}/api/chat`
const HEALTH_URL = `${API_BASE}/api/health`

const STORAGE_KEY = 'gemini_studio_sessions_v1'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

function createNewSession() {
  return {
    id: generateId(),
    title: 'New Conversation',
    messages: [],
    createdAt: Date.now(),
  }
}

export default function App() {
  // Load saved sessions or create initial session
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.warn('Could not load sessions from localStorage', e)
    }
    return [createNewSession()]
  })

  const [activeSessionId, setActiveSessionId] = useState(() => {
    return sessions[0]?.id || ''
  })

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedModel, setSelectedModel] = useState('gemini-flash-lite-latest')
  const [backendOnline, setBackendOnline] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch (e) {
      console.error('Error saving sessions:', e)
    }
  }, [sessions])

  // Periodic Backend Health Check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(HEALTH_URL)
        if (res.ok) {
          setBackendOnline(true)
        } else {
          setBackendOnline(false)
        }
      } catch (err) {
        setBackendOnline(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 8000)
    return () => clearInterval(interval)
  }, [])

  // Keyboard shortcut Ctrl + K for new chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        handleNewChat()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sessions])

  // Current session & messages
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]
  const currentMessages = activeSession?.messages || []

  const handleNewChat = () => {
    const newSession = createNewSession()
    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(newSession.id)
  }

  const handleDeleteSession = (idToDelete) => {
    const remaining = sessions.filter((s) => s.id !== idToDelete)
    if (remaining.length === 0) {
      const fresh = createNewSession()
      setSessions([fresh])
      setActiveSessionId(fresh.id)
    } else {
      setSessions(remaining)
      if (activeSessionId === idToDelete) {
        setActiveSessionId(remaining[0].id)
      }
    }
  }

  const handleClearCurrentChat = () => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [], title: 'New Conversation' } : s))
    )
  }

  const handleExportChat = () => {
    if (currentMessages.length === 0) return

    let markdown = `# ${activeSession.title || 'Gemini Conversation'}\n\n`
    currentMessages.forEach((m) => {
      const role = m.role === 'user' ? '**You**' : '**Gemini**'
      markdown += `### ${role} (${m.time || ''})\n\n${m.content}\n\n---\n\n`
    })

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(activeSession.title || 'chat').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Send message to backend
  const handleSendMessage = async (text) => {
    if (!text || isLoading) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userMessage = {
      role: 'user',
      content: text,
      time: timeStr,
    }

    // Auto-update title if it's the first message
    const shouldUpdateTitle = currentMessages.length === 0
    const newTitle = shouldUpdateTitle
      ? text.length > 28
        ? text.substring(0, 28) + '...'
        : text
      : activeSession.title

    // Add user message to state
    const updatedMessages = [...currentMessages, userMessage]
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, title: newTitle, messages: updatedMessages }
          : s
      )
    )

    setIsLoading(true)

    try {
      // Build conversation history for multi-turn context
      const historyPayload = currentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          message: text,
          model: selectedModel,
          history: historyPayload,
        }),
      })

      const data = await response.json()

      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      if (!response.ok || !data.success) {
        const errorMsg = data.error || `Server responded with status ${response.status}`
        const errorAssistantMsg = {
          role: 'assistant',
          content: `⚠️ **Error:** ${errorMsg}`,
          time: replyTime,
          isError: true,
        }
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: [...updatedMessages, errorAssistantMsg] }
              : s
          )
        )
      } else {
        const replyText = data.output_text || data.reply || 'No response text received.'
        const aiMessage = {
          role: 'assistant',
          content: replyText,
          time: replyTime,
        }

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: [...updatedMessages, aiMessage] }
              : s
          )
        )
      }
    } catch (err) {
      console.error('Fetch error:', err)
      const errorMsg = {
        role: 'assistant',
        content: `❌ **Could not connect to backend server:** ${err.message}.\n\nPlease ensure your backend is running:\n\`\`\`bash\ncd server\nnode server.js\n\`\`\``,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...updatedMessages, errorMsg] }
            : s
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        backendOnline={backendOnline}
      />

      {/* Main Chat Workspace */}
      <div className="main-content">
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          currentTitle={activeSession?.title}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onClearChat={handleClearCurrentChat}
          onExportChat={handleExportChat}
          hasMessages={currentMessages.length > 0}
        />

        <ChatArea
          messages={currentMessages}
          isLoading={isLoading}
          onSelectPrompt={handleSendMessage}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
