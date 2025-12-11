"use client"

import { useMemo } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"

interface MathTextProps {
  children: string
  className?: string
}

// Parse text and render LaTeX formulas
export function MathText({ children, className = "" }: MathTextProps) {
  const renderedContent = useMemo(() => {
    if (!children) return ""

    // Split by LaTeX patterns: $$...$$ (display) and $...$ (inline)
    // Process display math first ($$...$$), then inline math ($...$)
    const parts: { type: "text" | "inline" | "display"; content: string }[] = []
    let remaining = children

    // Regex for display math ($$...$$) - non-greedy
    const displayRegex = /\$\$([\s\S]+?)\$\$/g
    // Regex for inline math ($...$) - non-greedy, not matching $$
    const inlineRegex = /\$([^\$]+?)\$/g

    // First pass: extract display math
    let lastIndex = 0
    let match: RegExpExecArray | null

    const tempParts: { type: "text" | "display"; content: string; start: number; end: number }[] = []

    while ((match = displayRegex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        tempParts.push({
          type: "text",
          content: remaining.slice(lastIndex, match.index),
          start: lastIndex,
          end: match.index,
        })
      }
      tempParts.push({
        type: "display",
        content: match[1],
        start: match.index,
        end: match.index + match[0].length,
      })
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < remaining.length) {
      tempParts.push({
        type: "text",
        content: remaining.slice(lastIndex),
        start: lastIndex,
        end: remaining.length,
      })
    }

    // Second pass: process inline math within text parts
    tempParts.forEach((part) => {
      if (part.type === "display") {
        parts.push({ type: "display", content: part.content })
      } else {
        // Process inline math in text
        let textRemaining = part.content
        let textLastIndex = 0

        while ((match = inlineRegex.exec(textRemaining)) !== null) {
          if (match.index > textLastIndex) {
            parts.push({
              type: "text",
              content: textRemaining.slice(textLastIndex, match.index),
            })
          }
          parts.push({
            type: "inline",
            content: match[1],
          })
          textLastIndex = match.index + match[0].length
        }

        if (textLastIndex < textRemaining.length) {
          parts.push({
            type: "text",
            content: textRemaining.slice(textLastIndex),
          })
        }

        // Reset regex lastIndex
        inlineRegex.lastIndex = 0
      }
    })

    // If no parts were created, return the original text
    if (parts.length === 0) {
      return children
    }

    return parts
  }, [children])

  if (typeof renderedContent === "string") {
    return <span className={className}>{renderedContent}</span>
  }

  return (
    <span className={className}>
      {renderedContent.map((part, index) => {
        if (part.type === "text") {
          return <span key={index}>{part.content}</span>
        }

        try {
          const html = katex.renderToString(part.content, {
            throwOnError: false,
            displayMode: part.type === "display",
            strict: false,
          })

          if (part.type === "display") {
            return (
              <span
                key={index}
                className="block my-2 text-center overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )
          }

          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        } catch (error) {
          console.error("KaTeX error:", error)
          // Fallback: show the raw LaTeX
          return (
            <code key={index} className="bg-muted px-1 rounded text-sm">
              {part.type === "display" ? `$$${part.content}$$` : `$${part.content}$`}
            </code>
          )
        }
      })}
    </span>
  )
}
