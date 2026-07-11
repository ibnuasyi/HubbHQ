import { User, Role, Divisi, ProgramKerja, Transaction, Checkpoint } from '@prisma/client'

// Extended types with relations
export type UserWithRelations = User & {
  role?: Role | null
  divisiMembers?: DivisiMemberWithRelations[]
}

export type DivisiMemberWithRelations = {
  id: string
  userId: string
  divisiId: string
  position: string | null
  isActive: boolean
  joinedAt: Date
  user?: UserWithRelations
  divisi?: Divisi
}

export type ProgramKerjaWithRelations = ProgramKerja & {
  divisi?: Divisi
  pic?: User | null
  creator?: User
  checkpoints?: Checkpoint[]
  progress?: number
}

export type TransactionWithRelations = Transaction & {
  createdBy?: User | null
  kasPayment?: {
    user?: User | null
  } | null
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  name: string
  fullName?: string
  nickname?: string
}

export interface ProfileForm {
  name: string
  fullName?: string
  nickname?: string
  birthPlace?: string
  birthDate?: string
  address?: string
  phone?: string
  avatar?: string
  signature?: string
}

// Checkpoint progress calculation
export function calculateProgress(checkpoints: { isCompleted: boolean }[]): number {
  if (checkpoints.length === 0) return 0
  const completed = checkpoints.filter((c) => c.isCompleted).length
  return Math.round((completed / checkpoints.length) * 100)
}

// Navigation items type
export interface NavItem {
  title: string
  href: string
  icon?: string
  items?: NavItem[]
}

// Permission types
export type Permission =
  | 'dashboard.view'
  | 'members.view'
  | 'members.create'
  | 'members.edit'
  | 'members.delete'
  | 'divisi.view'
  | 'divisi.create'
  | 'divisi.edit'
  | 'divisi.delete'
  | 'proker.view'
  | 'proker.create'
  | 'proker.edit'
  | 'proker.delete'
  | 'keuangan.view'
  | 'keuangan.create'
  | 'keuangan.edit'
  | 'keuangan.approve'
  | 'surat.view'
  | 'surat.create'
  | 'surat.approve'
  | 'surat.template'
  | 'library.view'
  | 'library.upload'
  | 'settings.view'
  | 'settings.edit'
  | 'website.view'
  | 'website.edit'

// Role colors
export const ROLE_COLORS: Record<string, string> = {
  admin: '#ef4444',
  ketua: '#f59e0b',
  sekretaris: '#10b981',
  bendahara: '#8b5cf6',
  anggota: '#6366f1',
}
