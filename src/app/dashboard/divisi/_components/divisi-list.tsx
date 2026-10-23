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
import {
  MoreVertical,
  Plus,
  Users,
  Edit,
  Trash2,
  Receipt,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  CheckCircle,
  Lightbulb,
  Loader2,
} from 'lucide-react'
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

  // Kumpulan LPJ per Divisi Modal State
  const [showLpjModal, setShowLpjModal] = React.useState(false)
  const [divisiLpjData, setDivisiLpjData] = React.useState<any | null>(null)
  const [fetchingLpj, setFetchingLpj] = React.useState(false)

  const formatCurrency = (amount: number | string | null | undefined) => {
    const num = Number(amount || 0)
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num)
  }

  const handleOpenDivisiLpj = async (divisiId: string) => {
    try {
      setFetchingLpj(true)
      setShowLpjModal(true)
      const res = await fetch(`/api/divisi/${divisiId}/lpj`)
      if (res.ok) {
        const json = await res.json()
        setDivisiLpjData(json.data)
      }
    } catch (err) {
      console.error('Error fetching divisi LPJ data:', err)
    } finally {
      setFetchingLpj(false)
    }
  }

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
                      <DropdownMenuItem onClick={() => handleOpenDivisiLpj(d.id)}>
                        <Receipt className="mr-2 h-4 w-4 text-primary" />
                        Kumpulan LPJ & Evaluasi
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
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedDivisi(d)
                      fetchMembers()
                      setIsAddMemberOpen(true)
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Tambah Anggota
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-primary hover:text-primary/80"
                    onClick={() => handleOpenDivisiLpj(d.id)}
                  >
                    <Receipt className="mr-1 h-3.5 w-3.5" />
                    Kumpulan LPJ
                  </Button>
                  <Button variant="outline" size="sm" asChild className="text-xs">
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

      {/* DIALOG: Kumpulan LPJ & Bank Evaluasi Divisi */}
      <Dialog open={showLpjModal} onOpenChange={setShowLpjModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: divisiLpjData?.divisi?.color || '#3b82f6' }}
              />
              <DialogTitle className="text-lg">
                Kumpulan LPJ & Evaluasi: {divisiLpjData?.divisi?.name || 'Divisi'}
              </DialogTitle>
            </div>
            <DialogDescription>
              Arsip pertanggungjawaban kegiatan, perputaran anggaran, dan bank rekomendasi mitigasi kendala divisi
            </DialogDescription>
          </DialogHeader>

          {fetchingLpj ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Memuat data LPJ divisi...</span>
            </div>
          ) : !divisiLpjData || divisiLpjData.prokerList?.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground text-sm">
              Belum ada program kerja dengan data LPJ di divisi ini.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Financial Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border bg-muted/30 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Total Proker LPJ:</span>
                  <p className="font-bold text-foreground text-sm mt-0.5">
                    {divisiLpjData.stats.totalProkerLpj} Kegiatan ({divisiLpjData.stats.totalLpjSelesai} Disahkan)
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Akumulasi Pemasukan:</span>
                  <p className="font-bold text-green-700 dark:text-emerald-400 text-sm mt-0.5">
                    {formatCurrency(divisiLpjData.stats.totalPemasukanDivisi)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Akumulasi Pengeluaran:</span>
                  <p className="font-bold text-red-700 dark:text-rose-400 text-sm mt-0.5">
                    {formatCurrency(divisiLpjData.stats.totalPengeluaranDivisi)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Sisa Kas (Surplus):</span>
                  <p className="font-bold text-blue-700 dark:text-blue-400 text-sm mt-0.5">
                    {formatCurrency(divisiLpjData.stats.totalSisaSurplusDivisi)}
                  </p>
                </div>
              </div>

              {/* Tabs for LPJ List vs Evaluation Bank */}
              <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid grid-cols-2 w-full max-w-sm">
                  <TabsTrigger value="list" className="text-xs">
                    <Receipt className="mr-1.5 h-3.5 w-3.5" />
                    Daftar Dokumen LPJ
                  </TabsTrigger>
                  <TabsTrigger value="bank" className="text-xs">
                    <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
                    Bank Evaluasi Divisi
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="pt-3">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="py-2.5 px-3 text-left font-semibold">Nama Program Kerja</th>
                          <th className="py-2.5 px-3 text-left font-semibold">PIC</th>
                          <th className="py-2.5 px-3 text-left font-semibold">Status LPJ</th>
                          <th className="py-2.5 px-3 text-right font-semibold">Realisasi Belanja</th>
                          <th className="py-2.5 px-3 text-right font-semibold">Sisa Kas</th>
                          <th className="py-2.5 px-3 text-center font-semibold">Dokumen Final</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {divisiLpjData.prokerList.map((p: any) => (
                          <tr key={p.id} className="hover:bg-muted/20">
                            <td className="py-2.5 px-3 font-medium">
                              <a
                                href={`/dashboard/proker/${p.id}`}
                                className="text-primary hover:underline"
                              >
                                {p.title}
                              </a>
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground">
                              {p.pic?.name || '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  p.lpj?.status === 'APPROVED'
                                    ? 'bg-green-50 text-green-700 border-green-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                    : p.lpj?.status === 'SUBMITTED'
                                    ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {p.lpj?.status}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium">
                              {formatCurrency(p.lpj?.totalPengeluaran)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium">
                              {formatCurrency(p.lpj?.saldoAkhir)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {p.lpj?.dokumenFinalLpj ? (
                                <Button size="sm" variant="outline" asChild className="h-6 text-[11px] px-2">
                                  <a href={p.lpj.dokumenFinalLpj} target="_blank" rel="noreferrer">
                                    <ExternalLink className="mr-1 h-3 w-3 text-purple-600" />
                                    Berkas LPJ
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">Belum ada</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="bank" className="pt-3 space-y-3">
                  {divisiLpjData.bankEvaluasi.length === 0 ? (
                    <div className="p-4 border rounded-lg text-center text-muted-foreground text-xs">
                      Belum ada catatan kendala dan rekomendasi yang diarsipkan pada LPJ divisi ini.
                    </div>
                  ) : (
                    divisiLpjData.bankEvaluasi.map((item: any, i: number) => (
                      <div key={i} className="p-3.5 border rounded-lg bg-card space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <span className="font-bold text-foreground">{item.prokerTitle}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.reviewedAt ? new Date(item.reviewedAt).toLocaleDateString('id-ID') : 'Arsip LPJ'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                          <div className="p-2 rounded bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                            <span className="font-semibold text-red-800 dark:text-red-300 block mb-0.5">Kendala yang Dihadapi:</span>
                            <p className="text-muted-foreground text-[11px] leading-relaxed whitespace-pre-wrap">{item.kendala}</p>
                          </div>
                          <div className="p-2 rounded bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
                            <span className="font-semibold text-blue-800 dark:text-blue-300 block mb-0.5">Solusi yang Diterapkan:</span>
                            <p className="text-muted-foreground text-[11px] leading-relaxed whitespace-pre-wrap">{item.solusi}</p>
                          </div>
                          <div className="p-2 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                            <span className="font-semibold text-emerald-800 dark:text-emerald-300 block mb-0.5">Rekomendasi Periode Berikutnya:</span>
                            <p className="text-muted-foreground text-[11px] leading-relaxed whitespace-pre-wrap">{item.rekomendasi}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLpjModal(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
