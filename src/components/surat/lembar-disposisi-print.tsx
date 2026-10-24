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
import { Printer, FileText } from 'lucide-react'
import { DisposisiData } from './disposisi-modal'

interface LembarDisposisiPrintProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  disposisi: DisposisiData | null
  surat: {
    letterNumber: string | null
    subject: string
    sender: string | null
    receivedDate: string | null
  } | null
}

const ALL_INSTRUKSI = [
  { id: 'TINDAKLANJUTI', label: 'Tindaklanjuti sesuai ketentuan' },
  { id: 'TANGGAPI_BALAS', label: 'Tanggapi / siapkan surat balasan' },
  { id: 'HADIRI_WAKILI', label: 'Hadiri / penuhi undangan (delegasi)' },
  { id: 'KOORDINASIKAN', label: 'Koordinasikan dengan pihak terkait' },
  { id: 'PELAJARI_LAPORKAN', label: 'Pelajari, telaah & laporkan hasilnya' },
  { id: 'ARSIPKAN', label: 'Simpan sebagai arsip sekretariat' },
]

export function LembarDisposisiPrint({
  open,
  onOpenChange,
  disposisi,
  surat,
}: LembarDisposisiPrintProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!disposisi || !surat) return null

  let activeInstruksi: string[] = []
  try {
    activeInstruksi = JSON.parse(disposisi.instruksi || '[]')
  } catch {
    activeInstruksi = []
  }

  const handlePrint = () => {
    window.print()
  }

  const tglTerima = surat.receivedDate
    ? new Date(surat.receivedDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-'

  const tglDisposisi = disposisi.createdAt
    ? new Date(disposisi.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('id-ID')

  const tglBatas = disposisi.batasWaktu
    ? new Date(disposisi.batasWaktu).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-'

  const targetPenerima =
    disposisi.tujuanDivisi?.name ||
    disposisi.tujuanUser?.name ||
    disposisi.tujuanCustom ||
    'Semua Pengurus'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <FileText className="w-5 h-5 text-primary" />
            Lembar Disposisi Surat Masuk Resmi
          </DialogTitle>
        </DialogHeader>

        {/* Paper Container for Print */}
        <div
          ref={printRef}
          id="printable-lembar-disposisi"
          className="p-8 bg-white text-slate-900 border rounded-lg shadow-sm font-sans print:border-none print:shadow-none print:p-0 print:m-0"
        >
          {/* Kop Surat Organisasi */}
          <div className="text-center pb-3 mb-4 border-b-2 border-slate-900">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-950">
              SEKRETARIAT JENDERAL ORGANISASI
            </h2>
            <p className="text-xs uppercase tracking-widest text-slate-600 font-semibold">
              SISTEM INFORMASI PERSURATAN & TATA KELOLA ADMINISTRASI (HUBBHQ)
            </p>
          </div>

          {/* Judul Dokumen */}
          <div className="text-center mb-4">
            <h3 className="text-base font-black uppercase tracking-wide border-b-2 border-slate-900 inline-block px-4 pb-0.5">
              LEMBAR DISPOSISI
            </h3>
          </div>

          {/* Sifat Disposisi Bar */}
          <div className="grid grid-cols-4 border-2 border-slate-900 mb-3 text-xs font-bold text-center">
            <div className={`p-1.5 border-r-2 border-slate-900 ${disposisi.sifat === 'SANGAT_SEGERA' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
              [ {disposisi.sifat === 'SANGAT_SEGERA' ? 'X' : ' '} ] SANGAT SEGERA
            </div>
            <div className={`p-1.5 border-r-2 border-slate-900 ${disposisi.sifat === 'SEGERA' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
              [ {disposisi.sifat === 'SEGERA' ? 'X' : ' '} ] SEGERA
            </div>
            <div className={`p-1.5 border-r-2 border-slate-900 ${disposisi.sifat === 'BIASA' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
              [ {disposisi.sifat === 'BIASA' ? 'X' : ' '} ] BIASA
            </div>
            <div className={`p-1.5 ${disposisi.sifat === 'RAHASIA' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
              [ {disposisi.sifat === 'RAHASIA' ? 'X' : ' '} ] RAHASIA
            </div>
          </div>

          {/* Tabel Metadata Surat Masuk */}
          <table className="w-full text-xs border-2 border-slate-900 mb-3">
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="w-32 p-2 font-bold bg-slate-50 border-r border-slate-900">Surat Dari</td>
                <td className="p-2 font-semibold" colSpan={3}>: {surat.sender || '-'}</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-2 font-bold bg-slate-50 border-r border-slate-900">Nomor Surat</td>
                <td className="p-2 font-mono font-medium border-r border-slate-900">: {surat.letterNumber || '-'}</td>
                <td className="w-28 p-2 font-bold bg-slate-50 border-r border-slate-900">No. Agenda</td>
                <td className="p-2 font-mono font-bold">: {disposisi.nomorAgenda || '-'}</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-2 font-bold bg-slate-50 border-r border-slate-900">Tgl. Diterima</td>
                <td className="p-2">: {tglTerima}</td>
                <td className="p-2 font-bold bg-slate-50 border-r border-slate-900">Batas Waktu</td>
                <td className="p-2 font-semibold text-red-600">: {tglBatas}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold bg-slate-50 border-r border-slate-900">Perihal / Hal</td>
                <td className="p-2 font-bold" colSpan={3}>: {surat.subject}</td>
              </tr>
            </tbody>
          </table>

          {/* Diteruskan Kepada */}
          <div className="border-2 border-slate-900 p-2.5 mb-3 bg-slate-50">
            <span className="text-[11px] font-black uppercase tracking-wider block text-slate-700">
              DITERUSKAN KEPADA SDR:
            </span>
            <div className="text-sm font-black text-slate-950 mt-0.5">
              {targetPenerima}
            </div>
          </div>

          {/* Petunjuk / Instruksi Disposisi */}
          <div className="border-2 border-slate-900 p-3 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider block text-slate-900 mb-2 border-b border-slate-300 pb-1">
              PETUNJUK / DISPOSISI PIMPINAN:
            </span>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs">
              {ALL_INSTRUKSI.map((ins) => {
                const checked = activeInstruksi.includes(ins.id)
                return (
                  <div key={ins.id} className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs">
                      [ {checked ? 'X' : ' '} ]
                    </span>
                    <span className={checked ? 'font-bold text-slate-950' : 'text-slate-600'}>
                      {ins.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Catatan Khusus Pimpinan */}
          <div className="border-2 border-slate-900 p-3 mb-4 min-h-[90px]">
            <span className="text-[11px] font-black uppercase tracking-wider block text-slate-900 mb-1 border-b border-slate-300 pb-1">
              CATATAN / INSTRUKSI KHUSUS PIMPINAN:
            </span>
            <p className="text-xs leading-relaxed text-slate-900 italic font-serif pt-1 whitespace-pre-wrap">
              {disposisi.catatanPimpinan || '(Tidak ada catatan khusus, laksanakan sesuai petunjuk di atas)'}
            </p>
          </div>

          {/* Status Hasil Tindak Lanjut jika ada */}
          {disposisi.catatanTindakLanjut && (
            <div className="border border-dashed border-slate-400 p-2.5 mb-4 bg-slate-50 text-xs">
              <span className="font-bold block uppercase text-[10px] text-slate-600">
                Laporan Hasil Tindak Lanjut Pelaksana:
              </span>
              <p className="text-slate-800 mt-0.5">{disposisi.catatanTindakLanjut}</p>
              {disposisi.tglSelesai && (
                <span className="text-[10px] text-slate-500 block mt-1">
                  Diselesaikan pada: {new Date(disposisi.tglSelesai).toLocaleDateString('id-ID')}
                </span>
              )}
            </div>
          )}

          {/* Tanda Tangan Pimpinan Pemberi Disposisi */}
          <div className="flex justify-end pt-2">
            <div className="w-56 text-center text-xs">
              <p className="text-slate-600">Tanggal: {tglDisposisi}</p>
              <p className="font-bold text-slate-900 mb-14 mt-1">
                {disposisi.pemberiJabatan || 'Ketua Umum'},
              </p>
              <div className="border-b-2 border-slate-900 mx-4"></div>
              <p className="font-bold text-slate-950 mt-1">
                {disposisi.pemberiNama || 'Pimpinan Organisasi'}
              </p>
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
            Cetak Lembar Disposisi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

