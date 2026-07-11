'use client'

import * as React from 'react'
import { Plus, Trash2, GripVertical, Settings, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

interface FormField {
  id: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'file' | 'checkbox' | 'select'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  multiple?: boolean
}

interface FormSchema {
  fields: FormField[]
}

interface FormBuilderProps {
  schema: FormSchema | null
  onChange: (schema: FormSchema) => void
}

const FIELD_TYPES = [
  { value: 'text', label: 'Teks Singkat' },
  { value: 'textarea', label: 'Teks Panjang' },
  { value: 'number', label: 'Angka' },
  { value: 'date', label: 'Tanggal' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Dropdown' },
  { value: 'file', label: 'Upload File' },
]

export function FormBuilder({ schema, onChange }: FormBuilderProps) {
  const [fields, setFields] = React.useState<FormField[]>(schema?.fields || [])
  const [editingField, setEditingField] = React.useState<FormField | null>(null)
  const [showFieldDialog, setShowFieldDialog] = React.useState(false)
  const [collapsedFields, setCollapsedFields] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    onChange({ fields })
  }, [fields, onChange])

  const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const addField = () => {
    const newField: FormField = {
      id: generateId(),
      name: `field_${fields.length + 1}`,
      label: `Field ${fields.length + 1}`,
      type: 'text',
      required: false,
      placeholder: '',
    }
    setEditingField(newField)
    setShowFieldDialog(true)
  }

  const saveField = (field: FormField) => {
    const existingIndex = fields.findIndex((f) => f.id === field.id)
    if (existingIndex >= 0) {
      const newFields = [...fields]
      newFields[existingIndex] = field
      setFields(newFields)
    } else {
      setFields([...fields, field])
    }
    setShowFieldDialog(false)
    setEditingField(null)
  }

  const deleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId))
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= fields.length) return
    ;[newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]
    setFields(newFields)
  }

  const toggleCollapse = (fieldId: string) => {
    const newCollapsed = new Set(collapsedFields)
    if (newCollapsed.has(fieldId)) {
      newCollapsed.delete(fieldId)
    } else {
      newCollapsed.add(fieldId)
    }
    setCollapsedFields(newCollapsed)
  }

  const openEditField = (field: FormField) => {
    setEditingField({ ...field })
    setShowFieldDialog(true)
  }

  const copyField = (field: FormField) => {
    const newField = {
      ...field,
      id: generateId(),
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`,
    }
    setFields([...fields, newField])
  }

  return (
    <div className="space-y-4">
      {/* Field List */}
      <div className="space-y-2">
        {fields.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
            <p>Belum ada field</p>
            <p className="text-sm">Klik tombol di bawah untuk menambah field</p>
          </div>
        ) : (
          fields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Drag Handle */}
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-muted rounded disabled:opacity-30"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => moveField(index, 'down')}
                      disabled={index === fields.length - 1}
                      className="p-1 hover:bg-muted rounded disabled:opacity-30"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Field Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{field.label}</span>
                      {field.required && (
                        <span className="text-red-500 text-sm">*</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="px-2 py-0.5 bg-muted rounded text-xs">
                        {FIELD_TYPES.find((t) => t.value === field.type)?.label}
                      </span>
                      <span>{field.name}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCollapse(field.id)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyField(field)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditField(field)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteField(field.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Collapsed Options */}
                {collapsedFields.has(field.id) && (
                  <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Name:</span>{' '}
                        <span className="font-mono">{field.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>{' '}
                        <span>{field.type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Placeholder:</span>{' '}
                        <span>{field.placeholder || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Required:</span>{' '}
                        <span>{field.required ? 'Ya' : 'Tidak'}</span>
                      </div>
                    </div>
                    {field.type === 'select' && field.options && (
                      <div>
                        <span className="text-muted-foreground">Options:</span>{' '}
                        <span>{field.options.map((o) => o.label).join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Field Button */}
      <Button variant="outline" onClick={addField} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Tambah Field
      </Button>

      {/* Field Editor Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField && fields.find((f) => f.id === editingField.id)
                ? 'Edit Field'
                : 'Tambah Field'}
            </DialogTitle>
            <DialogDescription>
              Atur properti field untuk form
            </DialogDescription>
          </DialogHeader>

          {editingField && (
            <FieldEditor
              field={editingField}
              onChange={saveField}
              onCancel={() => {
                setShowFieldDialog(false)
                setEditingField(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Field Editor Component
interface FieldEditorProps {
  field: FormField
  onChange: (field: FormField) => void
  onCancel: () => void
}

function FieldEditor({ field, onChange, onCancel }: FieldEditorProps) {
  const [localField, setLocalField] = React.useState<FormField>(field)

  const handleSave = () => {
    // Validate
    if (!localField.name || !localField.label) {
      alert('Nama dan Label harus diisi')
      return
    }
    // Convert name to snake_case
    const name = localField.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    onChange({ ...localField, name })
  }

  const addOption = () => {
    const options = localField.options || []
    const newOption = {
      label: `Option ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    }
    setLocalField({ ...localField, options: [...options, newOption] })
  }

  const updateOption = (index: number, key: 'label' | 'value', value: string) => {
    const options = [...(localField.options || [])]
    options[index] = { ...options[index], [key]: value }
    setLocalField({ ...localField, options })
  }

  const removeOption = (index: number) => {
    const options = [...(localField.options || [])]
    options.splice(index, 1)
    setLocalField({ ...localField, options })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Label *</Label>
        <Input
          placeholder="Contoh: Nama Lengkap"
          value={localField.label}
          onChange={(e) => setLocalField({ ...localField, label: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label> Nama Field *</Label>
        <Input
          placeholder="nama_field"
          value={localField.name}
          onChange={(e) => setLocalField({ ...localField, name: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Nama unik untuk field ini (tanpa spasi, gunakan underscore)
        </p>
      </div>

      <div className="space-y-2">
        <Label>Tipe Field</Label>
        <Select
          value={localField.type}
          onValueChange={(value: any) => setLocalField({ ...localField, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {localField.type !== 'checkbox' && (
        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input
            placeholder="Contoh: Masukkan nama lengkap"
            value={localField.placeholder || ''}
            onChange={(e) => setLocalField({ ...localField, placeholder: e.target.value })}
          />
        </div>
      )}

      {localField.type === 'select' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Opsi</Label>
            <Button variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-3 w-3 mr-1" />
              Tambah
            </Button>
          </div>
          <div className="space-y-2">
            {(localField.options || []).map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Label"
                  value={option.label}
                  onChange={(e) => updateOption(index, 'label', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Value"
                  value={option.value}
                  onChange={(e) => updateOption(index, 'value', e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Checkbox
          id="required"
          checked={localField.required}
          onCheckedChange={(checked) => setLocalField({ ...localField, required: !!checked })}
        />
        <Label htmlFor="required" className="font-normal">
          Wajib diisi
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="multiple"
          checked={localField.multiple}
          onCheckedChange={(checked) => setLocalField({ ...localField, multiple: !!checked })}
        />
        <Label htmlFor="multiple" className="font-normal">
         允许多个文件 (Multiple file upload)
        </Label>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button onClick={handleSave}>Simpan</Button>
      </DialogFooter>
    </div>
  )
}

export { FORM_SCHEMA_PRESETS } from '@/components/dynamic-form'
