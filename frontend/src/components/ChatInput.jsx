import React, { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Sparkles, Code2, Lightbulb, HelpCircle, CornerDownLeft } from 'lucide-react'

const ROTATING_PROMPTS = [
  'Ask Gemini anything...',
  'Write, debug, or explain code...',
  'Explain complex ideas in simple words...',
  'Brainstorm creative ideas & startups...',
  'apple color is...',
]

const QUICK_ACTIONS = [
  { icon: Lightbulb, label: 'Explain AI', prompt: 'Explain how AI works in a few words' },
  { icon: Code2, label: 'Reverse string', prompt: 'Write a JavaScript function to reverse a string' },
  { icon: Sparkles, label: 'GenAI ideas', prompt: 'Suggest 3 fun project ideas using Generative AI' },
  { icon: HelpCircle, label: 'Apple color', prompt: 'apple color is' },
]

export default function ChatInput({ onSendMessage, isLoading }) {
  const [input, setInput] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)

  // Cycle rotating placeholder
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_PROMPTS.length)
    }, 3200)
    return () => clearInterval(timer)
  }, [])

  // Speech Recognition initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
        setIsListening(false)
      }

      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)

      recognitionRef.current = recognition
    }
  }, [])

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error('Speech recognition error:', err)
        setIsListening(false)
      }
    }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    if (!input.trim() || isLoading) return

    onSendMessage(input.trim())
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleQuickAction = (promptText) => {
    onSendMessage(promptText)
  }

  return (
    <footer className="input-dock">
      {/* Quick Action Chips above input bar */}
      <div className="quick-action-bar">
        {QUICK_ACTIONS.map((action, idx) => {
          const IconComp = action.icon
          return (
            <button
              key={idx}
              type="button"
              className="quick-chip"
              onClick={() => handleQuickAction(action.prompt)}
              disabled={isLoading}
            >
              <IconComp size={13} />
              <span>{action.label}</span>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="input-box-wrapper">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={ROTATING_PROMPTS[placeholderIndex]}
          rows={1}
          className="chat-textarea"
          disabled={isLoading}
        />

        <div className="input-actions">
          {/* Subtle Enter Key Hint */}
          <span className="enter-shortcut-badge" title="Press Enter to send">
            <CornerDownLeft size={11} />
            <span>Enter</span>
          </span>

          {/* Voice Input Mic */}
          <button
            type="button"
            className={`mic-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleSpeech}
            title={isListening ? 'Listening... click to stop' : 'Voice Input (Speech-to-text)'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            className="send-action-btn"
            disabled={!input.trim() || isLoading}
            title="Send Message"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </footer>
  )
}
