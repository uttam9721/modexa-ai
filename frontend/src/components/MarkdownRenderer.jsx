import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function MarkdownRenderer({ content }) {
  if (!content) return null

  // Helper to render code blocks
  const renderFormatted = (text) => {
    // Split by code blocks ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Push preceding text
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        })
      }

      // Push code block
      parts.push({
        type: 'code',
        language: match[1] || 'code',
        code: match[2].trim(),
      })

      lastIndex = match.index + match[0].length
    }

    // Push remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
      })
    }

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return <CodeBlock key={index} language={part.language} code={part.code} />
      }
      return <FormattedText key={index} text={part.content} />
    })
  }

  return <div className="markdown-container">{renderFormatted(content)}</div>
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <pre>
      <div className="code-header-bar">
        <span>{language}</span>
        <button className="copy-btn" onClick={handleCopy} title="Copy Code">
          {copied ? (
            <>
              <Check size={14} color="#34d399" />
              <span style={{ color: '#34d399' }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <code>{code}</code>
    </pre>
  )
}

function FormattedText({ text }) {
  // Format bold **text**, inline `code`, and newlines
  const paragraphs = text.split(/\n\n+/)

  return (
    <>
      {paragraphs.map((p, pIndex) => {
        // Line by line within paragraph
        const lines = p.split('\n')
        return (
          <p key={pIndex} style={{ marginBottom: pIndex === paragraphs.length - 1 ? 0 : '10px' }}>
            {lines.map((line, lIndex) => {
              // Parse bullet point
              const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ')
              const lineContent = isBullet ? line.trim().slice(2) : line

              return (
                <React.Fragment key={lIndex}>
                  {isBullet && <span style={{ color: '#818cf8', marginRight: '6px' }}>•</span>}
                  <InlineFormatter text={lineContent} />
                  {lIndex < lines.length - 1 && <br />}
                </React.Fragment>
              )
            })}
          </p>
        )
      })}
    </>
  )
}

function InlineFormatter({ text }) {
  // Split inline code `code`
  const codeParts = text.split(/(`[^`]+`)/g)

  return (
    <>
      {codeParts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="inline-code">
              {part.slice(1, -1)}
            </code>
          )
        }

        // Split bold **bold**
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g)
        return (
          <React.Fragment key={i}>
            {boldParts.map((bPart, bIndex) => {
              if (bPart.startsWith('**') && bPart.endsWith('**')) {
                return <strong key={bIndex}>{bPart.slice(2, -2)}</strong>
              }
              return bPart
            })}
          </React.Fragment>
        )
      })}
    </>
  )
}

