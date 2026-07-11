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

  const limit = 10

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
        <Button asChild>
          <Link href="/dashboard/anggota/baru">
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Anggota
          </Link>
        </Button>
      </div>

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
                            <p className="text-xs text-muted-foreground">
                              {user.nickname && `@${user.nickname}`}
                            </p>
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
    </div>
  )
}
