'use client'

import * as React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  Plus,
  Loader2,
  Calendar as CalendarIcon,
  X,
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  allDay: boolean
  location: string | null
  color: string
  isPublic: boolean
  creator: { id: string; name: string | null }
  programKerja: { id: string; title: string } | null
}

interface Proker {
  id: string
  title: string
  status: string
}

const COLOR_OPTIONS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#84cc16', label: 'Lime' },
]

export default function KalenderPage() {
  const calendarRef = React.useRef<FullCalendar>(null)
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [prokers, setProkers] = React.useState<Proker[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAdd, setShowAdd] = React.useState(false)
  const [showDetail, setShowDetail] = React.useState(false)
  const [showList, setShowList] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'month' | 'week' | 'day'>('month')

  // Form state
  const [formTitle, setFormTitle] = React.useState('')
  const [formDescription, setFormDescription] = React.useState('')
  const [formStartDate, setFormStartDate] = React.useState('')
  const [formEndDate, setFormEndDate] = React.useState('')
  const [formAllDay, setFormAllDay] = React.useState(true)
  const [formLocation, setFormLocation] = React.useState('')
  const [formColor, setFormColor] = React.useState('#6366f1')
  const [formIsPublic, setFormIsPublic] = React.useState(true)
  const [formProkerId, setFormProkerId] = React.useState<string>('')

  const fetchEvents = React.useCallback(async (start?: string, end?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (start) params.append('start', start)
      if (end) params.append('end', end)

      const res = await fetch(`/api/kalender?${params}`)
      const data = await res.json()
      if (data.data) {
        setEvents(data.data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProkers = async () => {
    try {
      const res = await fetch('/api/proker?status=ON_PROGRESS')
      const data = await res.json()
      if (data.data) {
        setProkers(data.data)
      }
    } catch (error) {
      console.error('Error fetching prokers:', error)
    }
  }

  React.useEffect(() => {
    fetchEvents()
    fetchProkers()
  }, [fetchEvents])

  const handleAddEvent = async () => {
    if (!formTitle || !formStartDate) return

    setSaving(true)
    try {
      const res = await fetch('/api/kalender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          startDate: formStartDate,
          endDate: formEndDate || formStartDate,
          allDay: formAllDay,
          location: formLocation,
          color: formColor,
          isPublic: formIsPublic,
          programKerjaId: formProkerId || null,
        }),
      })

      if (res.ok) {
        setShowAdd(false)
        resetForm()
        refetchCalendar()
      }
    } catch (error) {
      console.error('Error adding event:', error)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setFormStartDate('')
    setFormEndDate('')
    setFormAllDay(true)
    setFormLocation('')
    setFormColor('#6366f1')
    setFormIsPublic(true)
    setFormProkerId('')
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Hapus acara ini?')) return

    try {
      const res = await fetch(`/api/kalender/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setShowDetail(false)
        refetchCalendar()
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const openDetail = (event: any) => {
    const calEvent = events.find((e) => e.id === event.id)
    if (calEvent) {
      setSelectedEvent(calEvent)
      setShowDetail(true)
    }
  }

  const refetchCalendar = () => {
    const api = calendarRef.current?.getApi()
    if (api) {
      const start = api.view.activeStart.toISOString()
      const end = api.view.activeEnd.toISOString()
      fetchEvents(start, end)
    } else {
      fetchEvents()
    }
  }

  // Handle date click for quick add
  const handleDateClick = (info: any) => {
    resetForm()
    setFormStartDate(info.dateStr.split('T')[0])
    setShowAdd(true)
  }

  // Handle event drop (drag & drop)
  const handleEventDrop = async (info: any) => {
    try {
      const res = await fetch(`/api/kalender/${info.event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: info.event.start?.toISOString(),
          endDate: info.event.end?.toISOString(),
        }),
      })

      if (!res.ok) {
        info.revert()
      }
    } catch (error) {
      console.error('Error updating event:', error)
      info.revert()
    }
  }

  // Convert events to FullCalendar format
  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startDate,
    end: event.endDate || undefined,
    allDay: event.allDay,
    backgroundColor: event.color,
    borderColor: event.color,
    extendedProps: {
      ...event,
    },
  }))

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kalender</h1>
          <p className="text-muted-foreground">
            Agenda dan acara organisasi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowList(!showList)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {showList ? 'Tampilan Kalender' : 'Tampilan List'}
          </Button>
          <Button onClick={() => { resetForm(); setShowAdd(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Acara
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : showList ? (
        // List View
        <Card>
          <CardHeader>
            <CardTitle>Daftar Acara</CardTitle>
            <CardDescription>
              {events.length} acara
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Belum ada acara</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((event) => (
                    <button
                      key={event.id}
                      onClick={() => { setSelectedEvent(event); setShowDetail(true) }}
                      className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div
                        className="w-1 h-12 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.startDate).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                          {event.location && ` - ${event.location}`}
                        </p>
                      </div>
                      {event.programKerja && (
                        <Badge variant="outline">{event.programKerja.title}</Badge>
                      )}
                    </button>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Calendar View
        <Card>
          <CardContent className="p-4">
            <div className="fc-demo">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={calendarEvents}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                dateClick={handleDateClick}
                eventClick={openDetail}
                eventDrop={handleEventDrop}
                eventResizableFromStart={true}
                height="auto"
                locale="id"
                buttonText={{
                  today: 'Hari Ini',
                  month: 'Bulan',
                  week: 'Minggu',
                  day: 'Hari',
                }}
                eventContent={(eventInfo) => (
                  <div className="p-1 overflow-hidden">
                    <p className="font-medium truncate text-xs">{eventInfo.event.title}</p>
                    {eventInfo.event.allDay !== true && (
                      <p className="text-xs opacity-80">
                        {eventInfo.timeText}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Event Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Acara</DialogTitle>
            <DialogDescription>
              Tambahkan acara baru ke kalender
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul *</Label>
              <Input
                placeholder="Nama acara"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi acara"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai *</Label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formAllDay}
                  onChange={(e) => setFormAllDay(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="allDay" className="font-normal">
                  Seharian
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formIsPublic}
                  onChange={(e) => setFormIsPublic(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isPublic" className="font-normal">
                  Tampil di website publik
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Input
                placeholder="Tempat acara"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Program Kerja</Label>
              <Select value={formProkerId} onValueChange={setFormProkerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Hubungkan dengan proker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak ada</SelectItem>
                  {prokers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormColor(color.value)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formColor === color.value ? 'border-black scale-110' : 'border-transparent'
                    } transition-all`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Batal
            </Button>
            <Button
              onClick={handleAddEvent}
              disabled={saving || !formTitle || !formStartDate}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div
                className="h-2 rounded-full"
                style={{ backgroundColor: selectedEvent.color }}
              />
              {selectedEvent.description && (
                <p className="text-muted-foreground">{selectedEvent.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">
                    {new Date(selectedEvent.startDate).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {selectedEvent.location && (
                  <div>
                    <p className="text-sm text-muted-foreground">Lokasi</p>
                    <p className="font-medium">{selectedEvent.location}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Dibuat oleh</p>
                  <p className="font-medium">{selectedEvent.creator.name || '-'}</p>
                </div>
                {selectedEvent.programKerja && (
                  <div>
                    <p className="text-sm text-muted-foreground">Program Kerja</p>
                    <a
                      href={`/dashboard/proker/${selectedEvent.programKerja.id}`}
                      className="font-medium text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      {selectedEvent.programKerja.title}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selectedEvent.isPublic ? 'default' : 'secondary'}>
                  {selectedEvent.isPublic ? 'Publik' : 'Internal'}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => deleteEvent(selectedEvent!.id)}
            >
              <X className="mr-2 h-4 w-4" />
              Hapus
            </Button>
            <Button variant="outline" onClick={() => setShowDetail(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
