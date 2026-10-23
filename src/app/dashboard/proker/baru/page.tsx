'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, Loader2, AlertCircle, Users, Target, DollarSign, Calendar, MapPin } from 'lucide-react'
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

interface PanitiaInput {
  id: string
  userId: string
  roleJabatan: string
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
  const [kategori, setKategori] = React.useState('INSIDENTAL')
  const [sasaran, setSasaran] = React.useState('')
  const [indikator, setIndikator] = React.useState('')
  const [anggaranEstimasi, setAnggaranEstimasi] = React.useState('')
  const [sumberDana, setSumberDana] = React.useState('Kas Organisasi & Sponsor')
  const [lokasi, setLokasi] = React.useState('')

  const [checkpoints, setCheckpoints] = React.useState<CheckpointInput[]>([])
  const [panitia, setPanitia] = React.useState<PanitiaInput[]>([])

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

  const addPanitia = () => {
    setPanitia([
      ...panitia,
      { id: Date.now().toString(), userId: '', roleJabatan: '' },
    ])
  }

  const removePanitia = (id: string) => {
    setPanitia(panitia.filter((p) => p.id !== id))
  }

  const updatePanitia = (id: string, field: 'userId' | 'roleJabatan', value: string) => {
    setPanitia(
      panitia.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
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
      setError('Divisi penanggung jawab diperlukan')
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
          kategori,
          sasaran: sasaran.trim() || null,
          indikator: indikator.trim() || null,
          anggaranEstimasi: anggaranEstimasi ? parseFloat(anggaranEstimasi) : null,
          sumberDana: sumberDana.trim() || null,
          lokasi: lokasi.trim() || null,
          checkpoints: checkpoints
            .filter((cp) => cp.title.trim())
            .map((cp) => ({
              title: cp.title.trim(),
              description: cp.description.trim() || null,
            })),
          panitia: panitia
            .filter((p) => p.userId && p.roleJabatan.trim())
            .map((p) => ({
              userId: p.userId,
              roleJabatan: p.roleJabatan.trim(),
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4 pl-0">
          <Link href="/dashboard/proker">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Proker
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Rancangan Program Kerja Baru</h1>
        <p className="text-muted-foreground text-sm">
          Formulir Matriks Program Kerja standar organisasi untuk perencanaan Raker / Musker
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 1. Basic Info & Divisi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              1. Identitas Program Kerja
            </CardTitle>
            <CardDescription>
              Judul, deskripsi latar belakang, dan divisi penanggung jawab
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nama / Judul Program Kerja *</Label>
              <Input
                id="title"
                placeholder="Contoh: Latihan Kepemimpinan Organisasi & Manajemen (LKOM)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Latar Belakang & Deskripsi Kegiatan</Label>
              <Textarea
                id="description"
                placeholder="Jelaskan urgensi, tujuan umum, dan latar belakang kegiatan ini..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="divisi">Divisi Pengampu *</Label>
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
                <Label htmlFor="kategori">Sifat / Kategori Proker</Label>
                <Select value={kategori} onValueChange={setKategori}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSIDENTAL">Insidental / Event / Proyek</SelectItem>
                    <SelectItem value="RUTIN">Rutin / Berkala</SelectItem>
                    <SelectItem value="PRIORITAS">Prioritas / Unggulan</SelectItem>
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
                <p className="text-xs text-muted-foreground">PIC wajib ditentukan sebelum proposal dana diajukan.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Matriks Raker: Sasaran, KPI, Anggaran & Waktu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              2. Matriks Target, Anggaran & Jadwal (Standar Raker)
            </CardTitle>
            <CardDescription>
              Tolok ukur keberhasilan, estimasi RAB, dan jadwal pelaksanaan kegiatan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sasaran">Target Sasaran Audiens / Peserta</Label>
                <Input
                  id="sasaran"
                  placeholder="Contoh: 150 Mahasiswa baru & 30 Panitia"
                  value={sasaran}
                  onChange={(e) => setSasaran(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="indikator">Tolok Ukur Keberhasilan (KPI)</Label>
                <Input
                  id="indikator"
                  placeholder="Contoh: Kehadiran minimal 85% & indeks kepuasan 4.0/5"
                  value={indikator}
                  onChange={(e) => setIndikator(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="anggaranEstimasi">Estimasi Anggaran (RAB Rp)</Label>
                <Input
                  id="anggaranEstimasi"
                  type="number"
                  placeholder="Contoh: 7500000"
                  value={anggaranEstimasi}
                  onChange={(e) => setAnggaranEstimasi(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sumberDana">Rencana Sumber Dana</Label>
                <Input
                  id="sumberDana"
                  placeholder="Contoh: Kas Organisasi, Sponsor, Pendaftaran"
                  value={sumberDana}
                  onChange={(e) => setSumberDana(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lokasi">Lokasi Pelaksanaan</Label>
                <Input
                  id="lokasi"
                  placeholder="Contoh: Aula Utama Gedung Pusat"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Tanggal Mulai Pelaksanaan</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Tanggal Selesai Pelaksanaan</Label>
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

        {/* 3. Kepanitiaan (OC / SC) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                3. Susunan Panitia Pelaksana (OC)
              </CardTitle>
              <CardDescription>
                Tugaskan anggota ke dalam kepanitiaan teknis kegiatan
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPanitia}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Tambah Panitia
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {panitia.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center border border-dashed rounded-md">
                Belum ada panitia ditambahkan. Anda juga dapat menambahkan panitia setelah proker dibuat.
              </p>
            ) : (
              panitia.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border">
                  <span className="text-xs font-semibold text-muted-foreground w-6">#{idx + 1}</span>
                  <div className="flex-1">
                    <Select
                      value={p.userId}
                      onValueChange={(val) => updatePanitia(p.id, 'userId', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Anggota" />
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
                  <div className="flex-1">
                    <Input
                      placeholder="Contoh: Ketua Pelaksana, Sekretaris, Bendahara, Acara"
                      value={p.roleJabatan}
                      onChange={(e) => updatePanitia(p.id, 'roleJabatan', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => removePanitia(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 4. Checkpoints / Milestones */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">4. Tahapan & Checkpoint Kegiatan</CardTitle>
              <CardDescription>
                Daftar target tahapan persiapan menuju hari pelaksanaan
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCheckpoint}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Tambah Checkpoint
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {checkpoints.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                Belum ada checkpoint ditambahkan
              </p>
            ) : (
              checkpoints.map((cp, index) => (
                <div
                  key={cp.id}
                  className="p-4 border rounded-lg space-y-3 bg-muted/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">
                      Tahapan #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-8 px-2"
                      onClick={() => removeCheckpoint(cp.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Judul checkpoint (Contoh: Rapat Perdana Pembentukan Panitia)"
                      value={cp.title}
                      onChange={(e) =>
                        updateCheckpoint(cp.id, 'title', e.target.value)
                      }
                    />
                    <Textarea
                      placeholder="Keterangan tahapan (opsional)..."
                      rows={2}
                      value={cp.description}
                      onChange={(e) =>
                        updateCheckpoint(cp.id, 'description', e.target.value)
                      }
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/proker">Batal</Link>
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan Program Kerja
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
