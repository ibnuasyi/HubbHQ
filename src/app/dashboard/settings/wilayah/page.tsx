'use client'

import * as React from 'react'
import {
  Plus,
  Loader2,
  MapPin,
  Edit,
  Trash2,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

interface CurrentUser {
  id: string
  name: string
  email: string
  role: { name: string }
}

interface Wilayah {
  id: string
  name: string
  shortName: string | null
  level: number
  isActive: boolean
  parentId: string | null
  parent?: { id: string; name: string } | null
}

export default function WilayahPage() {
  const [wilayah, setWilayah] = React.useState<Wilayah[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAdd, setShowAdd] = React.useState(false)
  const [showEdit, setShowEdit] = React.useState(false)
  const [selectedWilayah, setSelectedWilayah] = React.useState<Wilayah | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null)

  // Form state
  const [formName, setFormName] = React.useState('')
  const [formShortName, setFormShortName] = React.useState('')
  const [formLevel, setFormLevel] = React.useState('0')
  const [formParentId, setFormParentId] = React.useState('')
  const [formIsActive, setFormIsActive] = React.useState(true)

  const fetchWilayah = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/wilayah')
      const data = await res.json()
      if (data.data) {
        setWilayah(data.data)
      }
    } catch (error) {
      console.error('Error fetching wilayah:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchWilayah()
    // Fetch current user
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user as CurrentUser)
        }
      })
      .catch(console.error)
  }, [fetchWilayah])

  const isAdmin = currentUser?.role?.name === 'admin'

  const handleSubmit = async () => {
    if (!formName) return

    setSaving(true)
    try {
      const res = await fetch('/api/wilayah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          shortName: formShortName || null,
          level: parseInt(formLevel),
          parentId: formParentId || null,
        }),
      })

      if (res.ok) {
        setShowAdd(false)
        resetForm()
        fetchWilayah()
      }
    } catch (error) {
      console.error('Error creating wilayah:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedWilayah || !formName) return

    setSaving(true)
    try {
      const res = await fetch(`/api/wilayah/${selectedWilayah.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          shortName: formShortName || null,
          level: parseInt(formLevel),
          parentId: formParentId || null,
          isActive: formIsActive,
        }),
      })

      if (res.ok) {
        setShowEdit(false)
        resetForm()
        setSelectedWilayah(null)
        fetchWilayah()
      }
    } catch (error) {
      console.error('Error updating wilayah:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (w: Wilayah) => {
    if (!confirm(`Hapus wilayah "${w.name}"?`)) return

    try {
      const res = await fetch(`/api/wilayah/${w.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchWilayah()
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal menghapus wilayah')
      }
    } catch (error) {
      console.error('Error deleting wilayah:', error)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormShortName('')
    setFormLevel('0')
    setFormParentId('')
    setFormIsActive(true)
  }

  const openEdit = (w: Wilayah) => {
    setSelectedWilayah(w)
    setFormName(w.name)
    setFormShortName(w.shortName || '')
    setFormLevel(w.level.toString())
    setFormParentId(w.parentId || '')
    setFormIsActive(w.isActive)
    setShowEdit(true)
  }

  const getLevelName = (level: number) => {
    const names = ['Pusat', 'Korwil', 'Korcam', 'Korjen']
    return names[level] || `Level ${level}`
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wilayah</h1>
          <p className="text-muted-foreground">
            Kelola wilayah organisasi ({wilayah.length} wilayah)
          </p>
        </div>
        {isAdmin ? (
          <Button onClick={() => { resetForm(); setShowAdd(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Wilayah
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            Hanya administrator yang dapat mengubah
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {wilayah.map((w) => (
            <Card key={w.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{w.name}</CardTitle>
                      {w.shortName && (
                        <CardDescription>({w.shortName})</CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{getLevelName(w.level)}</Badge>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${w.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {w.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(w)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {w.name !== 'Pusat' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(w)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={(open) => {
        if (!isAdmin) return
        setShowAdd(open)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Wilayah</DialogTitle>
            <DialogDescription>Tambah wilayah baru</DialogDescription>
          </DialogHeader>
          {!isAdmin ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Hanya administrator yang dapat menambah wilayah
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama *</Label>
                <Input
                  placeholder="Contoh: Korwil Jawa Barat"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Singkat</Label>
                <Input
                  placeholder="Contoh: KWB"
                  value={formShortName}
                  onChange={(e) => setFormShortName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select value={formLevel} onValueChange={setFormLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Pusat</SelectItem>
                      <SelectItem value="1">Korwil</SelectItem>
                      <SelectItem value="2">Korcam</SelectItem>
                      <SelectItem value="3">Korjen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Induk</Label>
                  <Select value={formParentId} onValueChange={setFormParentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tidak ada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tidak ada</SelectItem>
                      {wilayah.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => setShowAdd(false)}>
                  Batal
                </Button>
                <Button onClick={handleSubmit} disabled={saving || !formName}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={(open) => {
        if (!isAdmin) return
        setShowEdit(open)
        if (!open) {
          resetForm()
          setSelectedWilayah(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wilayah</DialogTitle>
            <DialogDescription>Ubah data wilayah</DialogDescription>
          </DialogHeader>
          {!isAdmin ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Hanya administrator yang dapat mengedit wilayah
              </p>
            </div>
          ) : selectedWilayah ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama *</Label>
                <Input
                  placeholder="Contoh: Korwil Jawa Barat"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Singkat</Label>
                <Input
                  placeholder="Contoh: KWB"
                  value={formShortName}
                  onChange={(e) => setFormShortName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select value={formLevel} onValueChange={setFormLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Pusat</SelectItem>
                      <SelectItem value="1">Korwil</SelectItem>
                      <SelectItem value="2">Korcam</SelectItem>
                      <SelectItem value="3">Korjen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Induk</Label>
                  <Select value={formParentId} onValueChange={setFormParentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tidak ada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tidak ada</SelectItem>
                      {wilayah
                        .filter((w) => w.id !== selectedWilayah.id)
                        .map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isActive" className="font-normal">
                  Wilayah aktif
                </Label>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => { setShowEdit(false); resetForm(); setSelectedWilayah(null) }}>
                  Batal
                </Button>
                <Button onClick={handleEdit} disabled={saving || !formName}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
