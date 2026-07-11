import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { CheckCircle, XCircle, Clock, FileText, Calendar, Hash, User, ArrowRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { verifySignedToken, getTokenType, extractFromPath } from '@/lib/qr-verification'

interface PageProps {
  params: { id: string }
}

async function getSurat(id: string) {
  try {
    const surat = await prisma.surat.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
          },
        },
        jenisSurat: true,
      },
    })
    return surat
  } catch {
    return null
  }
}

const statusConfig = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800',
    icon: Clock,
    description: 'Surat masih dalam draft',
  },
  PENDING_APPROVAL: {
    label: 'Menunggu Persetujuan',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    description: 'Surat menunggu persetujuan sekretaris',
  },
  APPROVED: {
    label: 'Disetujui',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    description: 'Surat telah disetujui dan valid',
  },
  REJECTED: {
    label: 'Ditolak',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    description: 'Surat ditolak',
  },
}

export default async function VerifySuratPage({ params }: PageProps) {
  // Verify the token
  const tokenType = getTokenType(params.id)

  // Handle signed token
  if (tokenType === 'signed') {
    const verification = verifySignedToken(params.id)

    if (!verification.valid) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              QR Code Tidak Valid
            </h1>
            <p className="text-gray-600 mb-4">
              {verification.error}
            </p>
            <p className="text-sm text-gray-500">
              QR code mungkin sudah kadaluarsa atau telah dimanipulasi.
              Mohon minta QR code baru dari pihak yang berwenang.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
              >
                <span>Kunjungi Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )
    }

    // Get surat with valid signed token
    const surat = await getSurat(verification.suratId!)

    if (!surat) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Surat Tidak Ditemukan
            </h1>
            <p className="text-gray-600">
              Dokumen tidak ditemukan dalam sistem.
            </p>
          </div>
        </div>
      )
    }

    return <SuratContent surat={surat} isSigned={true} />
  }

  // Handle legacy token (backward compatibility)
  if (tokenType === 'legacy') {
    const surat = await getSurat(params.id)

    if (!surat) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Surat Tidak Ditemukan
            </h1>
            <p className="text-gray-600">
              Kode QR yang Anda scan tidak valid atau surat telah dihapus.
            </p>
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Peringatan Keamanan</span>
              </div>
              <p className="text-sm text-yellow-700">
                QR code ini menggunakan format lama yang tidak aman.
                Mohon generate QR code baru melalui sistem.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return <SuratContent surat={surat} isSigned={false} />
  }

  // Invalid token
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          QR Code Tidak Valid
        </h1>
        <p className="text-gray-600">
          Format QR code tidak dikenali. Pastikan Anda scan QR code yang benar.
        </p>
      </div>
    </div>
  )
}

// Component for displaying surat content
function SuratContent({ surat, isSigned }: { surat: Awaited<ReturnType<typeof getSurat>>, isSigned: boolean }) {
  if (!surat) return null

  const status = statusConfig[surat.status as keyof typeof statusConfig] || statusConfig.DRAFT
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Verifikasi Surat
              </h1>
              <p className="text-sm text-gray-500">
                Sistem Informasi Organisasi
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Security Badge */}
        {isSigned && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              ✓ QR Code terverifikasi - aman dari pemalsuan
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${status.color} mb-6`}>
          <StatusIcon className="w-5 h-5" />
          <span className="font-medium">{status.label}</span>
        </div>

        {/* Status Description */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <p className="text-gray-600">
            {status.description}
          </p>
          {surat.status === 'APPROVED' && (
            <div className="mt-3 flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Dokumen ini valid dan telah diverifikasi oleh sistem
              </span>
            </div>
          )}
        </div>

        {/* Surat Details */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {surat.jenisSurat && (
                    <span className="px-2 py-1 bg-white/20 rounded text-sm">
                      {surat.jenisSurat.code}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded text-sm ${
                    surat.type === 'MASUK' ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                    {surat.type === 'MASUK' ? 'Surat Masuk' : 'Surat Keluar'}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{surat.subject}</h2>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Letter Number */}
            {surat.letterNumber && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Hash className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nomor Surat</p>
                  <p className="font-semibold text-gray-900">{surat.letterNumber}</p>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tanggal Dibuat</p>
                  <p className="font-medium text-gray-900">
                    {new Date(surat.createdAt).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {surat.receivedDate && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Terima</p>
                    <p className="font-medium text-gray-900">
                      {new Date(surat.receivedDate).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sender/Receiver */}
            {surat.sender && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pengirim</p>
                  <p className="font-medium text-gray-900">{surat.sender}</p>
                  {surat.senderContact && (
                    <p className="text-sm text-gray-500">{surat.senderContact}</p>
                  )}
                </div>
              </div>
            )}

            {/* Requester */}
            {surat.requester && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Diminta Oleh</p>
                  <p className="font-medium text-gray-900">{surat.requester.name}</p>
                </div>
              </div>
            )}

            {/* Content */}
            {surat.content && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Isi / Ringkasan</p>
                <p className="text-gray-900 whitespace-pre-wrap">{surat.content}</p>
              </div>
            )}

            {/* Approved Info */}
            {surat.status === 'APPROVED' && surat.approver && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Disetujui</span>
                </div>
                <p className="text-sm text-green-700">
                  Oleh: <strong>{surat.approver.name}</strong>
                </p>
                {surat.approvedAt && (
                  <p className="text-sm text-green-700">
                    Pada: {new Date(surat.approvedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Dokumen ini diverifikasi melalui sistem pada{' '}
            {new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="mt-1">
            ID Dokumen: <code className="bg-gray-100 px-2 py-1 rounded">{surat.id}</code>
          </p>
        </div>

        {/* Link to App */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>Kunjungi Aplikasi</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
