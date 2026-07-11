// Events Section Configuration
export const eventsConfig = {
  variants: {
    default: {
      name: 'Default Events',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Agenda & Event' },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'showCalendar', type: 'boolean', label: 'Tampilkan Mini Calendar', default: false },
        { key: 'maxItems', type: 'number', label: 'Maksimal Items', default: 6 },
        { key: 'layout', type: 'select', label: 'Layout', options: ['grid', 'list', 'timeline'], default: 'grid' }
      ]
    },
    list: {
      name: 'Events List',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'maxItems', type: 'number', label: 'Maksimal Items', default: 10 }
      ]
    },
    calendar: {
      name: 'Full Calendar',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'showMonthNavigation', type: 'boolean', label: 'Tampilkan Navigasi Bulan', default: true }
      ]
    }
  },
  defaultVariant: 'default'
}

export type EventsConfig = typeof eventsConfig
