'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Key,
  Info,
  Calendar,
  Clock,
  Loader2,
  FileText,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export default function BilikSuaraPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Voter identification
  const [inputToken, setInputToken] = useState('')
  const [activeVoter, setActiveVoter] = useState<any>(null)
  const [checkingVoter, setCheckingVoter] = useState(false)

  // Selection & Modal
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [openConfirmModal, setOpenConfirmModal] = useState(false)
  const [openVisiModal, setOpenVisiModal] = useState(false)
  const [candidateDetailVisi, setCandidateDetailVisi] = useState<any>(null)

  // Submission
  const [submittingVote, setSubmittingVote] = useState(false)
  const [voteSuccess, setVoteSuccess] = useState<any>(null)

  useEffect(() => {
    if (slug) {
      loadEventData(slug)
    }
  }, [slug])

  const loadEventData = async (eventSlug: string) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/voting/${encodeURIComponent(eventSlug)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Sesi pemilihan tidak ditemukan')

      setEvent(json.data)
      if (json.data.userDptStatus?.isDpt) {
        setActiveVoter(json.data.userDptStatus)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat bilik suara')
    } finally {
      setLoading(false)
    }
  }

  const handleCastVote = async () => {
    if (!event) return
    setSubmittingVote(true)
    setErrorMsg('')

    try {
      const res = await fetch(`/api/voting/${event.id}/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kandidatId: selectedCandidate?.id || null,
          votingToken: inputToken || activeVoter?.votingToken || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memasukkan suara')

      setVoteSuccess(json.data)
      setOpenConfirmModal(false)
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses suara Anda')
      setOpenConfirmModal(false)
    } finally {
      setSubmittingVote(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <p className="text-sm font-medium text-slate-300">
          Mempersiapkan Bilik Suara Digital...
        </p>
      </div>
    )
  }

  if (errorMsg && !event) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold">Bilik Suara Tidak Tersedia</h2>
          <p className="text-xs text-slate-400">{errorMsg}</p>
        </div>
      </div>
    )
  }

  // Layar Sukses Mencoblos
  if (voteSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">Suara Berhasil Dicatat!</h2>
            <p className="text-xs text-slate-300 mt-1">
              Terima kasih atas partisipasi Anda dalam menentukan arah masa depan organisasi.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">
                Nama Pemilih Terverifikasi:
              </span>
              <span className="font-bold text-white">{voteSuccess.voterName}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase">
                Waktu Transaksi Suara:
              </span>
              <span className="font-mono text-slate-300">
                {new Date(voteSuccess.timestamp).toLocaleString('id-ID')}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase">
                Kode Verifikasi Integritas Kotak Suara (SHA-256):
              </span>
              <span className="font-mono text-[10px] text-emerald-400 break-all block mt-0.5">
                {voteSuccess.verificationHash}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Pilihan Anda telah terenkripsi secara anonim ke dalam kotak suara digital
            sesuai asas LUBER-JURDIL.
          </p>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => window.location.reload()}
          >
            Selesai
          </Button>
        </div>
      </div>
    )
  }

  // Cek apakah pemilihan belum buka atau sudah selesai
  const isAktif = event.status === 'AKTIF'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 py-8">
      {/* Header Bilik Suara */}
      <div className="max-w-4xl mx-auto w-full text-center space-y-2 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          BILIK SUARA DIGITAL BERASAS LUBER - JURDIL
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          {event.title}
        </h1>
        {event.description && (
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            {event.description}
          </p>
        )}
      </div>

      <div className="max-w-4xl mx-auto w-full flex-1 space-y-6">
        {/* Status Notifikasi jika tidak aktif */}
        {!isAktif && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-300 text-xs">
            <Clock className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold block">
                {event.status === 'DRAFT'
                  ? 'Sesi Pemilihan Belum Dimulai'
                  : 'Sesi Pemilihan Telah Ditutup'}
              </span>
              Pemungutan suara saat ini belum dapat dilakukan. Silakan menunggu panitia
              membuka sidang pleno.
            </div>
          </div>
        )}

        {/* Voter Token Authentication jika belum terautentikasi */}
        {!activeVoter?.isDpt && (
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Key className="w-4 h-4 text-primary" />
              Verifikasi Token Bilik Suara
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Masukkan 8 karakter token rahasia yang tercantum pada Daftar Pemilih
              Tetap (DPT) Anda:
            </p>
            <div className="space-y-2">
              <Input
                placeholder="Contoh: 7K9X2B4P"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                className="bg-slate-950 border-slate-700 text-white font-mono font-bold tracking-widest text-center text-lg h-12 uppercase"
                maxLength={8}
              />
              <span className="text-[10px] text-slate-400 block text-center">
                Token hanya dapat digunakan tepat satu kali untuk mencoblos.
              </span>
            </div>
          </div>
        )}

        {/* Jika sudah login dan terdaftar di DPT */}
        {activeVoter?.isDpt && (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Hak suara Anda terverifikasi dalam DPT</span>
            </div>
            {activeVoter.hasVoted && (
              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                Sudah Mencoblos
              </Badge>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 text-xs text-red-300 bg-red-950/40 border border-red-800 rounded-xl max-w-md mx-auto text-center">
            {errorMsg}
          </div>
        )}

        {/* Grid Kartu Kandidat Paslon */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {event.kandidat?.map((k: any) => (
            <div
              key={k.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div>
                {/* Header Nomor Urut */}
                <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg">
                    {k.nomorUrut}
                  </div>
                  <span className="font-mono text-xs text-slate-400 font-bold uppercase">
                    NOMOR URUT #{k.nomorUrut}
                  </span>
                </div>

                {/* Foto Paslon */}
                <div className="p-5 flex flex-col items-center text-center space-y-3">
                  {k.fotoUrl ? (
                    <img
                      src={k.fotoUrl}
                      alt={k.namaKetua}
                      className="w-32 h-40 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
                    />
                  ) : (
                    <div className="w-32 h-40 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-500">
                      <Vote className="w-12 h-12 opacity-30" />
                    </div>
                  )}

                  <div>
                    <h3 className="font-black text-lg text-white leading-tight">
                      {k.namaKetua}
                    </h3>
                    {k.namaWakil && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Wakil: {k.namaWakil}
                      </p>
                    )}
                  </div>

                  {k.visi && (
                    <p className="text-xs text-slate-300 italic line-clamp-2 px-2">
                      "{k.visi}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-950/60 border-t border-slate-800 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                  onClick={() => {
                    setCandidateDetailVisi(k)
                    setOpenVisiModal(true)
                  }}
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Lihat Visi & Misi Lengkap
                </Button>

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11"
                  disabled={!isAktif || activeVoter?.hasVoted}
                  onClick={() => {
                    setSelectedCandidate(k)
                    setOpenConfirmModal(true)
                  }}
                >
                  <Vote className="w-4 h-4 mr-2" />
                  COBLOS PASLON #{k.nomorUrut}
                </Button>
              </div>
            </div>
          ))}

          {/* Opsi Abstain jika diizinkan */}
          {event.allowAbstain && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between text-center space-y-4">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Vote className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base">Kotak Kosong / Abstain</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gunakan pilihan ini apabila Anda memilih untuk tidak menentukan salah
                  satu kandidat.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                disabled={!isAktif || activeVoter?.hasVoted}
                onClick={() => {
                  setSelectedCandidate(null)
                  setOpenConfirmModal(true)
                }}
              >
                PILIH ABSTAIN
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Hak Cipta */}
      <footer className="mt-8 text-center text-[11px] text-slate-500">
        HubbHQ E-Voting Module - Sistem Demokrasi Digital Terenkripsi Berstandar LUBER-JURDIL.
      </footer>

      {/* Modal Konfirmasi Coblos */}
      <Dialog open={openConfirmModal} onOpenChange={setOpenConfirmModal}>
        <DialogContent className="bg-slate-900 text-white border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Vote className="w-5 h-5 text-emerald-400" />
              Konfirmasi Pilihan Suara
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-center">
            {selectedCandidate ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto">
                  {selectedCandidate.nomorUrut}
                </div>
                <div>
                  <h4 className="font-black text-white text-base">
                    {selectedCandidate.namaKetua}
                  </h4>
                  {selectedCandidate.namaWakil && (
                    <p className="text-xs text-slate-400">
                      Wakil: {selectedCandidate.namaWakil}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <h4 className="font-bold text-amber-400 text-base">
                Pilihan Kotak Kosong / Abstain
              </h4>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin dengan pilihan Anda? Setelah suara dimasukkan ke kotak
              suara digital, hak suara Anda langsung terkunci dan tidak dapat diubah
              kembali.
            </p>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="border-slate-700 text-slate-300"
              onClick={() => setOpenConfirmModal(false)}
              disabled={submittingVote}
            >
              Batal & Periksa Kembali
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              onClick={handleCastVote}
              disabled={submittingVote}
            >
              {submittingVote ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memasukkan Suara...
                </>
              ) : (
                'Ya, Masukkan Suara Sah'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detail Visi & Misi */}
      <Dialog open={openVisiModal} onOpenChange={setOpenVisiModal}>
        <DialogContent className="bg-slate-900 text-white border-slate-800 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              Visi & Misi Paslon #{candidateDetailVisi?.nomorUrut}
            </DialogTitle>
          </DialogHeader>

          {candidateDetailVisi && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-sm text-white">
                  {candidateDetailVisi.namaKetua}
                  {candidateDetailVisi.namaWakil ? ` & ${candidateDetailVisi.namaWakil}` : ''}
                </h4>
              </div>

              {candidateDetailVisi.visi && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-400 uppercase text-[10px] block">
                    VISI UTAMA:
                  </span>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {candidateDetailVisi.visi}
                  </p>
                </div>
              )}

              {candidateDetailVisi.misi && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-400 uppercase text-[10px] block">
                    MISI STRATEGIS:
                  </span>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {candidateDetailVisi.misi}
                  </p>
                </div>
              )}

              {candidateDetailVisi.programUnggulan && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-400 uppercase text-[10px] block">
                    PROGRAM KERJA UNGGULAN:
                  </span>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {candidateDetailVisi.programUnggulan}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="border-slate-700 text-slate-300"
              onClick={() => setOpenVisiModal(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

