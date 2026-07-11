'use client'

import * as React from 'react'
import { Loader2, Download, Image as ImageIcon, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ChartMember {
  id: string
  name: string | null
  email: string
  avatar: string | null
  role: { name: string; displayName: string; color: string } | null
  jabatan: { name: string; shortName: string | null; level: number } | null
  divisi: { id: string; name: string; color: string }[]
}

interface ChartLevel {
  level: number
  members: ChartMember[]
}

const getInitials = (name: string | null) => {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const levelNames: Record<number, string> = {
  1: 'Ketua Umum',
  2: 'Wakil Ketua',
  3: 'Sekretaris & Bendahara',
  4: 'Kepala Divisi',
  999: 'Anggota',
}

export default function OrgChartPage() {
  const [chartData, setChartData] = React.useState<ChartLevel[]>([])
  const [loading, setLoading] = React.useState(true)
  const [exporting, setExporting] = React.useState(false)
  const chartRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/org-chart')
        const data = await res.json()
        if (data.data) {
          setChartData(data.data)
        }
      } catch (error) {
        console.error('Error fetching org chart:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const exportToPNG = async () => {
    if (!chartRef.current) return

    setExporting(true)
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const link = document.createElement('a')
      link.download = `diagram-organisasi-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error exporting to PNG:', error)
      alert('Gagal export ke PNG')
    } finally {
      setExporting(false)
    }
  }

  const exportToPDF = async () => {
    if (!chartRef.current) return

    setExporting(true)
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`diagram-organisasi-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      alert('Gagal export ke PDF')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Diagram Organisasi</h1>
          <p className="text-muted-foreground">
            Struktur organisasi
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={exporting}>
            <Button variant="outline">
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportToPNG}>
              <ImageIcon className="mr-2 h-4 w-4" />
              Export PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chart Container - This is what will be exported */}
      <div className="overflow-x-auto pb-8">
        <div
          ref={chartRef}
          className="min-w-[800px] bg-white p-8 rounded-lg"
          style={{ backgroundColor: 'white' }}
        >
          {/* Header for export */}
          <div className="text-center mb-8 pb-4 border-b">
            <h1 className="text-2xl font-bold text-gray-900">Struktur Organisasi</h1>
            <p className="text-sm text-gray-500 mt-1">
              Generated on {new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>

          {chartData.map((levelData) => (
            <div key={levelData.level} className="mb-8">
              {/* Level Header */}
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  {levelNames[levelData.level] || `Level ${levelData.level}`}
                </h2>
                <div className="h-1 w-20 mx-auto bg-indigo-500/20 rounded-full mt-2" />
              </div>

              {/* Members Grid */}
              <div className="flex flex-wrap justify-center gap-4">
                {levelData.members.map((member) => (
                  <Card
                    key={member.id}
                    className="w-[180px] hover:shadow-lg transition-shadow border-gray-200"
                  >
                    <CardContent className="p-4 text-center">
                      <Avatar className="h-16 w-16 mx-auto mb-3">
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback
                          className="text-lg"
                          style={{
                            backgroundColor: member.role?.color || '#6366f1',
                          }}
                        >
                          <span className="text-white">{getInitials(member.name)}</span>
                        </AvatarFallback>
                      </Avatar>

                      <h3 className="font-semibold text-sm truncate">
                        {member.name || '-'}
                      </h3>

                      {member.jabatan && (
                        <p className="text-xs text-gray-500">
                          {member.jabatan.shortName || member.jabatan.name}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap justify-center gap-1">
                        {member.role && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${member.role.color}20`,
                              color: member.role.color,
                            }}
                          >
                            {member.role.displayName}
                          </Badge>
                        )}
                      </div>

                      {member.divisi.length > 0 && (
                        <div className="mt-2">
                          {member.divisi.slice(0, 2).map((d) => (
                            <Badge
                              key={d.id}
                              variant="outline"
                              className="text-xs mr-1"
                              style={{ borderColor: d.color, color: d.color }}
                            >
                              {d.name}
                            </Badge>
                          ))}
                          {member.divisi.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{member.divisi.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {chartData.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Belum ada data organisasi</p>
              <p className="text-sm mt-2">
                Tambahkan jabatan dan role ke anggota untuk melihat diagram
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
