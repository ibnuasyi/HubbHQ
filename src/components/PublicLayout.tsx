'use client'

import dynamic from 'next/dynamic'

// Dynamic imports for theme components
const Header = dynamic(() => import('@/themes/default/Header'), { ssr: false })
const Footer = dynamic(() => import('@/themes/default/sections/Footer'), { ssr: false })

// Dynamic section imports
const sectionImports: Record<string, () => Promise<any>> = {
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

interface PublicLayoutProps {
  children: React.ReactNode
  header?: any
  footer?: any
}

export default function PublicLayout({ children, header, footer }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header config={header} />
      <main className="flex-1">
        {children}
      </main>
      <Footer config={footer} />
    </div>
  )
}

// Export section renderer
export async function renderSection(sectionKey: string, config: any, isPreview = false) {
  const importFn = sectionImports[sectionKey]
  if (!importFn) {
    console.warn(`Section ${sectionKey} not found`)
    return null
  }

  try {
    const module = await importFn()
    const Component = module.default
    return <Component config={config} isPreview={isPreview} />
  } catch (error) {
    console.error(`Error rendering section ${sectionKey}:`, error)
    return null
  }
}
