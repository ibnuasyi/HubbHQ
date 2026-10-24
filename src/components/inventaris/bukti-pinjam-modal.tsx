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
import { PeminjamanRecord } from './pengembalian-dialog'

interface BuktiPinjamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  peminjaman: PeminjamanRecord | null
}

export function BuktiPinjamModal({
  open,
  onOpenChange,
  peminjaman,
}: BuktiPinjamModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!peminjaman) return null

  const handlePrint = () => {
    window.print()
  }

  const tglPinjam = new Date(peminjaman.tanggalPinjam).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const tglKembali = new Date(peminjaman.rencanaKembali).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <FileText className="w-5 h-5 text-primary" />
            Surat Bukti Peminjaman Barang (Berita Acara)
          </DialogTitle>
        </DialogHeader>

        {/* Printable Paper Area */}
        <div
          ref={printRef}
          id="berita-acara-peminjaman"
          className="p-8 bg-white text-slate-900 border rounded-lg shadow-sm font-serif print:border-none print:shadow-none print:p-0 print:m-0"
        >
          {/* Kop Surat Organisasi */}
          <div className="text-center pb-4 mb-6 border-b-2 border-slate-900">
            <h2 className="text-lg font-bold uppercase tracking-wide text-slate-950 font-sans">
              SEKRETARIAT ORGANISASI
            </h2>
            <p className="text-xs text-slate-600 font-sans uppercase tracking-wider">
              DIVISI SARANA, PRASARANA & LOGISTIK INVENTARIS
            </p>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Sistem Manajemen Inventaris & Sirkulasi Aset HubbHQ
            </p>
          </div>

          {/* Judul Dokumen */}
          <div className="text-center mb-6">
            <h3 className="text-base font-bold uppercase underline tracking-wider font-sans">
              BERITA ACARA PINJAM PAKAI INVENTARIS
            </h3>
            <p className="text-xs font-mono font-semibold text-slate-700 mt-1 font-sans">
              Nomor: {peminjaman.kodePeminjaman}
            </p>
          </div>

          <p className="text-xs leading-relaxed mb-4 text-justify">
            Pada hari ini, telah dilakukan serah terima peminjaman barang dan perlengkapan
            inventariat sekretariat dengan rincian identitas dan ketentuan sebagai berikut:
          </p>

          {/* I. Data Peminjam */}
          <div className="mb-4">
            <h4 className="text-xs font-bold font-sans uppercase text-slate-800 mb-1 border-b border-slate-200 pb-0.5">
              I. IDENTITAS PENANGGUNG JAWAB PEMINJAM
            </h4>
            <table className="w-full text-xs font-sans">
              <tbody>
                <tr>
                  <td className="w-40 py-1 text-slate-600">Nama Lengkap</td>
                  <td className="py-1 font-semibold">: {peminjaman.namaPeminjam}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">Kategori / Instansi</td>
                  <td className="py-1">
                    : {peminjaman.peminjamType === 'ANGGOTA' ? 'Internal Anggota' : 'Eksternal'}
                    {peminjaman.instansiPeminjam ? ` (${peminjaman.instansiPeminjam})` : ''}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">Nomor Kontak (WA)</td>
                  <td className="py-1">: {peminjaman.kontakPeminjam}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">Keperluan Pemakaian</td>
                  <td className="py-1 font-medium">: {peminjaman.keperluan}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* II. Rincian Barang */}
          <div className="mb-4">
            <h4 className="text-xs font-bold font-sans uppercase text-slate-800 mb-1 border-b border-slate-200 pb-0.5">
              II. RINCIAN BARANG YANG DIPINJAM
            </h4>
            <table className="w-full text-xs border border-slate-300 font-sans mt-2">
              <thead className="bg-slate-100 text-slate-800">
                <tr>
                  <th className="border border-slate-300 px-2 py-1.5 text-center w-10">No</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left">Kode Barang</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left">Nama Barang / Aset</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-center">Jumlah</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-center">Kondisi Awal</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left">Lokasi Simpan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-2 py-2 text-center">1</td>
                  <td className="border border-slate-300 px-2 py-2 font-mono font-medium">
                    {peminjaman.barang.kodeBarang}
                  </td>
                  <td className="border border-slate-300 px-2 py-2 font-semibold">
                    {peminjaman.barang.namaBarang}
                  </td>
                  <td className="border border-slate-300 px-2 py-2 text-center font-bold">
                    {peminjaman.jumlah} {peminjaman.barang.satuan}
                  </td>
                  <td className="border border-slate-300 px-2 py-2 text-center text-emerald-700 font-medium">
                    {peminjaman.kondisiPinjam}
                  </td>
                  <td className="border border-slate-300 px-2 py-2 text-slate-600">
                    {peminjaman.barang.lokasiPenyimpanan}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* III. Masa Pinjam */}
          <div className="mb-4">
            <h4 className="text-xs font-bold font-sans uppercase text-slate-800 mb-1 border-b border-slate-200 pb-0.5">
              III. JANGKA WAKTU PEMINJAMAN
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs font-sans mt-1 p-2 bg-slate-50 border border-slate-200 rounded">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Tanggal Serah Terima:</span>
                <span className="font-semibold text-slate-900">{tglPinjam}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Wajib Dikembalikan Pada:</span>
                <span className="font-semibold text-slate-900">{tglKembali}</span>
              </div>
            </div>
          </div>

          {/* IV. Ketentuan */}
          <div className="mb-8">
            <h4 className="text-xs font-bold font-sans uppercase text-slate-800 mb-1 border-b border-slate-200 pb-0.5">
              IV. KETENTUAN DAN TANGGUNG JAWAB
            </h4>
            <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1 mt-1 leading-normal">
              <li>Peminjam bertanggung jawab penuh atas kebersihan, fungsi, dan kelengkapan peralatan selama masa pinjam.</li>
              <li>Peralatan hanya digunakan untuk keperluan organisasi/kegiatan yang tercantum di atas dan dilarang dipindahtangankan ke pihak ketiga tanpa izin petugas.</li>
              <li>Segala bentuk kehilangan atau kerusakan fatal akibat kelalaian pemakaian menjadi tanggung jawab pihak peminjam untuk mengganti dengan spesifikasi yang setara.</li>
              <li>Barang wajib dikembalikan tepat waktu kepada petugas sekretariat sesuai jadwal yang telah disepakati.</li>
            </ol>
          </div>

          {/* Kolom Tanda Tangan */}
          <div className="grid grid-cols-2 gap-8 text-xs font-sans text-center pt-2">
            <div>
              <p className="text-slate-600 mb-16">Pihak Peminjam (Penerima),</p>
              <div className="border-b border-slate-900 mx-8"></div>
              <p className="font-bold text-slate-900 mt-1">{peminjaman.namaPeminjam}</p>
              <p className="text-[10px] text-slate-500">{peminjaman.instansiPeminjam || 'Peminjam'}</p>
            </div>

            <div>
              <p className="text-slate-600 mb-16">Petugas Sekretariat / Logistik,</p>
              <div className="border-b border-slate-900 mx-8"></div>
              <p className="font-bold text-slate-900 mt-1">Petugas Inventaris BPH</p>
              <p className="text-[10px] text-slate-500">Divisi Sarana & Prasarana</p>
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
            Cetak Berita Acara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

