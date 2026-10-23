'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock } from 'lucide-react'

// Calendar utility functions (inline since @/lib/calendar doesn't exist)
function getWeeksForMonth(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  // Fill in days from previous month
  const firstDayOfWeek = firstDay.getDay()
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    currentWeek.push(new Date(year, month, -i))
  }

  // Fill in days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    currentWeek.push(new Date(year, month, day))
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Fill in days from next month
  if (currentWeek.length > 0) {
    let nextDay = 1
    while (currentWeek.length < 7) {
      currentWeek.push(new Date(year, month + 1, nextDay++))
    }
    weeks.push(currentWeek)
  }

  return weeks
}

interface Event {
  id: string
  title: string
  startDate: Date
  endDate?: Date
  allDay: boolean
  location?: string
  description?: string
  color: string
}

// Map API event to section event format
function mapEventForSection(event: any): Event {
  return {
    id: event.id,
    title: event.title,
    startDate: new Date(event.startDate),
    endDate: event.endDate ? new Date(event.endDate) : undefined,
    allDay: event.allDay ?? true,
    location: event.location,
    description: event.description,
    color: event.color || '#6366f1'
  }
}

interface EventsProps {
  config: {
    variant?: string
    title?: string
    subtitle?: string
    showCalendar?: boolean
    maxItems?: number
    layout?: 'grid' | 'list' | 'timeline'
    showMonthNavigation?: boolean
  }
  isPreview?: boolean
}

export default function Events({ config, isPreview = false }: EventsProps) {
  const variant = config.variant || 'default'
  const layout = config.layout || 'grid'
  const maxItems = config.maxItems || 6
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events?public=true&limit=20')
        if (res.ok) {
          const data = await res.json()
          const mappedEvents = (data.events || data).map(mapEventForSection)
          setEvents(mappedEvents)
        }
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date))
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getMonthName = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date)
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Calendar variant
  if (variant === 'calendar') {
    const weeks = getWeeksForMonth(currentMonth)

    return (
      <section className={`py-20 bg-white ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {config.title || 'Kalender'}
            </h2>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Month Navigation */}
            {config.showMonthNavigation !== false && (
              <div className="flex items-center justify-between p-4 bg-indigo-600 text-white">
                <button onClick={prevMonth} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  ←
                </button>
                <h3 className="text-xl font-bold">{getMonthName(currentMonth)}</h3>
                <button onClick={nextMonth} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  →
                </button>
              </div>
            )}

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-semibold text-gray-500 bg-gray-50 border-b">
                  {day}
                </div>
              ))}
              {weeks.map((week, weekIndex) => (
                week.map((day, dayIndex) => {
                  const dayEvents = events.filter(e => {
                    const eventDate = new Date(e.startDate)
                    return eventDate.getDate() === day.getDate() &&
                           eventDate.getMonth() === day.getMonth() &&
                           eventDate.getFullYear() === day.getFullYear()
                  })

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`min-h-24 p-2 border-b border-r ${day.getMonth() !== currentMonth.getMonth() ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}
                    >
                      <div className="text-sm font-medium mb-1">{day.getDate()}</div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className="text-xs p-1 rounded truncate"
                            style={{ backgroundColor: event.color + '20', color: event.color }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  )
                })
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Timeline variant
  if (layout === 'timeline') {
    return (
      <section className={`py-20 bg-gray-50 ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {config.title || 'Agenda & Event'}
            </h2>
            {config.subtitle && <p className="text-xl text-gray-600">{config.subtitle}</p>}
          </div>

          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-6">
                {events.slice(0, maxItems).map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: event.color }}
                      >
                        {index + 1}
                      </div>
                      {index < Math.min(events.length, maxItems) - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 my-2" />
                      )}
                    </div>
                    <div className="flex-1 bg-white p-4 rounded-xl shadow-md">
                      <div className="text-sm text-gray-500 mb-1">{formatDate(event.startDate)}</div>
                      <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                      {event.location && (
                        <p className="text-gray-600 text-sm flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{event.location}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p>Belum ada event yang terjadwal</p>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // List variant
  if (layout === 'list') {
    return (
      <section className={`py-20 bg-white ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {config.title || 'Agenda & Event'}
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))
            ) : events.length > 0 ? (
              events.slice(0, config.maxItems || 10).map(event => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div
                    className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white"
                    style={{ backgroundColor: event.color }}
                  >
                    <span className="text-lg font-bold">{new Date(event.startDate).getDate()}</span>
                    <span className="text-xs">
                      {new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(event.startDate))}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{event.title}</h3>
                    {event.location && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{event.location}</span>
                      </p>
                    )}
                  </div>
                  {!event.allDay && (
                    <div className="text-sm text-gray-500">{formatTime(event.startDate)}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p>Belum ada event</p>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Default grid variant
  return (
    <section className={`py-20 bg-gray-50 ${isPreview ? 'py-12' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {config.title || 'Agenda & Event'}
          </h2>
          {config.subtitle && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {config.subtitle}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
            ))
          ) : events.length > 0 ? (
            events.slice(0, maxItems).map(event => (
              <div
                key={event.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div
                  className="h-2"
                  style={{ backgroundColor: event.color }}
                />
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDate(event.startDate)}</span>
                    {!event.allDay && (
                      <>
                        <Clock className="w-4 h-4 text-gray-400 ml-2" />
                        <span>{formatTime(event.startDate)}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-gray-600 line-clamp-2">{event.description}</p>
                  )}
                  {event.location && (
                    <p className="text-sm text-gray-500 mt-3 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{event.location}</span>
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg p-6">
                <div className="h-2 bg-gray-200 mb-4" />
                <div className="h-4 bg-gray-200 w-1/3 mb-2" />
                <div className="h-6 bg-gray-200 w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 w-full" />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
