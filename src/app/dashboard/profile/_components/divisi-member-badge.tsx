'use client'

import { Badge } from '@/components/ui/badge'

interface DivisiMemberBadgeProps {
  member: {
    id: string
    position: string | null
    divisi: {
      id: string
      name: string
      color: string
    }
  }
}

export function DivisiMemberBadge({ member }: DivisiMemberBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="ml-1"
      style={{
        borderColor: member.divisi.color,
        color: member.divisi.color,
      }}
    >
      {member.position ? `${member.divisi.name} (${member.position})` : member.divisi.name}
    </Badge>
  )
}
