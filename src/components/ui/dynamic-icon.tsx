import React from 'react'
import {
  Users,
  Target,
  Shield,
  Award,
  Calendar,
  ClipboardList,
  Handshake,
  BookOpen,
  GraduationCap,
  Activity,
  Trees,
  TrendingUp,
  HeartHandshake,
  Sparkles,
  FileText,
  Layout,
  Image as ImageIcon,
  HelpCircle,
  CheckCircle2,
  Building,
  Phone,
  Mail,
  MapPin,
  Compass,
  Star,
  Globe,
  Lock,
  Tag,
  Folder,
  LucideProps,
  Zap,
  BarChart3,
  Briefcase,
  Smile,
} from 'lucide-react'

// Map of names or legacy emoji characters to Lucide icons
const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  // Named icons
  users: Users,
  target: Target,
  shield: Shield,
  award: Award,
  calendar: Calendar,
  clipboard: ClipboardList,
  handshake: Handshake,
  book: BookOpen,
  graduationcap: GraduationCap,
  activity: Activity,
  trees: Trees,
  trendingup: TrendingUp,
  hearthandshake: HeartHandshake,
  sparkles: Sparkles,
  filetext: FileText,
  layout: Layout,
  image: ImageIcon,
  help: HelpCircle,
  check: CheckCircle2,
  building: Building,
  phone: Phone,
  mail: Mail,
  mappin: MapPin,
  compass: Compass,
  star: Star,
  globe: Globe,
  lock: Lock,
  tag: Tag,
  folder: Folder,
  zap: Zap,
  barchart: BarChart3,
  briefcase: Briefcase,
  smile: Smile,

  // Legacy emoji mappings
  '👥': Users,
  '📋': ClipboardList,
  '🤝': Handshake,
  '🏆': Award,
  '🎯': Target,
  '🛡️': Shield,
  '🛡': Shield,
  '📚': BookOpen,
  '🏥': Activity,
  '🌱': Trees,
  '💰': TrendingUp,
  '❤️': HeartHandshake,
  '🎭': Sparkles,
  '🚀': Zap,
  '📊': BarChart3,
  '📁': Folder,
  '📅': Calendar,
  '📨': Mail,
  '🌐': Globe,
  '⭐': Star,
  '💡': Sparkles,
  '🏛️': Building,
  '🏛': Building,
  '🖼️': ImageIcon,
  '🖼': ImageIcon,
  '✨': Sparkles,
  '🔍': Compass,
}

interface DynamicIconProps extends LucideProps {
  name?: string
  fallback?: React.ComponentType<LucideProps>
}

export function DynamicIcon({
  name,
  fallback = Sparkles,
  className = 'w-6 h-6',
  'aria-hidden': ariaHidden = true,
  ...props
}: DynamicIconProps) {
  if (!name) {
    const FallbackIcon = fallback
    return <FallbackIcon className={className} aria-hidden={ariaHidden} {...props} />
  }

  const cleanKey = name.trim().toLowerCase().replace(/[-_\s]/g, '')
  const IconComponent = iconMap[cleanKey] || iconMap[name.trim()] || fallback

  return <IconComponent className={className} aria-hidden={ariaHidden} {...props} />
}

