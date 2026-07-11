import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses isomorphic-dompurify for SSR support (works on both client and server)
 * @param html - Raw HTML string
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'target', 'rel', 'width', 'height'
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'svg', 'math'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
  })
}

/**
 * Sanitize HTML and add target="_blank" to all links for security
 * Uses isomorphic-dompurify for SSR support
 * @param html - Raw HTML string
 * @returns Sanitized HTML with safe external links
 */
export function sanitizeHtmlWithLinks(html: string): string {
  if (!html) return ''

  // First sanitize
  let sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'target', 'rel', 'width', 'height'
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'svg', 'math'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
  })

  // Add target="_blank" and rel="noopener noreferrer" to external links
  // Use regex replacement for SSR compatibility
  sanitized = sanitized.replace(
    /<a\s+([^>]*href=["'])(https?:\/\/[^"']+)(["'][^>]*)>/gi,
    '<a $1$2$3 target="_blank" rel="noopener noreferrer">'
  )

  return sanitized
}

/**
 * Strip all HTML tags and return plain text
 * Uses isomorphic-dompurify for SSR support
 * @param html - Raw HTML string
 * @returns Plain text without HTML
 */
export function stripHtml(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

// Alias for backward compatibility
export const sanitize = sanitizeHtml
