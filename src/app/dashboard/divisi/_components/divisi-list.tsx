'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { prisma } from '@/lib/db'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MoreVertical, Plus, Users, Edit, Trash2 } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface Divisi {
  id: string
  name: string
  shortName: string | null
  description: string | null
  color: string
  isActive: boolean
  members: {
    id: string
    userId: string
    position: string | null
    isActive: boolean
    user: {
      id: string
      name: string | null
      email: string
      avatar: string | null
    }
  }[]
  _count: {
    members: number
  }
}

export function DivisiList() {
  const router = useRouter()
  const [divisi, setDivisi] = React.useState<Divisi[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [selectedDivisi, setSelectedDivisi] = React.useState<Divisi | null>(null)
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false)
  const [members, setMembers] = React.useState<any[]>([])
  const [selectedMember, setSelectedMember] = React.useState('')
  const [memberPosition, setMemberPosition] = React.useState('')

  React.useEffect(() => {
    fetchDivisi()
  }, [])

  const fetchDivisi = async () => {
    try {
      const res = await fetch('/api/divisi')
      const data = await res.json()
      setDivisi(data.data || [])
    } catch (error) {
      console.error('Error fetching divisi:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/anggota?isActive=true')
      const data = await res.json()
      setMembers(data.data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const handleAddMember = async () => {
    if (!selectedDivisi || !selectedMember) return

    try {
      const res = await fetch(`/api/divisi/${selectedDivisi.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedMember,
          position: memberPosition || undefined,
        }),
      })

      if (res.ok) {
        setIsAddMemberOpen(false)
        setSelectedMember('')
        setMemberPosition('')
        fetchDivisi()
      }
    } catch (error) {
      console.error('Error adding member:', error)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedDivisi) return

    try {
      const res = await fetch(
        `/api/divisi/${selectedDivisi.id}/members/${memberId}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        fetchDivisi()
      }
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus divisi ini?')) return

    try {
      const res = await fetch(`/api/divisi/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchDivisi()
      }
    } catch (error) {
      console.error('Error deleting divisi:', error)
    }
  }

  const filteredDivisi = divisi.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.shortName?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center p-8">Memuat...</div>
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Cari divisi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Divisi Grid */}
      {filteredDivisi.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada divisi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDivisi.map((d) => (
            <Card key={d.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: d.color + '20' }}
                    >
                      <span
                        className="text-lg font-bold"
                        style={{ color: d.color }}
                      >
                        {d.shortName || d.name.substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{d.name}</CardTitle>
                      {d.shortName && (
                        <CardDescription>{d.shortName}</CardDescription>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={`/divisi/${d.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`/proker?divisi=${d.id}`}>
                          <Users className="mr-2 h-4 w-4" />
                          Program Kerja
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(d.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {d.description && (
                  <p className="mb-4 text-sm text-muted-foreground">
                    {d.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {d._count.members} anggota
                    </Badge>
                    <Badge variant={d.isActive ? 'success' : 'secondary'}>
                      {d.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </div>

                {/* Member Preview */}
                {d.members.length > 0 && (
                  <div className="mt-4 flex -space-x-2">
                    {d.members.slice(0, 5).map((m) => (
                      <Avatar
                        key={m.id}
                        className="h-8 w-8 border-2 border-background"
                        title={m.user.name || m.user.email}
                      >
                        <AvatarImage src={m.user.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(m.user.name || m.user.email)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {d.members.length > 5 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                        +{d.members.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedDivisi(d)
                      fetchMembers()
                      setIsAddMemberOpen(true)
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Tambah Anggota
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/divisi/${d.id}`}>Detail</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Anggota ke {selectedDivisi?.name}</DialogTitle>
            <DialogDescription>
              Pilih anggota yang akan ditambahkan ke divisi ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member">Anggota</Label>
              <select
                id="member"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
              >
                <option value="">Pilih anggota...</option>
                {members
                  .filter(
                    (m) =>
                      !selectedDivisi?.members.some((dm) => dm.userId === m.id)
                  )
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.email}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Posisi (opsional)</Label>
              <Input
                id="position"
                placeholder="Contoh: Ketua Divisi, Staff"
                value={memberPosition}
                onChange={(e) => setMemberPosition(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddMemberOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleAddMember} disabled={!selectedMember}>
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
