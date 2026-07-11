'use client'

import * as React from 'react'

interface WebsiteConfig {
  appName?: string
  appDescription?: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor?: string
  defaultTheme?: 'light' | 'dark' | 'system'
  sidebarCollapsed?: boolean
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
  websiteUrl?: string
  instagramUrl?: string
  facebookUrl?: string
  twitterUrl?: string
  youtubeUrl?: string
}

interface ConfigContextType {
  config: WebsiteConfig
  loading: boolean
  updateConfig: (key: string, value: any) => Promise<void>
  refreshConfig: () => Promise<void>
}

const ConfigContext = React.createContext<ConfigContextType>({
  config: {},
  loading: true,
  updateConfig: async () => {},
  refreshConfig: async () => {},
})

export function useWebsiteConfig() {
  return React.useContext(ConfigContext)
}

export function WebsiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<WebsiteConfig>({})
  const [loading, setLoading] = React.useState(true)

  const fetchConfig = React.useCallback(async () => {
    try {
      const res = await fetch('/api/website-config')
      if (res.ok) {
        const data = await res.json()
        if (data.data) {
          setConfig(data.data)

          // Apply theme based on config
          if (data.data.defaultTheme) {
            const currentTheme = localStorage.getItem('theme')
            if (!currentTheme) {
              // Only set if no user preference is stored
              if (data.data.defaultTheme !== 'system') {
                document.documentElement.classList.remove('light', 'dark')
                document.documentElement.classList.add(data.data.defaultTheme)
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching website config:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const updateConfig = async (key: string, value: any) => {
    try {
      const res = await fetch('/api/website-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })

      if (res.ok) {
        setConfig((prev) => ({ ...prev, [key]: value }))

        // Apply theme change immediately if theme is changed
        if (key === 'defaultTheme') {
          if (value === 'light' || value === 'dark') {
            document.documentElement.classList.remove('light', 'dark')
            document.documentElement.classList.add(value)
          } else if (value === 'system') {
            // Let system handle it
          }
        }
      }
    } catch (err) {
      console.error('Error updating config:', err)
    }
  }

  return (
    <ConfigContext.Provider
      value={{
        config,
        loading,
        updateConfig,
        refreshConfig: fetchConfig,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}
