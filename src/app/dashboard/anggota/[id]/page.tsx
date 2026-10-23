'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Trash2, Camera } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const formSchema = z.object({
  name: z.string().min(1, 'Nama diperlukan'),
  email: z.string().email('Email tidak valid'),
  nickname: z.string().optional(),
  fullName: z.string().optional(),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  wilayahId: z.string().optional(),
  divisiIds: z.array(z.string()).optional(),
  avatar: z.string().optional().nullable(),
})

type FormData = z.infer<typeof formSchema>

interface Role {
  id: string
  name: string
  displayName: string
  color: string
}

interface Wilayah {
  id: string
  name: string
}

interface Divisi {
  id: string
  name: string
  color: string
}

interface UserData {
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
}

export default function EditAnggotaPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [roles, setRoles] = React.useState<Role[]>([])
  const [wilayah, setWilayah] = React.useState<Wilayah[]>([])
  const [divisi, setDivisi] = React.useState<Divisi[]>([])
  const [userData, setUserData] = React.useState<UserData | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      divisiIds: [],
      avatar: null,
    },
  })

  const selectedDivisiIds = watch('divisiIds') || []

  // Fetch roles, wilayah, divisi
  React.useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [rolesRes, wilayahRes, divisiRes] = await Promise.all([
          fetch('/api/roles'),
          fetch('/api/wilayah'),
          fetch('/api/divisi'),
        ])

        if (rolesRes.ok) {
          const data = await rolesRes.json()
          setRoles(data.data || [])
        }
        if (wilayahRes.ok) {
          const data = await wilayahRes.json()
          setWilayah(data.data || [])
        }
        if (divisiRes.ok) {
          const data = await divisiRes.json()
          setDivisi(data.data || [])
        }
      } catch (err) {
        console.error('Error fetching dropdown data:', err)
      }
    }
    fetchDropdownData()
  }, [])

  // Fetch user data
  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/anggota/${userId}`)

        if (!res.ok) {
          if (res.status === 404) {
            setError('Anggota tidak ditemukan')
          } else {
            setError('Gagal memuat data anggota')
          }
          setIsFetching(false)
          return
        }

        const data = await res.json()

        if (data.data) {
          const user = data.data
          setUserData(user)

          // Set form values
          reset({
            name: user.name || '',
            email: user.email,
            nickname: user.nickname || '',
            fullName: user.fullName || '',
            birthPlace: user.birthPlace || '',
            birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
            address: user.address || '',
            phone: user.phone || '',
            roleId: user.role?.id || '',
            wilayahId: user.wilayah?.id || '',
            divisiIds: user.divisiMembers.map((dm: any) => dm.divisi.id),
            avatar: user.avatar,
          })

          if (user.avatar) {
            setAvatarPreview(user.avatar)
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        setError('Gagal memuat data anggota')
      } finally {
        setIsFetching(false)
      }
    }

    if (userId) {
      fetchUser()
    }
  }, [userId, reset])

  const handleDivisiChange = (divisiId: string, checked: boolean) => {
    const current = watch('divisiIds') || []
    if (checked) {
      setValue('divisiIds', [...current, divisiId])
    } else {
      setValue('divisiIds', current.filter((id) => id !== divisiId))
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setValue('avatar', data.url)
      }
    } catch (err) {
      console.error('Error uploading avatar:', err)
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Clean up empty strings
      const cleanData = {
        ...data,
        nickname: data.nickname || null,
        fullName: data.fullName || null,
        birthPlace: data.birthPlace || null,
        birthDate: data.birthDate || null,
        address: data.address || null,
        phone: data.phone || null,
        roleId: data.roleId || null,
        wilayahId: data.wilayahId || null,
      }

      const res = await fetch(`/api/anggota/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Terjadi kesalahan')
        return
      }

      // Update divisi membership if changed
      if (data.divisiIds) {
        const currentDivisiIds = userData?.divisiMembers.map((dm) => dm.divisi.id) || []
        const newDivisiIds = data.divisiIds

        // Remove from divisi that were unchecked
        const toRemove = currentDivisiIds.filter((id) => !newDivisiIds.includes(id))
        for (const divisiId of toRemove) {
          await fetch(`/api/divisi/${divisiId}/members/${userId}`, {
            method: 'DELETE',
          })
        }

        // Add to new divisi
        const toAdd = newDivisiIds.filter((id) => !currentDivisiIds.includes(id))
        for (const divisiId of toAdd) {
          await fetch(`/api/divisi/${divisiId}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          })
        }
      }

      router.push('/dashboard/anggota')
      router.refresh()
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus anggota ini? Tindakan ini tidak dapat dibatalkan.')) {
      return
    }

    try {
      const res = await fetch(`/api/anggota/${userId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/dashboard/anggota')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal menghapus anggota')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  if (isFetching) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error && !userData) {
    return (
      <div className="p-6">
        <Button variant="ghost" asChild className="mb-4 pl-0">
          <Link href="/dashboard/anggota">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 pl-0">
          <Link href="/dashboard/anggota">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Anggota</h1>
        <p className="text-muted-foreground">
          Edit data anggota {userData?.name || ''}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle>Foto Profil</CardTitle>
            <CardDescription>Unggah foto profil anggota</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback
                    style={{ backgroundColor: userData?.role?.color || '#6366f1' }}
                    className="text-white text-2xl"
                  >
                    {userData?.name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-2 -right-2 h-8 w-8 cursor-pointer rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Klik ikon kamera untuk mengunggah foto</p>
                <p>Format: JPG, PNG (maks 2MB)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
            <CardDescription>
              Data login anggota
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap *</Label>
                <Input
                  id="name"
                  placeholder="Masukkan nama lengkap"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roleId">Role</Label>
                <Select
                  value={watch('roleId') || ''}
                  onValueChange={(value) => setValue('roleId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          {role.displayName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">Nama Panggilan</Label>
                <Input
                  id="nickname"
                  placeholder="Nama panggilan"
                  {...register('nickname')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
            <CardDescription>
              Data pribadi anggota (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap (Formal)</Label>
              <Input
                id="fullName"
                placeholder="Nama lengkap sesuai dokumen resmi"
                {...register('fullName')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthPlace">Tempat Lahir</Label>
                <Input
                  id="birthPlace"
                  placeholder="Kota kelahiran"
                  {...register('birthPlace')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Tanggal Lahir</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register('birthDate')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                placeholder="Alamat lengkap"
                {...register('address')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  placeholder="08xxxxxxxxxx"
                  {...register('phone')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wilayahId">Wilayah</Label>
                <Select
                  value={watch('wilayahId') || ''}
                  onValueChange={(value) => setValue('wilayahId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih wilayah" />
                  </SelectTrigger>
                  <SelectContent>
                    {wilayah.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Divisi</CardTitle>
            <CardDescription>
              Pilih divisi anggota (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {divisi.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-2">
                  Belum ada divisi. Buat divisi terlebih dahulu di menu Divisi.
                </p>
              ) : (
                divisi.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center space-x-2 rounded-lg border p-3"
                  >
                    <Checkbox
                      id={`divisi-${d.id}`}
                      checked={selectedDivisiIds.includes(d.id)}
                      onCheckedChange={(checked) =>
                        handleDivisiChange(d.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`divisi-${d.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full mr-2"
                        style={{ backgroundColor: d.color }}
                      />
                      {d.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus Anggota
          </Button>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
