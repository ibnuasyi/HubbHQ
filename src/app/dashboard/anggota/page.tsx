'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  UserPlus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Loader2,
  CreditCard,
  Settings2,
  Sparkles,
} from 'lucide-react'
import { KtaCard } from '@/components/kta/kta-card'
import { KtaConfigModal } from '@/components/kta/kta-config-modal'
import { KtaConfig, DEFAULT_KTA_CONFIG } from '@/lib/kta-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface User {
  id: string
  name: string | null
  email: string
  nickname: string | null
  fullName: string | null
  birthPlace: string | null
  birthDate: string | null
  address: string | null
  phone: string | null
  avatar: string | null
  nra: string | null
  bloodType: string | null
  ktaIssuedAt: string | null
  ktaValidUntil: string | null
  role: { id: string; name: string; displayName: string; color: string } | null
  wilayah: { id: string; name: string } | null
  divisiMembers: { divisi: { id: string; name: string; color: string } }[]
  createdAt: string
}

export default function AnggotaPage() {
  const router = useRouter()
  const [anggota, setAnggota] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [showDetail, setShowDetail] = React.useState(false)

  // KTA States
  const [ktaConfig, setKtaConfig] = React.useState<KtaConfig>(DEFAULT_KTA_CONFIG)
  const [showKtaConfigModal, setShowKtaConfigModal] = React.useState(false)
  const [selectedKtaUser, setSelectedKtaUser] = React.useState<User | null>(null)
  const [showKtaPreviewModal, setShowKtaPreviewModal] = React.useState(false)
  const [bulkGenerating, setBulkGenerating] = React.useState(false)
  const [bulkSuccessMsg, setBulkSuccessMsg] = React.useState<string | null>(null)

  const limit = 10

  // Fetch KTA Config
  React.useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/kta/config')
        if (res.ok) {
          const json = await res.json()
          if (json.data) setKtaConfig(json.data)
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadConfig()
  }, [])

  // Bulk Generate NRA Handler
  const handleBulkGenerateNra = async () => {
    if (!confirm('Terbitkan Nomor Registrasi Anggota (NRA) otomatis untuk seluruh anggota yang belum memiliki NRA?')) {
      return
    }
    try {
      setBulkGenerating(true)
      setBulkSuccessMsg(null)
      const res = await fetch('/api/kta/generate-bulk', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setBulkSuccessMsg(json.message)
        fetchAnggota()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setBulkGenerating(false)
    }
  }

  const fetchAnggota = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        isActive: 'true',
      })
      if (search) params.append('search', search)

      const res = await fetch(`/api/anggota?${params}`)
      const data = await res.json()

      if (data.data) {
        setAnggota(data.data)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching anggota:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  React.useEffect(() => {
    fetchAnggota()
  }, [fetchAnggota])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchAnggota()
  }

  const viewDetail = (user: User) => {
    setSelectedUser(user)
    setShowDetail(true)
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Anggota</h1>
          <p className="text-muted-foreground">
            Kelola data anggota organisasi ({total} anggota)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKtaConfigModal(true)}
            className="text-xs"
          >
            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
            Desain KTA
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={bulkGenerating}
            onClick={handleBulkGenerateNra}
            className="text-xs"
          >
            {bulkGenerating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
            )}
            Generate NRA Massal
          </Button>

          <Button asChild size="sm" className="text-xs">
            <Link href="/dashboard/anggota/baru">
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Tambah Anggota
            </Link>
          </Button>
        </div>
      </div>

      {bulkSuccessMsg && (
        <div className="mb-4 p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
          <span>{bulkSuccessMsg}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px]"
            onClick={() => setBulkSuccessMsg(null)}
          >
            Tutup
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Anggota</CardTitle>
              <CardDescription>
                Lihat dan kelola semua anggota organisasi
              </CardDescription>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari anggota..."
                  className="pl-9 w-[250px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">
                Cari
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : anggota.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Belum ada anggota</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/dashboard/anggota/baru">Tambah anggota pertama</Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anggota</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Divisi</TableHead>
                    <TableHead className="w-[70px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anggota.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback
                              style={{ backgroundColor: user.role?.color || '#6366f1' }}
                              className="text-white"
                            >
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name || '-'}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {user.nra ? (
                                <span className="font-mono text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                  {user.nra}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  Belum ada NRA
                                </span>
                              )}
                              {user.nickname && (
                                <span className="text-xs text-muted-foreground">
                                  @{user.nickname}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${user.role?.color}20`,
                            color: user.role?.color,
                          }}
                        >
                          {user.role?.displayName || 'Anggota'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.divisiMembers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.divisiMembers.map((dm) => (
                              <Badge
                                key={dm.divisi.id}
                                variant="outline"
                                style={{ borderColor: dm.divisi.color }}
                              >
                                {dm.divisi.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Tidak ada
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => viewDetail(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedKtaUser(user)
                                setShowKtaPreviewModal(true)
                              }}
                            >
                              <CreditCard className="mr-2 h-4 w-4 text-primary" />
                              Lihat KTA Digital
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/anggota/${user.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {(page - 1) * limit + 1}-
                    {Math.min(page * limit, total)} dari {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Anggota</DialogTitle>
            <DialogDescription>Informasi lengkap anggota</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar || undefined} />
                  <AvatarFallback
                    style={{ backgroundColor: selectedUser.role?.color || '#6366f1' }}
                    className="text-white text-lg"
                  >
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedUser.name || '-'}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedUser.email}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-1"
                    style={{
                      backgroundColor: `${selectedUser.role?.color}20`,
                      color: selectedUser.role?.color,
                    }}
                  >
                    {selectedUser.role?.displayName || 'Anggota'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <Label className="text-muted-foreground">Nama Lengkap</Label>
                  <p>{selectedUser.fullName || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nama Panggilan</Label>
                  <p>{selectedUser.nickname || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tempat, Tanggal Lahir</Label>
                  <p>
                    {selectedUser.birthPlace || '-'}
                    {selectedUser.birthDate && `, ${new Date(selectedUser.birthDate).toLocaleDateString('id-ID')}`}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Telepon</Label>
                  <p>{selectedUser.phone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Alamat</Label>
                  <p>{selectedUser.address || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Wilayah</Label>
                  <p>{selectedUser.wilayah?.name || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Divisi</Label>
                  <p>
                    {selectedUser.divisiMembers.length > 0
                      ? selectedUser.divisiMembers.map((dm) => dm.divisi.name).join(', ')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 1: Konfigurasi Desain KTA Organisasi */}
      <KtaConfigModal
        open={showKtaConfigModal}
        onOpenChange={setShowKtaConfigModal}
        initialConfig={ktaConfig}
        onConfigSaved={(newConfig) => setKtaConfig(newConfig)}
      />

      {/* MODAL 2: Pratinjau & Cetak KTA Anggota */}
      <Dialog open={showKtaPreviewModal} onOpenChange={setShowKtaPreviewModal}>
        <DialogContent className="max-w-xl flex flex-col items-center p-6">
          <DialogHeader className="w-full text-center">
            <DialogTitle className="text-lg font-bold flex items-center justify-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              KTA Digital: {selectedKtaUser?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pratinjau Kartu Tanda Anggota resmi standar CR80 dengan verifikasi QR Code
            </DialogDescription>
          </DialogHeader>

          {selectedKtaUser && (
            <div className="py-2">
              <KtaCard
                member={{
                  id: selectedKtaUser.id,
                  name: selectedKtaUser.name,
                  fullName: selectedKtaUser.fullName || selectedKtaUser.name,
                  avatar: selectedKtaUser.avatar,
                  nra: selectedKtaUser.nra,
                  bloodType: selectedKtaUser.bloodType,
                  role: selectedKtaUser.role,
                  divisi: selectedKtaUser.divisiMembers?.[0]?.divisi,
                  wilayah: selectedKtaUser.wilayah,
                  ktaIssuedAt: selectedKtaUser.ktaIssuedAt,
                  ktaValidUntil: selectedKtaUser.ktaValidUntil,
                }}
                config={ktaConfig}
                showControls={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
