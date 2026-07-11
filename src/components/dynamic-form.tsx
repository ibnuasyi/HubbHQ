'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Loader2, Upload } from 'lucide-react'
import { sanitizeValue, sanitizeFormData, safeParseFormSchema, getDefaultFormSchema } from '@/lib/form-schema'
import { sanitizeClassName } from '@/lib/css-sanitize'

interface FormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'file' | 'checkbox' | 'select' | 'email' | 'phone' | 'url' | 'radio'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  multiple?: boolean
  className?: string // For custom styling - sanitized
}

interface FormSchema {
  fields: FormField[]
}

interface DynamicFormProps {
  formSchema: FormSchema
  formData: Record<string, any>
  onChange: (data: Record<string, any>) => void
  disabled?: boolean
}

export function DynamicForm({
  formSchema,
  formData,
  onChange,
  disabled = false,
}: DynamicFormProps) {
  // Validate and sanitize form schema on mount
  const safeSchema = React.useMemo(() => {
    try {
      return safeParseFormSchema(formSchema)
    } catch {
      return getDefaultFormSchema()
    }
  }, [formSchema])

  const handleChange = (name: string, value: any) => {
    // Sanitize value based on field type
    const field = safeSchema.fields.find(f => f.name === name)
    const sanitizedValue = field ? sanitizeValue(value, field) : value

    onChange({
      ...formData,
      [name]: sanitizedValue,
    })
  }

  const renderField = (field: FormField) => {
    // Sanitize className to prevent CSS injection
    const safeClassName = field.className
      ? sanitizeClassName(field.className)
      : undefined

    const value = formData[field.name] ?? ''

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
      case 'number':
      case 'date':
        return (
          <Input
            type={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : field.type}
            placeholder={field.placeholder}
            value={value as string}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={disabled}
            required={field.required}
            className={safeClassName}
          />
        )

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={disabled}
            required={field.required}
            rows={4}
          />
        )

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.name}
              checked={value}
              onCheckedChange={(checked) => handleChange(field.name, checked)}
              disabled={disabled}
            />
            <Label htmlFor={field.name} className="text-sm font-normal">
              {field.placeholder || 'Ya'}
            </Label>
          </div>
        )

      case 'file':
        return (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.multiple = !!field.multiple
                input.accept = field.name.includes('image') ? 'image/*' : '*/*'
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files
                  if (files) {
                    handleChange(field.name, field.multiple ? Array.from(files) : files[0])
                  }
                }
                input.click()
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              {value ? 'Ganti File' : 'Upload File'}
            </Button>
            {value && (
              <p className="text-sm text-muted-foreground">
                {field.multiple
                  ? `${(value as File[]).length} file(s) dipilih`
                  : (value as File).name}
              </p>
            )}
          </div>
        )

      default:
        return (
          <Input
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={disabled}
            required={field.required}
          />
        )
    }
  }

  return (
    <div className="space-y-4">
      {formSchema.fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}
    </div>
  )
}

// Export form schema presets for common surat types
export const FORM_SCHEMA_PRESETS = {
  // Surat Keterangan
  suratKeterangan: {
    fields: [
      {
        name: 'recipient',
        label: 'Ditujukan Kepada',
        type: 'text',
        required: true,
        placeholder: 'Nama penerima',
      },
      {
        name: 'subject',
        label: 'Perihal',
        type: 'text',
        required: true,
        placeholder: 'Yang bersangkutan / Keterangan',
      },
      {
        name: 'body',
        label: 'Isi Keterangan',
        type: 'textarea',
        required: true,
        placeholder: 'Dengan ini menyatakan bahwa...',
      },
      {
        name: 'keperluan',
        label: 'Keperluan',
        type: 'text',
        required: true,
        placeholder: 'Untuk keperluan melamar kerja, dll',
      },
    ],
  },

  // Surat Undangan
  suratUndangan: {
    fields: [
      {
        name: 'recipient',
        label: 'Undangan Kepada',
        type: 'text',
        required: true,
        placeholder: 'Nama yang diundang',
      },
      {
        name: 'eventName',
        label: 'Nama Kegiatan',
        type: 'text',
        required: true,
        placeholder: 'Nama kegiatan/rapat',
      },
      {
        name: 'eventDate',
        label: 'Tanggal Kegiatan',
        type: 'date',
        required: true,
      },
      {
        name: 'eventTime',
        label: 'Waktu',
        type: 'text',
        required: true,
        placeholder: '08.00 WIB s/d selesai',
      },
      {
        name: 'eventLocation',
        label: 'Tempat',
        type: 'text',
        required: true,
        placeholder: 'Lokasi kegiatan',
      },
      {
        name: 'body',
        label: 'Detail Undangan',
        type: 'textarea',
        required: false,
        placeholder: 'Agenda dan informasi tambahan',
      },
    ],
  },

  // Surat Keputusan
  suratKeputusan: {
    fields: [
      {
        name: 'keputusanNumber',
        label: 'Nomor SK',
        type: 'text',
        required: true,
        placeholder: '001/PER/PANitia/2026',
      },
      {
        name: 'tentang',
        label: 'Tentang',
        type: 'text',
        required: true,
        placeholder: 'Pembentukan Panita...',
      },
      {
        name: 'body',
        label: 'Menimbang',
        type: 'textarea',
        required: true,
        placeholder: 'Menimbang bahwa...',
      },
      {
        name: 'mengingat',
        label: 'Mengingat',
        type: 'textarea',
        required: false,
        placeholder: '1. AD/ART...',
      },
      {
        name: 'attachments',
        label: 'Lampiran',
        type: 'file',
        required: false,
        multiple: true,
      },
    ],
  },

  // Surat Perintah
  suratPerintah: {
    fields: [
      {
        name: 'recipient',
        label: 'Yang Diperintahkan',
        type: 'text',
        required: true,
        placeholder: 'Nama persone',
      },
      {
        name: 'command',
        label: 'Perintah',
        type: 'textarea',
        required: true,
        placeholder: 'Untuk segera...',
      },
      {
        name: 'dueDate',
        label: 'Batas Waktu',
        type: 'date',
        required: false,
      },
    ],
  },

  // Surat Edaran
  suratEdaran: {
    fields: [
      {
        name: 'subject',
        label: 'Perihal',
        type: 'text',
        required: true,
        placeholder: 'Perihal edaran',
      },
      {
        name: 'body',
        label: 'Isi Edaran',
        type: 'textarea',
        required: true,
        placeholder: 'Diberitahukan kepada...',
      },
      {
        name: 'attachments',
        label: 'Lampiran',
        type: 'file',
        required: false,
        multiple: true,
      },
    ],
  },
}
