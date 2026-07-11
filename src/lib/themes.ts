// Theme loader utilities
import { heroConfig } from '@/themes/default/sections/Hero.config'
import { aboutConfig } from '@/themes/default/sections/About.config'
import { visimisiConfig } from '@/themes/default/sections/VisiMisi.config'
import { programsConfig } from '@/themes/default/sections/Programs.config'
import { teamConfig } from '@/themes/default/sections/Team.config'
import { eventsConfig } from '@/themes/default/sections/Events.config'
import { contactConfig } from '@/themes/default/sections/Contact.config'
import { statsConfig } from '@/themes/default/sections/Stats.config'
import { galleryConfig } from '@/themes/default/sections/Gallery.config'
import { faqConfig } from '@/themes/default/sections/Faq.config'
import { ctaConfig } from '@/themes/default/sections/Cta.config'
import { partnersConfig } from '@/themes/default/sections/Partners.config'
import { documentsConfig } from '@/themes/default/sections/Documents.config'
import { newsletterConfig } from '@/themes/default/sections/Newsletter.config'

// Default section configs (from default theme)
const defaultSectionConfigs: Record<string, any> = {
  hero: heroConfig,
  about: aboutConfig,
  visimisi: visimisiConfig,
  programs: programsConfig,
  team: teamConfig,
  events: eventsConfig,
  contact: contactConfig,
  stats: statsConfig,
  gallery: galleryConfig,
  faq: faqConfig,
  cta: ctaConfig,
  partners: partnersConfig,
  documents: documentsConfig,
  newsletter: newsletterConfig
}

// Default section components (from default theme)
const defaultSectionComponents: Record<string, any> = {
  hero: () => import('@/themes/default/sections/Hero'),
  about: () => import('@/themes/default/sections/About'),
  visimisi: () => import('@/themes/default/sections/VisiMisi'),
  programs: () => import('@/themes/default/sections/Programs'),
  team: () => import('@/themes/default/sections/Team'),
  events: () => import('@/themes/default/sections/Events'),
  contact: () => import('@/themes/default/sections/Contact'),
  stats: () => import('@/themes/default/sections/Stats'),
  gallery: () => import('@/themes/default/sections/Gallery'),
  faq: () => import('@/themes/default/sections/Faq'),
  cta: () => import('@/themes/default/sections/Cta'),
  partners: () => import('@/themes/default/sections/Partners'),
  documents: () => import('@/themes/default/sections/Documents'),
  newsletter: () => import('@/themes/default/sections/Newsletter')
}

// Current active theme slug
let currentThemeSlug = 'default'

// Section config registry (loaded dynamically per theme)
export const sectionConfigs: Record<string, any> = { ...defaultSectionConfigs }

// Section component imports (loaded dynamically per theme)
export const sectionComponents: Record<string, any> = { ...defaultSectionComponents }

// Get section config
export function getSectionConfig(sectionKey: string) {
  return sectionConfigs[sectionKey] || null
}

// Get section variants
export function getSectionVariants(sectionKey: string) {
  const config = sectionConfigs[sectionKey]
  if (!config) return {}
  return config.variants || {}
}

// Get section default config
export function getSectionDefaultConfig(sectionKey: string, variant: string = 'default') {
  const config = sectionConfigs[sectionKey]
  if (!config || !config.variants) return {}

  const variantConfig = config.variants[variant] || config.variants[config.defaultVariant] || {}
  const fields = variantConfig.fields || []

  // Generate default values
  const defaults: Record<string, any> = {}
  fields.forEach((field: any) => {
    defaults[field.key] = field.default !== undefined ? field.default : ''
  })

  return defaults
}

// Get available sections from theme
export function getAvailableSections(themeConfig: any) {
  if (!themeConfig || !themeConfig.availableSections) {
    return []
  }
  return themeConfig.availableSections
}

// Validate section config
export function validateSectionConfig(sectionKey: string, config: any, variant: string = 'default') {
  const sectionConfig = sectionConfigs[sectionKey]
  if (!sectionConfig) return { valid: false, errors: ['Unknown section type'] }

  const variantConfig = sectionConfig.variants?.[variant] || sectionConfig.variants?.[sectionConfig.defaultVariant]
  if (!variantConfig) return { valid: false, errors: ['Unknown variant'] }

  const fields = variantConfig.fields || []
  const errors: string[] = []

  fields.forEach((field: any) => {
    if (field.required && !config[field.key]) {
      errors.push(`Field "${field.label}" is required`)
    }
  })

  return { valid: errors.length === 0, errors }
}

// Theme config type
export interface ThemeConfig {
  name: string
  slug: string
  version: string
  author?: string
  description?: string
  thumbnail?: string
  defaultSections: string[]
  availableSections: Array<{
    key: string
    name: string
    icon: string
    description?: string
  }>
  config: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    backgroundColor: string
    textColor: string
    fontFamily: string
    borderRadius: string
  }
  layouts: {
    [key: string]: {
      containerWidth: string
      spacing: string
    }
  }
}

// Load theme config
export async function loadThemeConfig(slug: string): Promise<ThemeConfig | null> {
  try {
    // Try to load from API
    const res = await fetch(`/api/themes/${slug}`)
    if (res.ok) {
      const theme = await res.json()
      return theme.config as ThemeConfig
    }
  } catch (error) {
    console.error('Error loading theme config:', error)
  }

  // Fallback to local theme.json
  try {
    const module = await import(`@/themes/${slug}/theme.json`)
    return module.default as ThemeConfig
  } catch {
    return null
  }
}

// Get active theme
export async function getActiveTheme() {
  try {
    const res = await fetch('/api/themes?active=true')
    if (res.ok) {
      const themes = await res.json()
      return themes.find((t: any) => t.isActive) || null
    }
  } catch (error) {
    console.error('Error fetching active theme:', error)
  }
  return null
}

// Load theme-specific section configs and components
export async function loadThemeSections(themeSlug: string) {
  // If using default theme or no specific theme, keep default
  if (themeSlug === 'default') {
    currentThemeSlug = 'default'
    Object.assign(sectionConfigs, defaultSectionConfigs)
    Object.assign(sectionComponents, defaultSectionComponents)
    return
  }

  currentThemeSlug = themeSlug

  // Load organ2-style configs
  if (themeSlug === 'organ2-style') {
    try {
      const [hero, about, stats, programs, visimisi, team, cta] = await Promise.all([
        import('@/themes/organ2-style/sections/Hero.config'),
        import('@/themes/organ2-style/sections/About.config'),
        import('@/themes/organ2-style/sections/Stats.config'),
        import('@/themes/organ2-style/sections/Programs.config'),
        import('@/themes/organ2-style/sections/VisiMisi.config'),
        import('@/themes/organ2-style/sections/Team.config'),
        import('@/themes/organ2-style/sections/Cta.config'),
      ])

      // Override with theme-specific configs
      sectionConfigs.hero = hero.heroConfig
      sectionConfigs.about = about.aboutConfig
      sectionConfigs.stats = stats.statsConfig
      sectionConfigs.programs = programs.programsConfig
      sectionConfigs.visimisi = visimisi.visimisiConfig
      sectionConfigs.team = team.teamConfig
      sectionConfigs.cta = cta.ctaConfig

      // Override with theme-specific components
      sectionComponents.hero = () => import('@/themes/organ2-style/sections/Hero')
      sectionComponents.about = () => import('@/themes/organ2-style/sections/About')
      sectionComponents.stats = () => import('@/themes/organ2-style/sections/Stats')
      sectionComponents.programs = () => import('@/themes/organ2-style/sections/Programs')
      sectionComponents.visimisi = () => import('@/themes/organ2-style/sections/VisiMisi')
      sectionComponents.team = () => import('@/themes/organ2-style/sections/Team')
      sectionComponents.cta = () => import('@/themes/organ2-style/sections/Cta')
      sectionComponents.footer = () => import('@/themes/organ2-style/sections/Footer')
      sectionComponents.header = () => import('@/themes/organ2-style/Header')

    } catch (error) {
      console.error('Error loading organ2-style theme:', error)
      // Fallback to default
      Object.assign(sectionConfigs, defaultSectionConfigs)
      Object.assign(sectionComponents, defaultSectionComponents)
    }
    return
  }

  // For other custom themes, try to load them
  try {
    const themeConfig = await loadThemeConfig(themeSlug)
    if (themeConfig) {
      // For custom themes, load their specific section configs if they exist
      const availableSectionKeys = themeConfig.availableSections?.map(s => s.key) || []

      for (const key of availableSectionKeys) {
        try {
          const configModule = await import(`@/themes/${themeSlug}/sections/${capitalize(key)}.config`)
          sectionConfigs[key] = configModule[`${key}Config`] || configModule.default
        } catch {
          // Config not found, use default if available
          if (defaultSectionConfigs[key]) {
            sectionConfigs[key] = defaultSectionConfigs[key]
          }
        }

        try {
          sectionComponents[key] = () => import(`@/themes/${themeSlug}/sections/${capitalize(key)}`)
        } catch {
          // Component not found, use default if available
          if (defaultSectionComponents[key]) {
            sectionComponents[key] = defaultSectionComponents[key]
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading custom theme:', error)
  }
}

// Helper to capitalize first letter
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Get current theme slug
export function getCurrentThemeSlug() {
  return currentThemeSlug
}

// Reset to default theme
export function resetToDefaultTheme() {
  currentThemeSlug = 'default'
  Object.assign(sectionConfigs, defaultSectionConfigs)
  Object.assign(sectionComponents, defaultSectionComponents)
}
