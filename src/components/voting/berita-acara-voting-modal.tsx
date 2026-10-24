'use client'

import React, { useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, FileCheck } from 'lucide-react'

interface BeritaAcaraVotingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: any
  kandidatList: any[]
  totalDpt: number
  totalSuaraMasuk: number
}

export function BeritaAcaraVotingModal({
  open,
  onOpenChange,
  event,
  kandidatList,
  totalDpt,
  totalSuaraMasuk,
}: BeritaAcaraVotingModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!event) return null

  const handlePrint = () => {
    window.print()
  }

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Urutkan kandidat berdasarkan perolehan suara terbanyak
  const sortedKandidat = [...kandidatList].sort(
    (a, b) => (b.suaraSah || 0) - (a.suaraSah || 0)
  )

  const pemenang = sortedKandidat.length > 0 ? sortedKandidat[0] : null
  const totalSuaraSah = kandidatList.reduce(
    (acc, curr) => acc + (curr.suaraSah || 0),
    0
  )
  const suaraAbstain = Math.max(0, totalSuaraMasuk - totalSuaraSah)
  const persentasePartisipasi =
    totalDpt > 0 ? Math.round((totalSuaraMasuk / totalDpt) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <FileCheck className="w-5 h-5 text-primary" />
            Berita Acara Hasil Pemilihan (BAHP)
          </DialogTitle>
        </DialogHeader>

        {/* Paper Container for Print */}
        <div
          ref={printRef}
          id="printable-berita-acara-voting"
          className="p-8 bg-white text-slate-900 border rounded-lg shadow-sm font-serif print:border-none print:shadow-none print:p-0 print:m-0"
        >
          {/* Kop Surat Organisasi */}
          <div className="text-center pb-4 mb-4 border-b-2 border-slate-900">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-950 font-sans">
              PRESIDIUM SIDANG PLENO MUSYAWARAH
            </h2>
            <p className="text-xs uppercase tracking-widest text-slate-600 font-sans font-semibold">
              PANITIA PEMILIHAN & SUKSESI KEPENGURUSAN ORGANISASI
            </p>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
              Sistem Demokrasi Digital HubbHQ (LUBER - JURDIL)
            </p>
          </div>

          {/* Judul Dokumen */}
          <div className="text-center mb-6">
            <h3 className="text-base font-black uppercase tracking-wide border-b-2 border-slate-900 inline-block px-4 pb-0.5 font-sans">
              BERITA ACARA HASIL PEMUNGUTAN SUARA (BAHP)
            </h3>
            <p className="text-xs font-mono font-semibold text-slate-700 mt-1 font-sans">
              Nomor: {event.slug ? `BAHP/${new Date().getFullYear()}/${event.slug.toUpperCase()}` : 'BAHP/PLENO/001'}
            </p>
          </div>

          <p className="text-xs leading-relaxed text-justify mb-4">
            Pada hari ini, <strong className="font-sans">{currentDate}</strong>, telah diselenggarakan
            sidang pleno pemungutan dan penghitungan suara secara digital dalam rangka agenda{' '}
            <strong className="font-sans">{event.title}</strong>, dengan berasaskan Langsung,
            Umum, Bebas, Rahasia, Jujur, dan Adil (LUBER - JURDIL), dengan hasil rekapitulasi sebagai
            berikut:
          </p>

          {/* I. Rekapitulasi Data Pemilih & Suara Masuk */}
          <div className="mb-4">
            <h4 className="text-xs font-bold font-sans uppercase text-slate-800 mb-1 border-b border-slate-300 pb-0.5">
              I. REKAPITULASI DATA PEMILIH & TINGKAT PARTISIPASI
            </h4>
            <table className="w-full text-xs border border-slate-300 font-sans mt-1">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-72 p-2 bg-slate-50 font-medium">Jumlah Daftar Pemilih Tetap (DPT)</td>
                  <td className="p-2 font-bold">: {totalDpt} Jiwa</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 bg-slate-50 font-medium">Jumlah Hak Suara Masuk (Suara Digital)</td>
                  <td className="p-2 font-bold">: {totalSuaraMasuk} Suara ({persentasePartisipasi}% Partisipasi)</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 bg-slate-50 font-medium">Jumlah Suara Sah Kandidat</td>
                  <td className="p-2 font-bold text-emerald-700">: {totalSuaraSah} Suara</td>
                </tr>
                <tr>
                  <td className="p-2 bg-slate-50 font-medium">Jumlah Suara Abstain / Kotak Kosong</td>
                  <td className="p-2 font-bold text-slate-600">: {suaraAbstain} Suara</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* II. Hasil Perolehan Suara Kandidat */}
          <div className="mb-4">
            <h4 className="text-xs font-bold font-sans uppercase text-slate-800 mb-1 border-b border-slate-300 pb-0.5">
              II. HASIL PEROLEHAN SUARA PASANGAN CALON / KANDIDAT
            </h4>
            <table className="w-full text-xs border border-slate-300 font-sans mt-1">
              <thead className="bg-slate-100 text-slate-900 font-bold">
                <tr>
                  <th className="border border-slate-300 px-2 py-1.5 text-center w-12">No. Urut</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left">Nama Pasangan Calon</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-center w-28">Perolehan Suara</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-center w-24">Persentase</th>
                </tr>
              </thead>
              <tbody>
                {sortedKandidat.map((k) => {
                  const pct =
                    totalSuaraMasuk > 0
                      ? Math.round(((k.suaraSah || 0) / totalSuaraMasuk) * 1000) / 10
                      : 0

                  return (
                    <tr key={k.id} className="border-b border-slate-200">
                      <td className="border border-slate-300 px-2 py-2 text-center font-bold">
                        {k.nomorUrut}
                      </td>
                      <td className="border border-slate-300 px-2 py-2">
                        <div className="font-bold text-slate-950">{k.namaKetua}</div>
                        {k.namaWakil && (
                          <div className="text-[11px] text-slate-600">Wakil: {k.namaWakil}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-center font-bold text-sm">
                        {k.suaraSah || 0}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-center font-bold">
                        {pct}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* III. Penetapan Pemenang */}
          <div className="mb-6 p-3 bg-slate-50 border-2 border-slate-800 rounded text-xs font-sans">
            <h4 className="font-black uppercase tracking-wider text-slate-900 mb-1">
              III. KEPUTUSAN PENETAPAN HASIL PLENO
            </h4>
            {pemenang ? (
              <p className="leading-relaxed text-slate-800">
                Berdasarkan hasil penghitungan suara pleno, Presidium Sidang secara sah dan mengikat
                menetapkan Pasangan Calon No. Urut <strong className="font-bold">{pemenang.nomorUrut}</strong>{' '}
                atas nama <strong className="font-bold">{pemenang.namaKetua}</strong>
                {pemenang.namaWakil ? ` dan ${pemenang.namaWakil}` : ''} dengan perolehan{' '}
                <strong className="font-bold">{pemenang.suaraSah || 0} suara</strong> sebagai Formatur /
                Ketua Terpilih.
              </p>
            ) : (
              <p className="text-slate-600 italic">Belum ada kandidat yang terdaftar.</p>
            )}
          </div>

          {/* Kolom Tanda Tangan Presidium Sidang */}
          <div className="pt-2">
            <p className="text-xs font-sans font-bold text-center uppercase tracking-wider text-slate-800 mb-6">
              PRESIDIUM SIDANG PLENO MUSYAWARAH
            </p>
            <div className="grid grid-cols-3 gap-4 text-xs font-sans text-center">
              <div>
                <p className="text-slate-600 mb-14">Presidium Sidang I (Ketua),</p>
                <div className="border-b border-slate-900 mx-2"></div>
                <p className="font-bold text-slate-900 mt-1">( ........................................ )</p>
              </div>

              <div>
                <p className="text-slate-600 mb-14">Presidium Sidang II (Sekretaris),</p>
                <div className="border-b border-slate-900 mx-2"></div>
                <p className="font-bold text-slate-900 mt-1">( ........................................ )</p>
              </div>

              <div>
                <p className="text-slate-600 mb-14">Presidium Sidang III (Anggota),</p>
                <div className="border-b border-slate-900 mx-2"></div>
                <p className="font-bold text-slate-900 mt-1">( ........................................ )</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="print:hidden pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
          <Button type="button" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak Berita Acara (BAHP)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

