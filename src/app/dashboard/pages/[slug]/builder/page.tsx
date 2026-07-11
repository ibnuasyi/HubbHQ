'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowLeft,
  Eye,
  Save,
  Globe,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Loader2,
  Layout,
  Monitor,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Section Components
const sectionComponents: Record<string, any> = {
  hero: dynamic(() => import('@/themes/default/sections/Hero'), { ssr: false }),
  about: dynamic(() => import('@/themes/default/sections/About'), { ssr: false }),
  visimisi: dynamic(() => import('@/themes/default/sections/VisiMisi'), { ssr: false }),
  programs: dynamic(() => import('@/themes/default/sections/Programs'), { ssr: false }),
  team: dynamic(() => import('@/themes/default/sections/Team'), { ssr: false }),
  events: dynamic(() => import('@/themes/default/sections/Events'), { ssr: false }),
  contact: dynamic(() => import('@/themes/default/sections/Contact'), { ssr: false }),
  stats: dynamic(() => import('@/themes/default/sections/Stats'), { ssr: false }),
  gallery: dynamic(() => import('@/themes/default/sections/Gallery'), { ssr: false }),
  faq: dynamic(() => import('@/themes/default/sections/Faq'), { ssr: false }),
  cta: dynamic(() => import('@/themes/default/sections/Cta'), { ssr: false }),
  partners: dynamic(() => import('@/themes/default/sections/Partners'), { ssr: false }),
  documents: dynamic(() => import('@/themes/default/sections/Documents'), { ssr: false }),
  newsletter: dynamic(() => import('@/themes/default/sections/Newsletter'), { ssr: false })
}

const availableSections = [
  { key: 'hero', name: 'Hero Section', icon: '🖼️', description: 'Full-width header with background' },
  { key: 'about', name: 'About Section', icon: 'ℹ️', description: 'About information with image' },
  { key: 'visimisi', name: 'Visi Misi', icon: '🎯', description: 'Vision and mission' },
  { key: 'programs', name: 'Programs', icon: '📋', description: 'Program cards' },
  { key: 'team', name: 'Team', icon: '👥', description: 'Team members grid' },
  { key: 'events', name: 'Events', icon: '📅', description: 'Calendar events' },
  { key: 'stats', name: 'Stats', icon: '📊', description: 'Animated counters' },
  { key: 'gallery', name: 'Gallery', icon: '🖼️', description: 'Photo gallery with lightbox' },
  { key: 'faq', name: 'FAQ', icon: '❓', description: 'Frequently asked questions' },
  { key: 'cta', name: 'CTA', icon: '📢', description: 'Call to action banner' },
  { key: 'contact', name: 'Contact', icon: '📧', description: 'Contact form and info' },
  { key: 'partners', name: 'Partners', icon: '🤝', description: 'Partner logos' },
  { key: 'documents', name: 'Documents', icon: '📄', description: 'Downloadable documents' },
  { key: 'newsletter', name: 'Newsletter', icon: '✉️', description: 'Email subscription' }
]

interface Page {
  id: string
  title: string
  slug: string
  isPublished: boolean
  sections: Section[]
}

interface Section {
  id: string
  sectionKey: string
  title?: string
  config: any
  order: number
  isEnabled: boolean
}

interface Props {
  params: Promise<{ slug: string }>
}

// Sortable Section Item
function SortableSection({
  section,
  onEdit,
  onDelete,
  isPreview
}: {
  section: Section
  onEdit: () => void
  onDelete: () => void
  isPreview: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const SectionComponent = sectionComponents[section.sectionKey]
  const sectionInfo = availableSections.find(s => s.key === section.sectionKey)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
        isDragging ? 'border-indigo-500 shadow-lg' : 'border-transparent hover:border-gray-200'
      }`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-gray-200 rounded-md transition-colors"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </button>
          <span className="text-lg">{sectionInfo?.icon || '📦'}</span>
          <div className="hidden sm:block">
            <span className="font-medium text-gray-900">{section.title || sectionInfo?.name}</span>
            <span className="text-xs text-gray-400 ml-2 font-mono">({section.sectionKey})</span>
          </div>
          {!section.isEnabled && (
            <Badge variant="secondary" className="text-xs">Disabled</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 px-2"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Section Preview */}
      <div className={`${isPreview ? 'max-h-48 overflow-hidden relative' : ''}`}>
        {isPreview && (
          <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none h-12 top-0" />
        )}
        {SectionComponent ? (
          <SectionComponent config={section.config} isPreview={true} />
        ) : (
          <div className="p-8 text-center text-gray-500">
            Section not found: {section.sectionKey}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PageBuilderPage({ params }: Props) {
  const { slug } = use(params)
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchPage()
  }, [slug])

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/pages/${slug}`)
      if (res.ok) {
        const data = await res.json()
        setPage(data)
      }
    } catch (error) {
      console.error('Error fetching page:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePage = async () => {
    if (!page) return
    setSaving(true)
    try {
      await fetch(`/api/pages/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: page.isPublished
        })
      })
    } catch (error) {
      console.error('Error saving page:', error)
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async () => {
    if (!page) return
    try {
      const res = await fetch(`/api/pages/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !page.isPublished })
      })
      if (res.ok) {
        setPage({ ...page, isPublished: !page.isPublished })
      }
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !page || active.id === over.id) return

    const oldIndex = page.sections.findIndex(s => s.id === active.id)
    const newIndex = page.sections.findIndex(s => s.id === over.id)

    const newSections = arrayMove(page.sections, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i
    }))

    setPage({ ...page, sections: newSections })

    try {
      await fetch(`/api/pages/${slug}/sections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: newSections.map(s => ({ id: s.id, order: s.order }))
        })
      })
    } catch (error) {
      console.error('Error saving order:', error)
    }
  }

  const addSection = async (sectionKey: string) => {
    try {
      const res = await fetch(`/api/pages/${slug}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionKey })
      })
      if (res.ok) {
        await fetchPage()
        setShowAddModal(false)
      }
    } catch (error) {
      console.error('Error adding section:', error)
    }
  }

  const deleteSection = async (sectionId: string) => {
    try {
      await fetch(`/api/pages/${slug}/sections/${sectionId}`, { method: 'DELETE' })
      await fetchPage()
    } catch (error) {
      console.error('Error deleting section:', error)
    }
  }

  const updateSectionConfig = async (sectionId: string, config: any, title?: string) => {
    try {
      await fetch(`/api/pages/${slug}/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, title })
      })
      await fetchPage()
      setEditingSection(null)
    } catch (error) {
      console.error('Error updating section:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!page) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/pages"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Pages</span>
          </Link>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div className="min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">{page.title}</h1>
            <p className="text-xs text-muted-foreground font-mono">/{page.slug}</p>
          </div>
          <Badge variant={page.isPublished ? 'default' : 'secondary'} className="hidden sm:inline-flex">
            {page.isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? (
              <>
                <Layout className="w-4 h-4 mr-1.5" />
                Edit
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1.5" />
                Preview
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={savePage}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            Save
          </Button>
          <Button
            size="sm"
            onClick={togglePublish}
            className={page.isPublished ? '' : 'bg-green-600 hover:bg-green-700'}
          >
            <Globe className="w-4 h-4 mr-1.5" />
            {page.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {previewMode ? (
          // Preview Mode
          <div className="flex-1 overflow-auto">
            {page.sections.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg mb-2">No sections to preview</p>
                  <Button onClick={() => setPreviewMode(false)} variant="outline">
                    Add sections
                  </Button>
                </div>
              </div>
            ) : (
              <div className="min-h-full">
                {page.sections.map(section => {
                  const SectionComponent = sectionComponents[section.sectionKey]
                  if (!SectionComponent || !section.isEnabled) return null
                  return (
                    <SectionComponent key={section.id} config={section.config} isPreview={false} />
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          // Edit Mode
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">
                    Sections
                    <Badge variant="secondary" className="ml-2">{page.sections.length}</Badge>
                  </h2>
                  <p className="text-sm text-muted-foreground">Drag to reorder sections</p>
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Section
                </Button>
              </div>

              {page.sections.length === 0 ? (
                <div className="text-center py-16 bg-muted/50 rounded-xl border-2 border-dashed">
                  <Layout className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Belum ada section</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                    Tambahkan section untuk membangun halaman Anda
                  </p>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add First Section
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={page.sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {page.sections.map(section => (
                        <SortableSection
                          key={section.id}
                          section={section}
                          onEdit={() => setEditingSection(section)}
                          onDelete={() => deleteSection(section.id)}
                          isPreview={true}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Section Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1 py-2">
            {availableSections.map(section => (
              <button
                key={section.key}
                onClick={() => addSection(section.key)}
                className="p-4 border rounded-xl hover:border-primary hover:bg-primary/5 text-left transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {section.icon}
                  </span>
                  <div>
                    <span className="font-medium block">{section.name}</span>
                    <span className="text-xs text-muted-foreground">{section.description}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Section Modal */}
      <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {editingSection && (availableSections.find(s => s.key === editingSection.sectionKey)?.name || 'Section')}
            </DialogTitle>
          </DialogHeader>
          {editingSection && (
            <SectionEditorForm
              section={editingSection}
              onSave={(config, title) => updateSectionConfig(editingSection.id, config, title)}
              onClose={() => setEditingSection(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Section Editor Form
function SectionEditorForm({
  section,
  onSave,
  onClose
}: {
  section: Section
  onSave: (config: any, title?: string) => void
  onClose: () => void
}) {
  const [config, setConfig] = useState(section.config || {})
  const [title, setTitle] = useState(section.title || '')
  const [showJson, setShowJson] = useState(false)

  const handleSave = () => {
    onSave(config, title || undefined)
  }

  const sectionInfo = availableSections.find(s => s.key === section.sectionKey)

  return (
    <div className="space-y-4">
      {/* Section Info */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <span className="text-2xl">{sectionInfo?.icon}</span>
        <div>
          <span className="font-medium">{sectionInfo?.name}</span>
          <p className="text-xs text-muted-foreground">{sectionInfo?.description}</p>
        </div>
      </div>

      {/* Title */}
      <div>
        <Label>Section Title (Optional)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Custom title for this section"
        />
      </div>

      {/* Toggle JSON View */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowJson(!showJson)}
        className="text-xs"
      >
        {showJson ? 'Hide' : 'Show'} JSON Config
      </Button>

      {showJson ? (
        <Textarea
          value={JSON.stringify(config, null, 2)}
          onChange={(e) => {
            try {
              setConfig(JSON.parse(e.target.value))
            } catch {}
          }}
          className="font-mono text-xs h-48"
        />
      ) : (
        <SectionConfigFields
          sectionKey={section.sectionKey}
          config={config}
          onChange={setConfig}
        />
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}

// Dynamic Config Fields
function SectionConfigFields({
  sectionKey,
  config,
  onChange
}: {
  sectionKey: string
  config: any
  onChange: (config: any) => void
}) {
  interface FieldConfig {
    key: string
    label: string
    type: string
    placeholder?: string
    options?: string[]
  }

  const fieldsBySection: Record<string, FieldConfig[]> = {
    hero: [
      { key: 'title', label: 'Title', type: 'text', placeholder: 'Welcome to our organization' },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Your subtitle here' },
      { key: 'backgroundImage', label: 'Background Image URL', type: 'url', placeholder: 'https://...' },
      { key: 'ctaText', label: 'CTA Button Text', type: 'text', placeholder: 'Learn More' },
      { key: 'ctaLink', label: 'CTA Button Link', type: 'url', placeholder: '/about' },
      { key: 'textAlign', label: 'Text Alignment', type: 'select', options: ['left', 'center', 'right'] }
    ],
    about: [
      { key: 'title', label: 'Title', type: 'text', placeholder: 'About Us' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Our story' },
      { key: 'content', label: 'Content', type: 'richtext', placeholder: 'HTML content...' },
      { key: 'image', label: 'Image URL', type: 'url', placeholder: 'https://...' },
      { key: 'imagePosition', label: 'Image Position', type: 'select', options: ['left', 'right'] }
    ],
    stats: [
      { key: 'title', label: 'Section Title', type: 'text', placeholder: 'Our Achievements' }
    ],
    cta: [
      { key: 'title', label: 'Title', type: 'text', placeholder: 'Ready to join us?' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Join thousands of members' },
      { key: 'primaryCtaText', label: 'Primary Button Text', type: 'text', placeholder: 'Get Started' },
      { key: 'primaryCtaLink', label: 'Primary Button Link', type: 'url', placeholder: '/register' },
      { key: 'backgroundColor', label: 'Background Color', type: 'color' }
    ],
    contact: [
      { key: 'title', label: 'Title', type: 'text', placeholder: 'Contact Us' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'phone', label: 'Phone', type: 'text', placeholder: '+62...' },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'info@example.com' }
    ],
    newsletter: [
      { key: 'title', label: 'Title', type: 'text', placeholder: 'Subscribe to Newsletter' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Get updates' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'buttonText', label: 'Button Text', type: 'text', placeholder: 'Subscribe' }
    ]
  }

  const fields = fieldsBySection[sectionKey] || [
    { key: 'title', label: 'Title', type: 'text' }
  ]

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-muted-foreground">Configuration</h4>
      {fields.map(field => (
        <div key={field.key}>
          <Label className="text-sm">{field.label}</Label>
          {field.type === 'textarea' || field.type === 'richtext' ? (
            <Textarea
              value={config[field.key] || ''}
              onChange={(e) => onChange({ ...config, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              rows={field.type === 'richtext' ? 5 : 3}
              className="mt-1"
            />
          ) : field.type === 'select' ? (
            <select
              value={config[field.key] || (field.options?.[0]) || 'left'}
              onChange={(e) => onChange({ ...config, [field.key]: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              {field.options?.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === 'color' ? (
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={config[field.key] || '#6366f1'}
                onChange={(e) => onChange({ ...config, [field.key]: e.target.value })}
                className="w-12 h-10 rounded border cursor-pointer"
              />
              <Input
                type="text"
                value={config[field.key] || '#6366f1'}
                onChange={(e) => onChange({ ...config, [field.key]: e.target.value })}
                className="flex-1 font-mono"
              />
            </div>
          ) : (
            <Input
              type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
              value={config[field.key] || ''}
              onChange={(e) => onChange({ ...config, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              className="mt-1"
            />
          )}
        </div>
      ))}
    </div>
  )
}
