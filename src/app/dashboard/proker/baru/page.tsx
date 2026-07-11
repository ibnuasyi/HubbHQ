'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CheckpointInput {
  id: string
  title: string
  description: string
}

export default function TambahProkerPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [divisiList, setDivisiList] = React.useState<any[]>([])
  const [members, setMembers] = React.useState<any[]>([])

  // Form state
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [divisiId, setDivisiId] = React.useState('')
  const [picId, setPicId] = React.useState('')
  const [status, setStatus] = React.useState('DRAFT')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [checkpoints, setCheckpoints] = React.useState<CheckpointInput[]>([])

  // Fetch divisi and members
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [divisiRes, anggotaRes] = await Promise.all([
          fetch('/api/divisi'),
          fetch('/api/anggota'),
        ])

        if (divisiRes.ok) {
          const data = await divisiRes.json()
          setDivisiList(data.data || [])
        }
        if (anggotaRes.ok) {
          const data = await anggotaRes.json()
          setMembers(data.data || [])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }
    fetchData()
  }, [])

  const addCheckpoint = () => {
    setCheckpoints([
      ...checkpoints,
      { id: Date.now().toString(), title: '', description: '' },
    ])
  }

  const removeCheckpoint = (id: string) => {
    setCheckpoints(checkpoints.filter((cp) => cp.id !== id))
  }

  const updateCheckpoint = (id: string, field: 'title' | 'description', value: string) => {
    setCheckpoints(
      checkpoints.map((cp) =>
        cp.id === id ? { ...cp, [field]: value } : cp
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('Judul program kerja diperlukan')
      return
    }

    if (!divisiId) {
      setError('Divisi diperlukan')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/proker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          divisiId,
          picId: picId || null,
          status,
          startDate: startDate || null,
          endDate: endDate || null,
          checkpoints: checkpoints
            .filter((cp) => cp.title.trim())
            .map((cp) => ({
              title: cp.title.trim(),
              description: cp.description.trim() || null,
            })),
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Terjadi kesalahan')
        return
      }

      router.push('/dashboard/proker')
      router.refresh()
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 pl-0">
          <Link href="/dashboard/proker">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Buat Program Kerja Baru</h1>
        <p className="text-muted-foreground">
          Tambahkan program kerja baru untuk organisasi
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Program Kerja</CardTitle>
            <CardDescription>
              Judul, deskripsi, dan detail dasar program kerja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Program Kerja *</Label>
              <Input
                id="title"
                placeholder="Contoh: Pembuatan Website Organisasi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Jelaskan detail program kerja..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="divisi">Divisi *</Label>
                <Select value={divisiId} onValueChange={setDivisiId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih divisi" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisiList.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          {d.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pic">PIC (Penanggung Jawab)</Label>
                <Select value={picId} onValueChange={setPicId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih PIC" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ON_PROGRESS">On Progress</SelectItem>
                    <SelectItem value="COMPLETED">Selesai</SelectItem>
                    <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Tanggal Mulai</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Tanggal Selesai</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checkpoints */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Checkpoint</CardTitle>
                <CardDescription>
                  Tambahkan checklist untuk melacak progress
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCheckpoint}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Checkpoint
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {checkpoints.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Belum ada checkpoint. Klik tombol di atas untuk menambahkan.
              </p>
            ) : (
              <div className="space-y-3">
                {checkpoints.map((cp, index) => (
                  <div
                    key={cp.id}
                    className="flex gap-2 items-start p-3 border rounded-lg"
                  >
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder={`Checkpoint ${index + 1}`}
                        value={cp.title}
                        onChange={(e) => updateCheckpoint(cp.id, 'title', e.target.value)}
                      />
                      <Input
                        placeholder="Deskripsi (opsional)"
                        value={cp.description}
                        onChange={(e) =>
                          updateCheckpoint(cp.id, 'description', e.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeCheckpoint(cp.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/proker">Batal</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Program Kerja
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
