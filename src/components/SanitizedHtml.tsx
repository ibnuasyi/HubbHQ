'use client'

import { sanitizeHtml } from '@/lib/sanitize'

interface SanitizedHtmlProps {
  html: string
  className?: string
}

/**
 * Client component for rendering sanitized HTML content
 * Wraps dangerouslySetInnerHTML with DOMPurify sanitization
 */
export default function SanitizedHtml({ html, className = '' }: SanitizedHtmlProps) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  )
}
