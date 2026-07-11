'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getInitials, formatDate } from '@/lib/utils'

const profileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  nickname: z.string().optional(),
  fullName: z.string().optional(),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export function ProfileForm({ user }: { user: any }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [avatar, setAvatar] = React.useState(user?.avatar || '')
  const [signature, setSignature] = React.useState(user?.signature || '')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      nickname: user?.nickname || '',
      fullName: user?.fullName || '',
      birthPlace: user?.birthPlace || '',
      birthDate: user?.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
      address: user?.address || '',
      phone: user?.phone || '',
    },
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'avatar')

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setAvatar(data.data.url)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'signature')

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setSignature(data.data.url)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/anggota/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          avatar,
          signature,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Gagal update profil')
      }

      setSuccess('Profil berhasil diupdate')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Avatar & Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Foto Profil & Tanda Tangan</CardTitle>
          <CardDescription>
            Upload foto profil dan tanda tangan digital
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(user?.name || 'U')}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-2 -right-2 cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>

            {/* Signature */}
            <div className="flex-1">
              <Label>Tanda Tangan Digital</Label>
              <p className="mb-2 text-sm text-muted-foreground">
                Upload TTD (PNG/JPG) untuk keperluan surat
              </p>
              <div className="flex items-center gap-4">
                {signature && (
                  <div className="h-16 w-48 rounded border bg-white p-1">
                    <img
                      src={signature}
                      alt="Signature"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
                <label className="cursor-pointer">
                  <Button type="button" variant="outline" disabled={isUploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    {signature ? 'Ganti TTD' : 'Upload TTD'}
                  </Button>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleSignatureUpload}
                  />
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Dasar</CardTitle>
          <CardDescription>
            Data diri dan informasi kontak
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nama *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">Nama Panggilan</Label>
              <Input id="nickname" {...register('nickname')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input id="fullName" {...register('fullName')} />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="birthPlace">Tempat Lahir</Label>
              <Input id="birthPlace" {...register('birthPlace')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Tanggal Lahir</Label>
              <Input id="birthDate" type="date" {...register('birthDate')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea id="address" {...register('address')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">No. Telepon/WhatsApp</Label>
            <Input id="phone" type="tel" {...register('phone')} placeholder="08xxxxxxxxxx" />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Perubahan
        </Button>
      </div>
    </form>
  )
}
