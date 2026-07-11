/**
 * CSS Injection Prevention
 * Sanitizes CSS values and class names to prevent style-based attacks
 */

/**
 * Allowed CSS properties (whitelist)
 * Only these properties can be set dynamically
 */
const ALLOWED_CSS_PROPERTIES = new Set([
  // Colors
  'color', 'background-color', 'border-color', 'outline-color',
  'text-decoration-color', 'text-emphasis-color', 'text-shadow',

  // Typography
  'font-size', 'font-weight', 'font-family', 'font-style',
  'line-height', 'letter-spacing', 'word-spacing', 'text-align',
  'text-transform', 'text-indent', 'white-space',

  // Spacing
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',

  // Sizing
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',

  // Display
  'display', 'visibility', 'opacity', 'overflow', 'position',
  'top', 'right', 'bottom', 'left', 'z-index',

  // Border
  'border', 'border-width', 'border-style', 'border-radius',

  // Flexbox
  'flex', 'flex-direction', 'flex-wrap', 'justify-content',
  'align-items', 'align-content', 'gap', 'order',

  // Grid
  'grid-template-columns', 'grid-template-rows', 'grid-gap',

  // Effects
  'box-shadow', 'transform', 'transition', 'animation',

  // List
  'list-style', 'list-style-type',

  // Table
  'border-collapse', 'border-spacing', 'table-layout',
])

/**
 * Dangerous CSS patterns that could be used for attacks
 */
const DANGEROUS_PATTERNS = [
  // URL-based attacks
  /url\s*\(/i,
  // Expression (IE)
  /expression\s*\(/i,
  // Import
  /@import/i,
  // JavaScript
  /javascript:/i,
  // Data URIs in properties
  /data:/i,
  // vbscript
  /vbscript:/i,
  // Behavior (IE)
  /behavior\s*:/i,
  // Binding
  /binding\s*:/i,
  // -moz-binding
  /-moz-binding/i,
  // Filter (IE)
  /filter\s*:/i,
  // CSS Variables injection attempt
  /var\s*\(/i,
  // Calc injection
  /calc\s*\(/i,
  // SVG-based attacks
  /xlink\s*:/i,
  // Animations with URLs
  /animation.*url\s*\(/i,
]

/**
 * Validate a CSS property name
 */
export function isValidCssProperty(property: string): boolean {
  return ALLOWED_CSS_PROPERTIES.has(property.toLowerCase())
}

/**
 * Validate a CSS value for dangerous patterns
 */
export function containsDangerousPatterns(value: string): boolean {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(value)) {
      return true
    }
  }
  return false
}

/**
 * Sanitize a CSS value
 */
export function sanitizeCssValue(value: string): string {
  if (!value || typeof value !== 'string') {
    return ''
  }

  // Check for dangerous patterns
  if (containsDangerousPatterns(value)) {
    console.warn('[CSS SECURITY] Dangerous pattern detected in CSS value:', value)
    return ''
  }

  // Limit length
  if (value.length > 500) {
    console.warn('[CSS SECURITY] CSS value too long, truncating')
    return value.slice(0, 500)
  }

  return value.trim()
}

/**
 * Validate a class name
 * Prevents injection via class names
 */
export function sanitizeClassName(className: string): string {
  if (!className || typeof className !== 'string') {
    return ''
  }

  // Only allow alphanumeric, hyphen, underscore
  const sanitized = className.replace(/[^a-zA-Z0-9_-]/g, '')

  // Limit length
  if (sanitized.length > 50) {
    return sanitized.slice(0, 50)
  }

  return sanitized
}

/**
 * Sanitize multiple class names
 */
export function sanitizeClassNames(classNames: string | string[]): string[] {
  if (typeof classNames === 'string') {
    return classNames
      .split(/\s+/)
      .map(sanitizeClassName)
      .filter(Boolean)
  }

  return classNames.map(sanitizeClassName).filter(Boolean)
}

/**
 * Sanitize a style object
 */
export function sanitizeStyleObject(
  styles: Record<string, string | number>
): Record<string, string> {
  const sanitized: Record<string, string> = {}

  for (const [property, value] of Object.entries(styles)) {
    if (!isValidCssProperty(property)) {
      console.warn(`[CSS SECURITY] Blocked invalid CSS property: ${property}`)
      continue
    }

    const sanitizedValue = sanitizeCssValue(String(value))
    if (sanitizedValue) {
      sanitized[property] = sanitizedValue
    }
  }

  return sanitized
}

/**
 * Parse and sanitize inline style string
 * Input: "color: red; font-size: 14px"
 * Output: { "color": "red", "font-size": "14px" }
 */
export function parseAndSanitizeStyleString(
  styleString: string
): Record<string, string> {
  if (!styleString || typeof styleString !== 'string') {
    return {}
  }

  const styles: Record<string, string> = {}
  const declarations = styleString.split(';')

  for (const declaration of declarations) {
    const [property, ...valueParts] = declaration.split(':')

    if (!property || valueParts.length === 0) {
      continue
    }

    const prop = property.trim().toLowerCase()
    const value = valueParts.join(':').trim()

    if (isValidCssProperty(prop) && value) {
      const sanitizedValue = sanitizeCssValue(value)
      if (sanitizedValue) {
        styles[prop] = sanitizedValue
      }
    }
  }

  return styles
}

/**
 * Validate color value
 * Only allows hex, rgb, rgba, hsl, hsla formats
 */
export function isValidColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false
  }

  // Hex colors
  if (/^#[0-9a-fA-F]{3,8}$/.test(color)) {
    return true
  }

  // rgb/rgba
  if (/^rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/i.test(color)) {
    return true
  }

  // hsl/hsla
  if (/^hsla?\s*\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(,\s*[\d.]+\s*)?\)$/i.test(color)) {
    return true
  }

  // Named colors (basic list)
  const namedColors = new Set([
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
    'gray', 'grey', 'orange', 'purple', 'pink', 'brown', 'navy', 'teal',
    'transparent', 'inherit', 'initial', 'unset', 'currentcolor',
  ])

  return namedColors.has(color.toLowerCase())
}

/**
 * Sanitize a color value
 */
export function sanitizeColor(color: string): string {
  if (!color || typeof color !== 'string') {
    return ''
  }

  const trimmed = color.trim()

  if (isValidColor(trimmed)) {
    return trimmed
  }

  console.warn('[CSS SECURITY] Invalid color value:', color)
  return ''
}

/**
 * Validate a numeric value with optional units
 */
export function sanitizeNumericValue(
  value: string | number,
  allowedUnits: string[] = ['px', 'em', 'rem', '%', 'vh', 'vw', 'pt']
): string {
  if (typeof value === 'number') {
    return String(value)
  }

  if (!value || typeof value !== 'string') {
    return ''
  }

  // Check for allowed units
  const unitPattern = `(${allowedUnits.join('|')})`
  const numericRegex = new RegExp(`^-?\\d+\\.?\\d*\\s*${unitPattern}?$`)

  if (numericRegex.test(value.trim())) {
    return value.trim()
  }

  // Just a number
  const numRegex = /^-?\d+\.?\d*$/
  if (numRegex.test(value.trim())) {
    return value.trim()
  }

  console.warn('[CSS SECURITY] Invalid numeric value:', value)
  return ''
}

/**
 * Generate safe CSS custom properties
 * Used for theme colors and similar dynamic CSS
 */
export function generateSafeCssVariables(
  variables: Record<string, string>,
  prefix: string = ''
): string {
  const safeVars: string[] = []

  for (const [key, value] of Object.entries(variables)) {
    // Sanitize variable name
    const safeName = key.replace(/[^a-zA-Z0-9-_]/g, '')

    if (!safeName) continue

    // Sanitize value
    const safeValue = sanitizeColor(value) || sanitizeNumericValue(value)

    if (safeValue) {
      const varName = prefix ? `${prefix}-${safeName}` : safeName
      safeVars.push(`--${varName}: ${safeValue};`)
    }
  }

  return safeVars.join('\n')
}

/**
 * Check if a string contains potential CSS injection
 */
export function detectCssInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false
  }

  // Check for common injection patterns
  const injectionPatterns = [
    /<\s*style/i,
    /style\s*=/i,
    /<\/\s*style/i,
    /<!--.*-->/i, // HTML comments
    /@import/i,
    /expression\s*\(/i,
    /javascript:/i,
    /data:text\/css/i,
    /<\s*link[^>]*href/i,
  ]

  for (const pattern of injectionPatterns) {
    if (pattern.test(input)) {
      return true
    }
  }

  return false
}

/**
 * Remove CSS injection attempts from a string
 */
export function removeCssInjection(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  let result = input

  // Remove style tags
  result = result.replace(/<\s*style[^>]*>[\s\S]*?<\/\s*style\s*>/gi, '')

  // Remove style attributes
  result = result.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '')

  // Remove HTML comments
  result = result.replace(/<!--[\s\S]*?-->/g, '')

  // Remove @import
  result = result.replace(/@import\s+["'][^"']+["']/gi, '')

  return result
}
