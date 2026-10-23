'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Loader2,
  Save,
  Menu as MenuIcon,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useWebsiteConfig } from '@/hooks/use-website-config'

interface MenuItem {
  id: string
  label: string
  href: string
  icon?: string | null
  order: number
  parentId?: string | null
  isActive: boolean
  isExternal: boolean
  children?: MenuItem[]
}

export default function MenuManagementPage() {
  const { config: websiteConfig } = useWebsiteConfig()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    label: '',
    href: '',
    icon: '',
    isExternal: false,
    parentId: '' as string | null,
  })
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu')
      if (res.ok) {
        const data = await res.json()
        setMenuItems(data)
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingItem) {
        // Update
        await fetch('/api/menu', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingItem.id,
            ...formData
          })
        })
      } else {
        // Create
        await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
      }

      await fetchMenu()
      closeModal()
    } catch (error) {
      console.error('Error saving menu item:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this menu item? Child items will also be deleted.')) return

    try {
      await fetch(`/api/menu?id=${id}`, { method: 'DELETE' })
      await fetchMenu()
    } catch (error) {
      console.error('Error deleting menu item:', error)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const openAddModal = (parentId: string | null = null) => {
    setEditingItem(null)
    setFormData({
      label: '',
      href: '',
      icon: '',
      isExternal: false,
      parentId,
    })
    setShowAddModal(true)
  }

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      label: item.label,
      href: item.href,
      icon: item.icon || '',
      isExternal: item.isExternal,
      parentId: item.parentId ?? null,
    })
    setShowAddModal(true)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingItem(null)
  }

  const getTopLevelItems = () => {
    return menuItems.filter(item => !item.parentId).sort((a, b) => a.order - b.order)
  }

  const getChildren = (parentId: string) => {
    return menuItems.filter(item => item.parentId === parentId).sort((a, b) => a.order - b.order)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Kelola navigasi website</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => openAddModal(null)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Menu Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MenuIcon className="w-5 h-5" />
              Menu Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            {menuItems.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <MenuIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Belum ada menu item</p>
                <Button onClick={() => openAddModal(null)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {getTopLevelItems().map(item => (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    level={0}
                    expandedItems={expandedItems}
                    onToggleExpand={toggleExpand}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onAddChild={openAddModal}
                    getChildren={getChildren}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Help */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Help</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Adding Menu Items</h4>
              <p className="text-sm text-muted-foreground">
                Click "Add Menu Item" to add a new top-level menu. Use the expand arrow
                to add sub-items under any menu.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">External Links</h4>
              <p className="text-sm text-muted-foreground">
                Enable "External Link" to open the URL in a new tab.
                Useful for linking to social media or external websites.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">URL Examples</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <code className="bg-muted px-1 rounded">/</code> - Homepage</li>
                <li>• <code className="bg-muted px-1 rounded">/tentang</code> - About page</li>
                <li>• <code className="bg-muted px-1 rounded">/berita</code> - Blog list</li>
                <li>• <code className="bg-muted px-1 rounded">https://example.com</code> - External</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Menu label"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="href">URL / Path</Label>
              <Input
                id="href"
                value={formData.href}
                onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                placeholder="/about or https://..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Use /path for internal pages, full URL for external links
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (optional)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="home, users, calendar..."
              />
              <p className="text-xs text-muted-foreground">
                Nama icon Lucide (misal: home, users, filetext)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isExternal"
                checked={formData.isExternal}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isExternal: checked === true })
                }
              />
              <label
                htmlFor="isExternal"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed"
              >
                Open in new tab (external link)
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingItem ? 'Save Changes' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Menu Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded" />
                <span className="font-bold">{websiteConfig.appName || 'HubbHQ'}</span>
              </div>
              <nav className="flex items-center gap-4">
                {menuItems.filter(m => !m.parentId).sort((a, b) => a.order - b.order).map(item => (
                  <div key={item.id} className="relative group">
                    <span className="flex items-center gap-1 text-sm cursor-pointer">
                      {item.icon && <span>{item.icon}</span>}
                      {item.label}
                    </span>
                    {item.children && item.children.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 w-40 bg-white shadow-lg rounded border py-1 hidden group-hover:block">
                        {item.children.sort((a, b) => a.order - b.order).map(child => (
                          <div key={child.id} className="px-3 py-1.5 text-sm hover:bg-muted cursor-pointer">
                            {child.icon && <span className="mr-1">{child.icon}</span>}
                            {child.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
            <p className="text-center text-muted-foreground text-sm">
              Preview of how your menu will look
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Recursive Menu Item Row Component
function MenuItemRow({
  item,
  level,
  expandedItems,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddChild,
  getChildren,
}: {
  item: MenuItem
  level: number
  expandedItems: Set<string>
  onToggleExpand: (id: string) => void
  onEdit: (item: MenuItem) => void
  onDelete: (id: string) => void
  onAddChild: (parentId: string | null) => void
  getChildren: (parentId: string) => MenuItem[]
}) {
  const children = getChildren(item.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedItems.has(item.id)

  return (
    <div>
      <div
        className={cn(
          'flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors',
          level > 0 && 'ml-6'
        )}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => onToggleExpand(item.id)}
              className="p-1 hover:bg-muted-foreground/20 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />

          {item.icon && (
            <span className="text-lg">{item.icon}</span>
          )}

          <span className="font-medium truncate">{item.label}</span>

          <span className="text-xs text-muted-foreground truncate font-mono">
            {item.href}
          </span>

          {item.isExternal && (
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          )}

          {!item.isActive && (
            <Badge variant="secondary" className="text-xs">Disabled</Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddChild(item.id)}
            title="Add submenu"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="border-l-2 border-muted ml-6">
          {children.map(child => (
            <MenuItemRow
              key={child.id}
              item={child}
              level={level + 1}
              expandedItems={expandedItems}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              getChildren={getChildren}
            />
          ))}
        </div>
      )}
    </div>
  )
}
