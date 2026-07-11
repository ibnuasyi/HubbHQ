/**
 * JSON Schema Poisoning Prevention
 * Validates and sanitizes dynamic form schemas to prevent malicious injection
 */

import { ZodSchema, z } from 'zod'

// Whitelist of allowed field types
const ALLOWED_FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'date',
  'email',
  'phone',
  'url',
  'checkbox',
  'select',
  'radio',
] as const

type AllowedFieldType = typeof ALLOWED_FIELD_TYPES[number]

// Maximum limits to prevent DoS
const MAX_FIELDS = 50
const MAX_FIELD_NAME_LENGTH = 100
const MAX_OPTIONS_PER_FIELD = 20
const MAX_OPTION_LENGTH = 200

/**
 * Validate field name to prevent injection
 * Only allows alphanumeric, underscore, and hyphen
 */
function isValidFieldName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_-]{0,MAX_FIELD_NAME_LENGTH}$/.test(name)
}

/**
 * Validate option value
 */
function isValidOptionValue(value: string): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_OPTION_LENGTH
  )
}

/**
 * Zod schema for validating form field
 */
const FormFieldSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(MAX_FIELD_NAME_LENGTH)
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'Field name must start with letter and contain only alphanumeric, underscore, or hyphen'),
  label: z.string().min(1).max(200),
  type: z.enum(ALLOWED_FIELD_TYPES),
  required: z.boolean().optional().default(false),
  placeholder: z.string().max(500).optional(),
  options: z
    .array(
      z.object({
        label: z.string().min(1).max(MAX_OPTION_LENGTH),
        value: z.string().min(1).max(MAX_OPTION_LENGTH),
      })
    )
    .max(MAX_OPTIONS_PER_FIELD)
    .optional(),
  multiple: z.boolean().optional().default(false),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(), // Regex pattern for validation
  helpText: z.string().max(500).optional(),
})

/**
 * Zod schema for validating entire form schema
 */
const FormSchemaSchema = z.object({
  fields: z
    .array(FormFieldSchema)
    .min(1, 'Form must have at least one field')
    .max(MAX_FIELDS, `Form cannot have more than ${MAX_FIELDS} fields`),
})

export type FormField = z.infer<typeof FormFieldSchema>
export type FormSchema = z.infer<typeof FormSchemaSchema>

/**
 * Validate a form schema
 * Returns the validated schema or throws an error
 */
export function validateFormSchema(schema: unknown): FormSchema {
  // First check if it's an object
  if (!schema || typeof schema !== 'object') {
    throw new Error('Form schema must be an object')
  }

  // Check for prototype pollution
  const obj = schema as Record<string, unknown>
  if ('__proto__' in obj || 'constructor' in obj) {
    throw new Error('Invalid schema: prototype pollution detected')
  }

  // Validate with Zod
  try {
    return FormSchemaSchema.parse(schema)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
      throw new Error(`Invalid form schema: ${messages.join(', ')}`)
    }
    throw error
  }
}

/**
 * Safely parse form schema with fallback
 * Returns default schema on validation failure
 */
export function safeParseFormSchema(schema: unknown): FormSchema {
  try {
    return validateFormSchema(schema)
  } catch (error) {
    console.error('[FORM SECURITY] Invalid schema rejected:', error)
    return getDefaultFormSchema()
  }
}

/**
 * Sanitize a single value based on field type
 */
export function sanitizeValue(value: unknown, field: FormField): unknown {
  if (value === null || value === undefined) {
    return field.required ? '' : value
  }

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'phone':
    case 'url':
      // Sanitize string values - remove HTML/scripts
      if (typeof value !== 'string') return ''
      return value
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim()
        .slice(0, 10000) // Limit length

    case 'number':
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const num = parseFloat(value)
        if (isNaN(num)) return field.required ? 0 : null
        // Apply min/max constraints
        if (field.min !== undefined && num < field.min) return field.min
        if (field.max !== undefined && num > field.max) return field.max
        return num
      }
      return field.required ? 0 : null

    case 'date':
      if (value instanceof Date) return value.toISOString()
      if (typeof value === 'string') {
        const date = new Date(value)
        if (isNaN(date.getTime())) return null
        return date.toISOString()
      }
      return null

    case 'checkbox':
      return Boolean(value)

    case 'select':
    case 'radio':
      // Validate against allowed options
      if (field.options) {
        const allowedValues = field.options.map((o) => o.value)
        if (allowedValues.includes(value as string)) {
          return value
        }
        return field.required ? allowedValues[0] : null
      }
      return value

    default:
      // For unknown types, return as string after sanitization
      if (typeof value === 'string') {
        return value.replace(/<[^>]*>/g, '').trim()
      }
      return typeof value === 'object' ? JSON.stringify(value) : value
  }
}

/**
 * Sanitize entire form data
 */
export function sanitizeFormData(
  data: Record<string, unknown>,
  schema: FormSchema
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const field of schema.fields) {
    const value = data[field.name]
    sanitized[field.name] = sanitizeValue(value, field)
  }

  return sanitized
}

/**
 * Get default form schema
 */
export function getDefaultFormSchema(): FormSchema {
  return {
    fields: [
      {
        name: 'recipient',
        label: 'Tujuan/Penerima',
        type: 'text',
        required: true,
        placeholder: 'Nama penerima surat',
        multiple: false,
      },
      {
        name: 'subject',
        label: 'Perihal',
        type: 'text',
        required: true,
        placeholder: 'Perihal surat',
        multiple: false,
      },
      {
        name: 'body',
        label: 'Isi Surat',
        type: 'textarea',
        required: true,
        placeholder: 'Tulis isi surat di sini...',
        multiple: false,
      },
    ],
  }
}

/**
 * Validate field name format (for API)
 */
export function validateFieldName(name: string): {
  valid: boolean
  error?: string
} {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Field name is required' }
  }

  if (!isValidFieldName(name)) {
    return {
      valid: false,
      error:
        'Field name must start with a letter and contain only alphanumeric characters, underscores, or hyphens',
    }
  }

  // Check for reserved names
  const reservedNames = ['submit', 'action', 'method', 'enctype', 'type', 'name', 'value']
  if (reservedNames.includes(name.toLowerCase())) {
    return { valid: false, error: `Field name '${name}' is reserved` }
  }

  return { valid: true }
}

/**
 * Create a safe form schema from user input (for form builder)
 */
export function createSafeFormSchema(input: unknown): FormSchema {
  // First validate the structure
  const validated = validateFormSchema(input)

  // Additional sanitization pass
  validated.fields = validated.fields.map((field) => ({
    ...field,
    name: field.name.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
    label: field.label.trim().slice(0, 200),
    placeholder: field.placeholder?.trim().slice(0, 500),
    options: field.options?.map((opt) => ({
      label: opt.label.trim().slice(0, MAX_OPTION_LENGTH),
      value: opt.value.trim().slice(0, MAX_OPTION_LENGTH),
    })),
  }))

  return validated
}
