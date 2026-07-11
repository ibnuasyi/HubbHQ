'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  Circle,
  Plus,
  Loader2,
  Calendar,
  User,
  AlertCircle,
  CheckSquare,
} from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Checkpoint {
  id: string
  title: string
  description: string | null
  isCompleted: boolean
  completedAt: string | null
  order: number
}

interface ProgramKerja {
  id: string
  title: string
  description: string | null
  status: 'DRAFT' | 'ON_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
  divisi: {
    id: string
    name: string
    color: string
  }
  pic: {
    id: string
    name: string | null
    avatar: string | null
  } | null
  creator: {
    id: string
    name: string | null
  }
  checkpoints: Checkpoint[]
  progress: number
  completedCheckpoints: number
  totalCheckpoints: number
}

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500' },
  ON_PROGRESS: { label: 'On Progress', color: 'bg-blue-500' },
  COMPLETED: { label: 'Selesai', color: 'bg-green-500' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-500' },
}

export default function ProkerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [proker, setProker] = React.useState<ProgramKerja | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showAddCheckpoint, setShowAddCheckpoint] = React.useState(false)
  const [newCheckpointTitle, setNewCheckpointTitle] = React.useState('')
  const [newCheckpointDesc, setNewCheckpointDesc] = React.useState('')
  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false)

  // Form state for editing
  const [isEditing, setIsEditing] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState('')
  const [editDescription, setEditDescription] = React.useState('')
  const [editStatus, setEditStatus] = React.useState('')
  const [editStartDate, setEditStartDate] = React.useState('')
  const [editEndDate, setEditEndDate] = React.useState('')
  const [editPicId, setEditPicId] = React.useState('')
  const [divisiList, setDivisiList] = React.useState<any[]>([])
  const [members, setMembers] = React.useState<any[]>([])

  const prokerId = params.id as string

  const fetchProker = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/proker/${prokerId}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mengambil data')
        return
      }

      setProker(data.data)
      setEditTitle(data.data.title)
      setEditDescription(data.data.description || '')
      setEditStatus(data.data.status)
      setEditStartDate(
        data.data.startDate ? new Date(data.data.startDate).toISOString().split('T')[0] : ''
      )
      setEditEndDate(
        data.data.endDate ? new Date(data.data.endDate).toISOString().split('T')[0] : ''
      )
      setEditPicId(data.data.pic?.id || '')
    } catch (error) {
      console.error('Error fetching proker:', error)
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [prokerId])

  const fetchMeta = async () => {
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
    } catch (error) {
      console.error('Error fetching meta:', error)
    }
  }

  React.useEffect(() => {
    fetchProker()
    fetchMeta()
  }, [fetchProker])

  const toggleCheckpoint = async (checkpointId: string) => {
    try {
      const res = await fetch(`/api/proker/${prokerId}/checkpoints`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkpointId,
          action: 'toggle',
        }),
      })

      if (res.ok) {
        fetchProker()
      }
    } catch (error) {
      console.error('Error toggling checkpoint:', error)
    }
  }

  const addCheckpoint = async () => {
    if (!newCheckpointTitle.trim()) return

    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}/checkpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCheckpointTitle,
          description: newCheckpointDesc,
        }),
      })

      if (res.ok) {
        setNewCheckpointTitle('')
        setNewCheckpointDesc('')
        setShowAddCheckpoint(false)
        fetchProker()
      }
    } catch (error) {
      console.error('Error adding checkpoint:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteCheckpoint = async (checkpointId: string) => {
    try {
      const res = await fetch(`/api/proker/${prokerId}/checkpoints`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkpointId,
          action: 'delete',
        }),
      })

      if (res.ok) {
        fetchProker()
      }
    } catch (error) {
      console.error('Error deleting checkpoint:', error)
    }
  }

  const saveChanges = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          status: editStatus,
          startDate: editStartDate || null,
          endDate: editEndDate || null,
          picId: editPicId || null,
        }),
      })

      if (res.ok) {
        setIsEditing(false)
        fetchProker()
      }
    } catch (error) {
      console.error('Error saving changes:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteProker = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/dashboard/proker')
      }
    } catch (error) {
      console.error('Error deleting proker:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !proker) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Program kerja tidak ditemukan'}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/dashboard/proker">Kembali ke list</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 pl-0">
          <Link href="/dashboard/proker">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{proker.title}</h1>
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${proker.divisi.color}20`,
                  color: proker.divisi.color,
                }}
              >
                {proker.divisi.name}
              </Badge>
              <Badge variant="outline">
                {statusConfig[proker.status].label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Dibuat oleh {proker.creator.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="mr-2 h-4 w-4" />
              {isEditing ? 'Batal' : 'Edit'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteAlert(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Progress</span>
                <span className="text-2xl font-bold">{proker.progress}%</span>
              </CardTitle>
              <CardDescription>
                {proker.completedCheckpoints} dari {proker.totalCheckpoints} checkpoint selesai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={proker.progress} className="h-3" />
            </CardContent>
          </Card>

          {/* Checkpoints Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Checkpoint
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowAddCheckpoint(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {proker.checkpoints.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Belum ada checkpoint. Tambahkan untuk melacak progress.
                </p>
              ) : (
                <div className="space-y-2">
                  {proker.checkpoints.map((cp, index) => (
                    <div
                      key={cp.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        cp.isCompleted ? 'bg-green-50 border-green-200' : 'bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={cp.isCompleted}
                        onCheckedChange={() => toggleCheckpoint(cp.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className={cp.isCompleted ? 'line-through text-muted-foreground' : ''}>
                          {cp.title}
                        </p>
                        {cp.description && (
                          <p className="text-sm text-muted-foreground">
                            {cp.description}
                          </p>
                        )}
                        {cp.completedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Selesai: {new Date(cp.completedAt).toLocaleDateString('id-ID')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteCheckpoint(cp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deskripsi */}
          {proker.description && !isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Deskripsi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {proker.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Detail Card */}
          <Card>
            <CardHeader>
              <CardTitle>Detail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Judul</Label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
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
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Tanggal Mulai</Label>
                      <Input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Selesai</Label>
                      <Input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>PIC</Label>
                    <Select value={editPicId} onValueChange={setEditPicId}>
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
                  <Button
                    className="w-full"
                    onClick={saveChanges}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Simpan Perubahan
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">PIC</p>
                    <div className="flex items-center gap-2 mt-1">
                      {proker.pic ? (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={proker.pic.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {proker.pic.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{proker.pic.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Belum ada</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {proker.startDate
                        ? new Date(proker.startDate).toLocaleDateString('id-ID')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Selesai</p>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {proker.endDate
                        ? new Date(proker.endDate).toLocaleDateString('id-ID')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dibuat</p>
                    <p className="mt-1">
                      {new Date(proker.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Checkpoint Dialog */}
      <Dialog open={showAddCheckpoint} onOpenChange={setShowAddCheckpoint}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Checkpoint</DialogTitle>
            <DialogDescription>
              Tambahkan checkpoint baru untuk melacak progress
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Checkpoint</Label>
              <Input
                placeholder="Contoh: Finalisasi desain"
                value={newCheckpointTitle}
                onChange={(e) => setNewCheckpointTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi (opsional)</Label>
              <Textarea
                placeholder="Deskripsi detail checkpoint"
                value={newCheckpointDesc}
                onChange={(e) => setNewCheckpointDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddCheckpoint(false)}
            >
              Batal
            </Button>
            <Button onClick={addCheckpoint} disabled={saving || !newCheckpointTitle.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Program Kerja</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus program kerja ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteAlert(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={deleteProker}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
