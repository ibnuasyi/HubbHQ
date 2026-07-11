'use client'

import * as React from 'react'
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  FileText,
  Settings,
  Eye,
  Copy,
  Wrench,
  Code,
  LayoutTemplate,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { FormBuilder } from '@/components/form-builder'
import { DynamicForm, FORM_SCHEMA_PRESETS } from '@/components/dynamic-form'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface JenisSurat {
  id: string
  name: string
  code: string
  templateUrl?: string
  formSchema?: any
  autoNumber: boolean
  numberPrefix?: string
  numberFormat?: string
  isActive: boolean
  _count?: { surat: number }
}

export default function JenisSuratPage() {
  const [jenisSurat, setJenisSurat] = React.useState<JenisSurat[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAdd, setShowAdd] = React.useState(false)
  const [showEdit, setShowEdit] = React.useState(false)
  const [showPreview, setShowPreview] = React.useState(false)
  const [selectedJenis, setSelectedJenis] = React.useState<JenisSurat | null>(null)
  const [saving, setSaving] = React.useState(false)

  // Form state
  const [formName, setFormName] = React.useState('')
  const [formCode, setFormCode] = React.useState('')
  const [formAutoNumber, setFormAutoNumber] = React.useState(true)
  const [formNumberPrefix, setFormNumberPrefix] = React.useState('')
  const [formNumberFormat, setFormNumberFormat] = React.useState('')
  const [formSchema, setFormSchema] = React.useState<any>(null)
  const [usePreset, setUsePreset] = React.useState<string>('')
  const [formTab, setFormTab] = React.useState<string>('builder')

  const fetchJenisSurat = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/jenis-surat')
      const data = await res.json()
      if (data.data) {
        setJenisSurat(data.data)
      }
    } catch (error) {
      console.error('Error fetching jenis surat:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchJenisSurat()
  }, [])

  const resetForm = () => {
    setFormName('')
    setFormCode('')
    setFormAutoNumber(true)
    setFormNumberPrefix('')
    setFormNumberFormat('')
    setFormSchema(null)
    setUsePreset('')
    setFormTab('builder')
  }

  const handleAdd = async () => {
    if (!formName || !formCode) return

    setSaving(true)
    try {
      const res = await fetch('/api/jenis-surat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          code: formCode,
          autoNumber: formAutoNumber,
          numberPrefix: formNumberPrefix || null,
          numberFormat: formNumberFormat || null,
          formSchema: formSchema,
        }),
      })

      if (res.ok) {
        setShowAdd(false)
        resetForm()
        fetchJenisSurat()
      }
    } catch (error) {
      console.error('Error adding jenis surat:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedJenis || !formName) return

    setSaving(true)
    try {
      const res = await fetch(`/api/jenis-surat/${selectedJenis.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          code: formCode,
          autoNumber: formAutoNumber,
          numberPrefix: formNumberPrefix || null,
          numberFormat: formNumberFormat || null,
          formSchema: formSchema,
        }),
      })

      if (res.ok) {
        setShowEdit(false)
        resetForm()
        setSelectedJenis(null)
        fetchJenisSurat()
      }
    } catch (error) {
      console.error('Error updating jenis surat:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (jenis: JenisSurat) => {
    if (!confirm(`Hapus jenis surat "${jenis.name}"?`)) return

    try {
      const res = await fetch(`/api/jenis-surat/${jenis.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchJenisSurat()
      }
    } catch (error) {
      console.error('Error deleting jenis surat:', error)
    }
  }

  const openEdit = (jenis: JenisSurat) => {
    setSelectedJenis(jenis)
    setFormName(jenis.name)
    setFormCode(jenis.code)
    setFormAutoNumber(jenis.autoNumber)
    setFormNumberPrefix(jenis.numberPrefix || '')
    setFormNumberFormat(jenis.numberFormat || '')
    setFormSchema(jenis.formSchema || null)
    setShowEdit(true)
  }

  const openPreview = (jenis: JenisSurat) => {
    setSelectedJenis(jenis)
    setShowPreview(true)
  }

  const handlePresetSelect = (presetKey: string) => {
    setUsePreset(presetKey)
    if (presetKey && FORM_SCHEMA_PRESETS[presetKey as keyof typeof FORM_SCHEMA_PRESETS]) {
      setFormSchema(FORM_SCHEMA_PRESETS[presetKey as keyof typeof FORM_SCHEMA_PRESETS])
    }
  }

  const copySchemaToClipboard = () => {
    const schema = JSON.stringify(formSchema, null, 2)
    navigator.clipboard.writeText(schema)
    alert('Schema berhasil disalin ke clipboard!')
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jenis Surat</h1>
          <p className="text-muted-foreground">
            Kelola template dan form untuk setiap jenis surat
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Jenis Surat
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jenisSurat.map((jenis) => (
            <Card key={jenis.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{jenis.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{jenis.code}</Badge>
                      {jenis._count?.surat ? (
                        <span className="text-xs">{jenis._count.surat} surat</span>
                      ) : null}
                    </CardDescription>
                  </div>
                  <Badge variant={jenis.autoNumber ? 'default' : 'secondary'}>
                    {jenis.autoNumber ? 'Auto No.' : 'Manual'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {jenis.numberPrefix && (
                    <p>Prefix: {jenis.numberPrefix}</p>
                  )}
                  {jenis.formSchema?.fields?.length ? (
                    <p>{jenis.formSchema.fields.length} field form</p>
                  ) : (
                    <p>Form default</p>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPreview(jenis)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(jenis)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(jenis)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {jenisSurat.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Belum ada jenis surat</p>
              <Button variant="link" onClick={() => setShowAdd(true)}>
                Tambah jenis surat pertama
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Jenis Surat</DialogTitle>
            <DialogDescription>
              Tambah jenis surat baru dengan template form
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Jenis Surat *</Label>
                <Input
                  placeholder="Surat Keterangan"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kode *</Label>
                <Input
                  placeholder="SK"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preset Form</Label>
              <Select value={usePreset} onValueChange={handlePresetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih preset atau mulai dari nol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suratKeterangan">📄 Surat Keterangan</SelectItem>
                  <SelectItem value="suratUndangan">📅 Surat Undangan</SelectItem>
                  <SelectItem value="suratKeputusan">⚖️ Surat Keputusan</SelectItem>
                  <SelectItem value="suratPerintah">📋 Surat Perintah</SelectItem>
                  <SelectItem value="suratEdaran">📢 Surat Edaran</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="autoNumber"
                checked={formAutoNumber}
                onCheckedChange={(checked) => setFormAutoNumber(!!checked)}
              />
              <Label htmlFor="autoNumber" className="font-normal">
                Penomoran otomatis
              </Label>
            </div>

            {formAutoNumber && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prefix Nomor</Label>
                  <Input
                    placeholder="001"
                    value={formNumberPrefix}
                    onChange={(e) => setFormNumberPrefix(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Format Nomor</Label>
                  <Input
                    placeholder="{prefix}/{code}/{year}/{number}"
                    value={formNumberFormat}
                    onChange={(e) => setFormNumberFormat(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Form Builder Section */}
            <div className="space-y-2">
              <Label>Form Schema (Builder)</Label>
              <Tabs value={formTab} onValueChange={setFormTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="builder" className="gap-1">
                    <Wrench className="h-3 w-3" />
                    Builder
                  </TabsTrigger>
                  <TabsTrigger value="json" className="gap-1">
                    <Code className="h-3 w-3" />
                    JSON
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-1">
                    <LayoutTemplate className="h-3 w-3" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="builder" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Tambahkan field form dengan mudah. Drag untuk reorder, klik untuk edit.
                  </p>
                  <FormBuilder
                    schema={formSchema}
                    onChange={(schema) => setFormSchema(schema)}
                  />
                </TabsContent>

                <TabsContent value="json" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Edit JSON schema secara manual. Gunakan dengan hati-hati.
                    </p>
                    <Button variant="ghost" size="sm" onClick={copySchemaToClipboard}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={JSON.stringify(formSchema, null, 2)}
                    onChange={(e) => {
                      try {
                        setFormSchema(JSON.parse(e.target.value))
                      } catch {}
                    }}
                    rows={12}
                    className="font-mono text-xs"
                    placeholder='{"fields": []}'
                  />
                </TabsContent>

                <TabsContent value="preview">
                  <p className="text-sm text-muted-foreground mb-4">
                    Preview form yang akan digunakan untuk surat ini.
                  </p>
                  {formSchema ? (
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <DynamicForm
                        formSchema={formSchema}
                        formData={{}}
                        onChange={() => {}}
                        disabled
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>Belum ada form schema</p>
                      <p className="text-sm">Pilih preset atau tambahkan field</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm() }}>
              Batal
            </Button>
            <Button onClick={handleAdd} disabled={saving || !formName || !formCode}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Jenis Surat</DialogTitle>
            <DialogDescription>
              Edit template dan form untuk {selectedJenis?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Jenis Surat *</Label>
                <Input
                  placeholder="Surat Keterangan"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kode *</Label>
                <Input
                  placeholder="SK"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preset Form</Label>
              <Select value={usePreset} onValueChange={handlePresetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih preset atau mulai dari nol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suratKeterangan">📄 Surat Keterangan</SelectItem>
                  <SelectItem value="suratUndangan">📅 Surat Undangan</SelectItem>
                  <SelectItem value="suratKeputusan">⚖️ Surat Keputusan</SelectItem>
                  <SelectItem value="suratPerintah">📋 Surat Perintah</SelectItem>
                  <SelectItem value="suratEdaran">📢 Surat Edaran</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="autoNumberEdit"
                checked={formAutoNumber}
                onCheckedChange={(checked) => setFormAutoNumber(!!checked)}
              />
              <Label htmlFor="autoNumberEdit" className="font-normal">
                Penomoran otomatis
              </Label>
            </div>

            {formAutoNumber && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prefix Nomor</Label>
                  <Input
                    placeholder="001"
                    value={formNumberPrefix}
                    onChange={(e) => setFormNumberPrefix(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Format Nomor</Label>
                  <Input
                    placeholder="{prefix}/{code}/{year}/{number}"
                    value={formNumberFormat}
                    onChange={(e) => setFormNumberFormat(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Form Builder Section */}
            <div className="space-y-2">
              <Label>Form Schema (Builder)</Label>
              <Tabs value={formTab} onValueChange={setFormTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="builder" className="gap-1">
                    <Wrench className="h-3 w-3" />
                    Builder
                  </TabsTrigger>
                  <TabsTrigger value="json" className="gap-1">
                    <Code className="h-3 w-3" />
                    JSON
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-1">
                    <LayoutTemplate className="h-3 w-3" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="builder" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Tambahkan field form dengan mudah. Drag untuk reorder, klik untuk edit.
                  </p>
                  <FormBuilder
                    schema={formSchema}
                    onChange={(schema) => setFormSchema(schema)}
                  />
                </TabsContent>

                <TabsContent value="json" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Edit JSON schema secara manual. Gunakan dengan hati-hati.
                    </p>
                    <Button variant="ghost" size="sm" onClick={copySchemaToClipboard}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={JSON.stringify(formSchema, null, 2)}
                    onChange={(e) => {
                      try {
                        setFormSchema(JSON.parse(e.target.value))
                      } catch {}
                    }}
                    rows={12}
                    className="font-mono text-xs"
                    placeholder='{"fields": []}'
                  />
                </TabsContent>

                <TabsContent value="preview">
                  <p className="text-sm text-muted-foreground mb-4">
                    Preview form yang akan digunakan untuk surat ini.
                  </p>
                  {formSchema ? (
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <DynamicForm
                        formSchema={formSchema}
                        formData={{}}
                        onChange={() => {}}
                        disabled
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>Belum ada form schema</p>
                      <p className="text-sm">Pilih preset atau tambahkan field</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEdit(false); resetForm() }}>
              Batal
            </Button>
            <Button onClick={handleEdit} disabled={saving || !formName}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Form: {selectedJenis?.name}</DialogTitle>
            <DialogDescription>
              Lihat preview form yang akan digunakan untuk surat ini
            </DialogDescription>
          </DialogHeader>
          {selectedJenis?.formSchema ? (
            <DynamicForm
              formSchema={selectedJenis.formSchema}
              formData={{}}
              onChange={() => {}}
              disabled
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Menggunakan form default</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
