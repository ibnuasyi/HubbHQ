'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
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

const formSchema = z.object({
  name: z.string().min(1, 'Nama diperlukan'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  nickname: z.string().optional(),
  fullName: z.string().optional(),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  wilayahId: z.string().optional(),
  divisiIds: z.array(z.string()).optional(),
})

type FormData = z.infer<typeof formSchema>

interface Role {
  id: string
  name: string
  displayName: string
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

export default function TambahAnggotaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [roles, setRoles] = React.useState<Role[]>([])
  const [wilayah, setWilayah] = React.useState<Wilayah[]>([])
  const [divisi, setDivisi] = React.useState<Divisi[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      divisiIds: [],
    },
  })

  const selectedDivisiIds = watch('divisiIds') || []

  // Fetch roles, wilayah, divisi
  React.useEffect(() => {
    const fetchData = async () => {
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
        console.error('Error fetching data:', err)
      }
    }
    fetchData()
  }, [])

  const handleDivisiChange = (divisiId: string, checked: boolean) => {
    const current = watch('divisiIds') || []
    if (checked) {
      setValue('divisiIds', [...current, divisiId])
    } else {
      setValue('divisiIds', current.filter((id) => id !== divisiId))
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/anggota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Terjadi kesalahan')
        return
      }

      router.push('/dashboard/anggota')
      router.refresh()
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
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
        <h1 className="text-2xl font-bold">Tambah Anggota Baru</h1>
        <p className="text-muted-foreground">
          Tambahkan anggota baru ke dalam organisasi
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
            <CardDescription>
              Data login untuk anggota baru
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
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleId">Role</Label>
                <Select
                  onValueChange={(value) => setValue('roleId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.displayName}
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
            <CardTitle>Informasi Pribadi</CardTitle>
            <CardDescription>
              Data pribadi anggota (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">Nama Panggilan</Label>
                <Input
                  id="nickname"
                  placeholder="Nama panggilan"
                  {...register('nickname')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap (Formal)</Label>
                <Input
                  id="fullName"
                  placeholder="Nama lengkap sesuai dokumen"
                  {...register('fullName')}
                />
              </div>
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
              {divisi.map((d) => (
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
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
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
                Simpan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
