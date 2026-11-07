import React, { useEffect, useRef } from 'react'
import { Sparkles, User, Copy, Check, Code, Lightbulb, Apple, Rocket } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'

const PROMPT_SUGGESTIONS = [
  {
    icon: Lightbulb,
    category: 'Concept',
    text: 'Explain how AI works in a few words',
  },
  {
    icon: Apple,
    category: 'Quick Answer',
    text: 'apple color is',
  },
  {
    icon: Code,
    category: 'Coding',
    text: 'Write a JavaScript function to reverse a string',
  },
  {
    icon: Rocket,
    category: 'Brainstorm',
    text: 'Suggest 3 creative GenAI project ideas',
  },
]

export default function ChatArea({ messages, isLoading, onSelectPrompt }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  return (
    <div className="messages-container" ref={scrollRef}>
      {messages.length === 0 ? (
        <div className="welcome-container">
          <div className="welcome-badge-icon">
            <Sparkles size={32} />
          </div>
          <h2 className="welcome-title">How can I help you today?</h2>
          <p className="welcome-subtitle">
            modexa is connected directly to your Google Gemini API key. Click a card below or type any question to start.
          </p>

          <div className="cards-grid">
            {PROMPT_SUGGESTIONS.map((item, index) => {
              const IconComp = item.icon
              return (
                <div
                  key={index}
                  className="prompt-card"
                  onClick={() => onSelectPrompt(item.text)}
                >
                  <div className="prompt-card-header">
                    <IconComp size={15} />
                    <span>{item.category}</span>
                  </div>
                  <div className="prompt-card-text">{item.text}</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        messages.map((msg, index) => (
          <MessageItem key={index} message={msg} />
        ))
      )}

      {/* Thinking / Loading Animation */}
      {isLoading && (
        <div className="thinking-container">
          <div className="message-avatar ai-avatar">
            <Sparkles size={16} />
          </div>
          <div className="thinking-bubble">
            <span>Gemini is thinking</span>
            <div className="pulsing-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MessageItem({ message }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'assistant'}`}>
      <div className={`message-avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`}>
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>

      <div className="message-body">
        <div className="message-bubble">
          {isUser ? (
            message.content
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        <div className="message-actions">
          <span>{message.time || ''}</span>
          {!isUser && (
            <button className="action-btn-sm" onClick={handleCopy} title="Copy Message">
              {copied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

