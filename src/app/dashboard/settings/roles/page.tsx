'use client'

import * as React from 'react'
import {
  Plus,
  Loader2,
  Lock,
  Edit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

interface Role {
  id: string
  name: string
  displayName: string
  description: string | null
  color: string
  permissions: { id: string; name: string; label: string }[]
  _count: { users: number }
}

interface Permission {
  id: string
  name: string
  label: string
  group: string
}

interface CurrentUser {
  id: string
  name: string
  email: string
  role: { name: string; displayName?: string }
}

export default function RolesPage() {
  const [roles, setRoles] = React.useState<Role[]>([])
  const [permissions, setPermissions] = React.useState<Permission[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAdd, setShowAdd] = React.useState(false)
  const [showEdit, setShowEdit] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null)

  // Form state
  const [formName, setFormName] = React.useState('')
  const [formDisplayName, setFormDisplayName] = React.useState('')
  const [formDescription, setFormDescription] = React.useState('')
  const [formColor, setFormColor] = React.useState('#6366f1')
  const [formPermissions, setFormPermissions] = React.useState<string[]>([])

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [rolesRes, permissionsRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/permissions'),
      ])

      if (rolesRes.ok) {
        const data = await rolesRes.json()
        setRoles(data.data || [])
      }
      if (permissionsRes.ok) {
        const data = await permissionsRes.json()
        setPermissions(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
    // Fetch current user
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user as CurrentUser)
        }
      })
      .catch(console.error)
  }, [fetchData])

  const roleName = currentUser?.role?.name?.toLowerCase() || ''
  const roleDisplay = currentUser?.role?.displayName?.toLowerCase() || ''
  const isAdmin =
    roleName === 'admin' ||
    roleName === 'superadmin' ||
    roleName === 'super_admin' ||
    roleName === 'super admin' ||
    roleName === 'administrator' ||
    roleDisplay.includes('admin')

  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, Permission[]> = {}
    permissions.forEach((p) => {
      if (!groups[p.group]) groups[p.group] = []
      groups[p.group].push(p)
    })
    return groups
  }, [permissions])

  const handleSubmit = async () => {
    if (!formName || !formDisplayName) return

    setSaving(true)
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          displayName: formDisplayName,
          description: formDescription,
          color: formColor,
          permissionIds: formPermissions,
        }),
      })

      if (res.ok) {
        setShowAdd(false)
        resetForm()
        fetchData()
      }
    } catch (error) {
      console.error('Error creating role:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedRole || !formDisplayName) return

    setSaving(true)
    try {
      const res = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formDisplayName,
          description: formDescription,
          color: formColor,
          permissionIds: formPermissions,
        }),
      })

      if (res.ok) {
        setShowEdit(false)
        resetForm()
        setSelectedRole(null)
        fetchData()
      }
    } catch (error) {
      console.error('Error updating role:', error)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormDisplayName('')
    setFormDescription('')
    setFormColor('#6366f1')
    setFormPermissions([])
  }

  const togglePermission = (id: string) => {
    setFormPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Role & Permission</h1>
          <p className="text-muted-foreground">
            Kelola role dan hak akses ({roles.length} role)
          </p>
        </div>
        {isAdmin ? (
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Role
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
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <CardTitle className="text-base">{role.displayName}</CardTitle>
                  </div>
                  <Badge variant="outline">{role._count.users} user</Badge>
                </div>
                <CardDescription>@{role.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {role.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {role.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mb-3">
                  {role.permissions.slice(0, 5).map((p) => (
                    <Badge key={p.id} variant="secondary" className="text-xs">
                      {p.label}
                    </Badge>
                  ))}
                  {role.permissions.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{role.permissions.length - 5} lagi
                    </Badge>
                  )}
                </div>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedRole(role)
                      setFormName(role.name)
                      setFormDisplayName(role.displayName)
                      setFormDescription(role.description || '')
                      setFormColor(role.color)
                      setFormPermissions(role.permissions.map((p) => p.id))
                      setShowEdit(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Role
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Role Dialog */}
      <Dialog open={showAdd} onOpenChange={(open) => {
        if (!isAdmin) return
        setShowAdd(open)
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Role Baru</DialogTitle>
            <DialogDescription>
              Buat role baru dan atur permissionnya
            </DialogDescription>
          </DialogHeader>
          {!isAdmin ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Hanya administrator yang dapat menambah role
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama (slug) *</Label>
                  <Input
                    placeholder="Contoh: bendahara"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name *</Label>
                  <Input
                    placeholder="Contoh: Bendahara"
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input
                  placeholder="Deskripsi role"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Warna</Label>
                <div className="flex gap-2">
                  {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formColor === color ? 'border-black' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <div key={group} className="border rounded-lg p-3">
                    <p className="font-medium text-sm mb-2">{group}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`perm-${p.id}`}
                            checked={formPermissions.includes(p.id)}
                            onCheckedChange={() => togglePermission(p.id)}
                          />
                          <Label htmlFor={`perm-${p.id}`} className="text-sm cursor-pointer">
                            {p.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => setShowAdd(false)}>
                  Batal
                </Button>
                <Button onClick={handleSubmit} disabled={saving || !formName || !formDisplayName}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEdit} onOpenChange={(open) => {
        if (!isAdmin) return
        setShowEdit(open)
        if (!open) {
          resetForm()
          setSelectedRole(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Ubah permissions untuk role: @{selectedRole?.name}
            </DialogDescription>
          </DialogHeader>
          {!isAdmin ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Hanya administrator yang dapat mengedit role
              </p>
            </div>
          ) : selectedRole ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama (slug)</Label>
                  <Input value={selectedRole.name} disabled />
                  <p className="text-xs text-muted-foreground">Nama tidak bisa diubah</p>
                </div>
                <div className="space-y-2">
                  <Label>Display Name *</Label>
                  <Input
                    placeholder="Contoh: Bendahara"
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input
                  placeholder="Deskripsi role"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Warna</Label>
                <div className="flex gap-2">
                  {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formColor === color ? 'border-black' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <div key={group} className="border rounded-lg p-3">
                    <p className="font-medium text-sm mb-2">{group}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`edit-perm-${p.id}`}
                            checked={formPermissions.includes(p.id)}
                            onCheckedChange={() => togglePermission(p.id)}
                          />
                          <Label htmlFor={`edit-perm-${p.id}`} className="text-sm cursor-pointer">
                            {p.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => { setShowEdit(false); resetForm(); setSelectedRole(null) }}>
                  Batal
                </Button>
                <Button onClick={handleEdit} disabled={saving || !formDisplayName}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Perubahan
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
