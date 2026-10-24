'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Package,
  Plus,
  ArrowRightLeft,
  Search,
  Filter,
  QrCode,
  Printer,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Boxes,
  Layers,
  FileText,
  DollarSign,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarangDialog,
  InventarisItem,
} from '@/components/inventaris/barang-dialog'
import { QrLabelModal } from '@/components/inventaris/qr-label-modal'
import { PeminjamanDialog } from '@/components/inventaris/peminjaman-dialog'
import {
  PengembalianDialog,
  PeminjamanRecord,
} from '@/components/inventaris/pengembalian-dialog'
import { BuktiPinjamModal } from '@/components/inventaris/bukti-pinjam-modal'
import QRCode from 'qrcode'

export default function InventarisPage() {
  // Data states
  const [items, setItems] = useState<InventarisItem[]>([])
  const [stats, setStats] = useState({
    totalJenisBarang: 0,
    totalUnit: 0,
    totalTersedia: 0,
    totalDipinjam: 0,
    totalRusak: 0,
    totalNilaiAset: 0,
  })
  const [loans, setLoans] = useState<PeminjamanRecord[]>([])
  const [loanStats, setLoanStats] = useState({
    total: 0,
    dipinjam: 0,
    terlambat: 0,
    dikembalikan: 0,
    hilangRusak: 0,
  })
  const [loading, setLoading] = useState(true)

  // Filters
  const [activeTab, setActiveTab] = useState('katalog')
  const [searchItem, setSearchItem] = useState('')
  const [filterKategori, setFilterKategori] = useState('ALL')
  const [filterKondisi, setFilterKondisi] = useState('ALL')
  const [filterStatusStok, setFilterStatusStok] = useState('ALL')

  const [searchLoan, setSearchLoan] = useState('')
  const [filterLoanStatus, setFilterLoanStatus] = useState('ALL')

  // Modals state
  const [openBarangDialog, setOpenBarangDialog] = useState(false)
  const [selectedBarangEdit, setSelectedBarangEdit] =
    useState<InventarisItem | null>(null)

  const [openQrModal, setOpenQrModal] = useState(false)
  const [selectedBarangQr, setSelectedBarangQr] =
    useState<InventarisItem | null>(null)

  const [openPinjamDialog, setOpenPinjamDialog] = useState(false)
  const [selectedBarangPinjam, setSelectedBarangPinjam] =
    useState<InventarisItem | null>(null)

  const [openKembaliDialog, setOpenKembaliDialog] = useState(false)
  const [selectedLoanKembali, setSelectedLoanKembali] =
    useState<PeminjamanRecord | null>(null)

  const [openBuktiModal, setOpenBuktiModal] = useState(false)
  const [selectedLoanBukti, setSelectedLoanBukti] =
    useState<PeminjamanRecord | null>(null)

  // Sheet print QR state
  const [sheetQrs, setSheetQrs] = useState<{ [key: string]: string }>({})
  const [generatingSheetQr, setGeneratingSheetQr] = useState(false)

  useEffect(() => {
    fetchItems()
    fetchLoans()
  }, [])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/inventaris')
      const json = await res.json()
      if (json.success) {
        setItems(json.data)
        if (json.stats) setStats(json.stats)
      }
    } catch (err) {
      console.error('Error fetching inventaris items:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLoans = async () => {
    try {
      const res = await fetch('/api/inventaris/peminjaman')
      const json = await res.json()
      if (json.success) {
        setLoans(json.data)
        if (json.stats) setLoanStats(json.stats)
      }
    } catch (err) {
      console.error('Error fetching loans:', err)
    }
  }

  const handleDeleteItem = async (id: string, nama: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus "${nama}" dari daftar inventaris?`
      )
    )
      return

    try {
      const res = await fetch(`/api/inventaris/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus')
      fetchItems()
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus barang')
    }
  }

  // Pre-generate QR codes for Mass Sheet Sticker Print tab
  useEffect(() => {
    if (activeTab === 'stiker' && items.length > 0) {
      setGeneratingSheetQr(true)
      const promises = items.map((it) => {
        const url = `${window.location.origin}/inventaris/${encodeURIComponent(
          it.kodeBarang
        )}`
        return QRCode.toDataURL(url, {
          width: 140,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        }).then((dataUrl) => ({ id: it.id, dataUrl }))
      })

      Promise.all(promises)
        .then((results) => {
          const map: { [key: string]: string } = {}
          results.forEach((r) => {
            map[r.id] = r.dataUrl
          })
          setSheetQrs(map)
        })
        .finally(() => setGeneratingSheetQr(false))
    }
  }, [activeTab, items])

  // Filtered items
  const filteredItems = items.filter((it) => {
    const matchSearch =
      !searchItem ||
      it.namaBarang.toLowerCase().includes(searchItem.toLowerCase()) ||
      it.kodeBarang.toLowerCase().includes(searchItem.toLowerCase()) ||
      (it.merkModel &&
        it.merkModel.toLowerCase().includes(searchItem.toLowerCase())) ||
      it.lokasiPenyimpanan.toLowerCase().includes(searchItem.toLowerCase())

    const matchKat = filterKategori === 'ALL' || it.kategori === filterKategori
    const matchKondisi =
      filterKondisi === 'ALL' || it.kondisi === filterKondisi
    const matchStok =
      filterStatusStok === 'ALL' ||
      (filterStatusStok === 'TERSEDIA' && it.jumlahTersedia > 0) ||
      (filterStatusStok === 'DIPINJAM' && it.jumlahDipinjam > 0) ||
      (filterStatusStok === 'RUSAK' && it.jumlahRusak > 0)

    return matchSearch && matchKat && matchKondisi && matchStok
  })

  // Filtered loans
  const filteredLoans = loans.filter((l) => {
    const matchSearch =
      !searchLoan ||
      l.kodePeminjaman.toLowerCase().includes(searchLoan.toLowerCase()) ||
      l.namaPeminjam.toLowerCase().includes(searchLoan.toLowerCase()) ||
      l.barang.namaBarang.toLowerCase().includes(searchLoan.toLowerCase()) ||
      (l.instansiPeminjam &&
        l.instansiPeminjam.toLowerCase().includes(searchLoan.toLowerCase()))

    const matchStatus =
      filterLoanStatus === 'ALL' || l.status === filterLoanStatus

    return matchSearch && matchStatus
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Boxes className="w-7 h-7 text-primary" />
            Inventaris & Sirkulasi Aset
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manajemen logistik peralatan sekretariat, pelabelan QR code fisik,
            serta sirkulasi peminjaman barang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchItems()
              fetchLoans()
            }}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Muat Ulang
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedBarangPinjam(null)
              setOpenPinjamDialog(true)
            }}
          >
            <ArrowRightLeft className="w-4 h-4 mr-1.5" />
            Catat Peminjaman
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setSelectedBarangEdit(null)
              setOpenBarangDialog(true)
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Barang
          </Button>
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-card border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Package className="w-4 h-4 text-blue-500" />
            Jenis Aset
          </div>
          <div className="text-2xl font-black mt-1">
            {stats.totalJenisBarang}
          </div>
          <div className="text-[11px] text-muted-foreground">Kategori barang</div>
        </div>

        <div className="p-3.5 bg-card border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-indigo-500" />
            Total Unit
          </div>
          <div className="text-2xl font-black mt-1">{stats.totalUnit}</div>
          <div className="text-[11px] text-muted-foreground">Seluruh barang</div>
        </div>

        <div className="p-3.5 bg-card border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Tersedia
          </div>
          <div className="text-2xl font-black mt-1 text-emerald-700 dark:text-emerald-400">
            {stats.totalTersedia}
          </div>
          <div className="text-[11px] text-muted-foreground">Siap dipinjam</div>
        </div>

        <div className="p-3.5 bg-card border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
            <ArrowRightLeft className="w-4 h-4" />
            Dipinjam
          </div>
          <div className="text-2xl font-black mt-1 text-sky-700 dark:text-sky-400">
            {stats.totalDipinjam}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {loanStats.terlambat > 0 && (
              <span className="text-red-600 font-bold">
                ({loanStats.terlambat} Terlambat)
              </span>
            )}
            {loanStats.terlambat === 0 && 'Sedang di luar'}
          </div>
        </div>

        <div className="p-3.5 bg-card border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Rusak / Hilang
          </div>
          <div className="text-2xl font-black mt-1 text-rose-700 dark:text-rose-400">
            {stats.totalRusak}
          </div>
          <div className="text-[11px] text-muted-foreground">Perlu tindakan</div>
        </div>

        <div className="p-3.5 bg-card border rounded-xl shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-amber-500" />
            Nilai Aset
          </div>
          <div className="text-lg font-black mt-1 truncate" title={`Rp ${stats.totalNilaiAset.toLocaleString('id-ID')}`}>
            Rp {stats.totalNilaiAset > 1000000 ? `${(stats.totalNilaiAset / 1000000).toFixed(1)}Jt` : stats.totalNilaiAset.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-muted-foreground">Estimasi total</div>
        </div>
      </div>

      {/* Tabs Menu */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 max-w-lg">
          <TabsTrigger value="katalog" className="gap-2">
            <Package className="w-4 h-4" />
            Katalog Barang ({items.length})
          </TabsTrigger>
          <TabsTrigger value="peminjaman" className="gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Peminjaman ({loans.length})
          </TabsTrigger>
          <TabsTrigger value="stiker" className="gap-2">
            <Printer className="w-4 h-4" />
            Lembar Stiker QR
          </TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: KATALOG BARANG ==================== */}
        <TabsContent value="katalog" className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card p-3 rounded-lg border">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, kode, merk, lokasi..."
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Select value={filterKategori} onValueChange={setFilterKategori}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kategori</SelectItem>
                  <SelectItem value="Elektronik & Multimedia">Elektronik & Multimedia</SelectItem>
                  <SelectItem value="Perlengkapan Lapangan & Logistik">Perlengkapan Lapangan</SelectItem>
                  <SelectItem value="ATK & Kesekretariatan">ATK & Sekretariat</SelectItem>
                  <SelectItem value="Dokumentasi & Media">Dokumentasi</SelectItem>
                  <SelectItem value="Properti & Perlengkapan Acara">Properti & Acara</SelectItem>
                  <SelectItem value="Fasilitas & Ruangan">Fasilitas & Ruangan</SelectItem>
                  <SelectItem value="Aset Umum Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterKondisi} onValueChange={setFilterKondisi}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Kondisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kondisi</SelectItem>
                  <SelectItem value="BAIK">Kondisi Baik</SelectItem>
                  <SelectItem value="PERLU_PERBAIKAN">Perlu Perbaikan</SelectItem>
                  <SelectItem value="RUSAK_BERAT">Rusak Berat</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatusStok} onValueChange={setFilterStatusStok}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Status Stok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Ketersediaan</SelectItem>
                  <SelectItem value="TERSEDIA">Stok Tersedia</SelectItem>
                  <SelectItem value="DIPINJAM">Sedang Dipinjam</SelectItem>
                  <SelectItem value="RUSAK">Ada Kerusakan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabel Katalog */}
          <div className="bg-card border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Barang & Kode</th>
                    <th className="px-4 py-3 text-left">Kategori & Lokasi</th>
                    <th className="px-4 py-3 text-center">Status Stok</th>
                    <th className="px-4 py-3 text-center">Kondisi</th>
                    <th className="px-4 py-3 text-right">Nilai Aset</th>
                    <th className="px-4 py-3 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Memuat data inventaris...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        Tidak ada barang inventaris yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((it) => (
                      <tr key={it.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {it.fotoBarang ? (
                              <img
                                src={it.fotoBarang}
                                alt={it.namaBarang}
                                className="w-10 h-10 rounded-md object-cover border border-border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                <Package className="w-5 h-5 opacity-40" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-foreground hover:underline cursor-pointer"
                                onClick={() => {
                                  setSelectedBarangQr(it)
                                  setOpenQrModal(true)
                                }}
                              >
                                {it.namaBarang}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  {it.kodeBarang}
                                </span>
                                {it.merkModel && (
                                  <span className="text-xs text-muted-foreground">
                                    {it.merkModel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-foreground">{it.kategori}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <span>Lokasi:</span>
                            <span className="font-medium text-foreground">{it.lokasiPenyimpanan}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-sm">
                              {it.jumlahTersedia}{' '}
                              <span className="text-xs text-muted-foreground font-normal">
                                / {it.jumlahTotal} {it.satuan}
                              </span>
                            </span>
                            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                              {it.jumlahTersedia > 0 ? (
                                <span className="text-emerald-600 font-medium">Tersedia</span>
                              ) : (
                                <span className="text-rose-600 font-medium">Habis Dipinjam</span>
                              )}
                              {it.jumlahDipinjam > 0 && (
                                <span className="text-sky-600">({it.jumlahDipinjam} Dipinjam)</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          {it.kondisi === 'BAIK' && (
                            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
                              Baik
                            </Badge>
                          )}
                          {it.kondisi === 'PERLU_PERBAIKAN' && (
                            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">
                              Perbaikan
                            </Badge>
                          )}
                          {it.kondisi === 'RUSAK_BERAT' && (
                            <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-200">
                              Rusak
                            </Badge>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="font-medium text-xs">
                            {it.hargaBeli
                              ? `Rp ${Number(it.hargaBeli).toLocaleString('id-ID')}`
                              : '-'}
                          </div>
                          {it.asalPengadaan && (
                            <div className="text-[10px] text-muted-foreground truncate max-w-[120px] ml-auto">
                              {it.asalPengadaan}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Pinjamkan Barang"
                              disabled={it.jumlahTersedia <= 0}
                              onClick={() => {
                                setSelectedBarangPinjam(it)
                                setOpenPinjamDialog(true)
                              }}
                            >
                              <ArrowRightLeft className="w-4 h-4 text-sky-600" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Label QR Fisik"
                              onClick={() => {
                                setSelectedBarangQr(it)
                                setOpenQrModal(true)
                              }}
                            >
                              <QrCode className="w-4 h-4 text-primary" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Ubah Data"
                              onClick={() => {
                                setSelectedBarangEdit(it)
                                setOpenBarangDialog(true)
                              }}
                            >
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Hapus"
                              onClick={() => handleDeleteItem(it.id, it.namaBarang)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 2: PEMINJAMAN & SIRKULASI ==================== */}
        <TabsContent value="peminjaman" className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card p-3 rounded-lg border">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari peminjam, kode, barang..."
                value={searchLoan}
                onChange={(e) => setSearchLoan(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={filterLoanStatus} onValueChange={setFilterLoanStatus}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Status Peminjaman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="DIPINJAM">Sedang Dipinjam</SelectItem>
                  <SelectItem value="TERLAMBAT">Terlambat Kembali</SelectItem>
                  <SelectItem value="DIKEMBALIKAN">Selesai (Kembali)</SelectItem>
                  <SelectItem value="HILANG_RUSAK">Hilang / Rusak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabel Peminjaman */}
          <div className="bg-card border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Kode & Peminjam</th>
                    <th className="px-4 py-3 text-left">Barang Inventaris</th>
                    <th className="px-4 py-3 text-left">Jadwal Pinjam</th>
                    <th className="px-4 py-3 text-left">Keperluan</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        Belum ada catatan transaksi peminjaman.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan) => {
                      const isOverdue =
                        loan.status === 'TERLAMBAT' ||
                        (loan.status === 'DIPINJAM' &&
                          new Date(loan.rencanaKembali) < new Date())

                      return (
                        <tr key={loan.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-mono text-xs font-bold text-primary">
                              {loan.kodePeminjaman}
                            </div>
                            <div className="font-semibold text-sm text-foreground mt-0.5">
                              {loan.namaPeminjam}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {loan.instansiPeminjam || 'Internal'} - {loan.kontakPeminjam}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">
                              {loan.barang.namaBarang}
                            </div>
                            <div className="text-xs font-mono text-muted-foreground">
                              {loan.barang.kodeBarang} ({loan.jumlah} {loan.barang.satuan})
                            </div>
                          </td>

                          <td className="px-4 py-3 text-xs">
                            <div>
                              <span className="text-muted-foreground">Pinjam: </span>
                              <span className="font-medium">
                                {new Date(loan.tanggalPinjam).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                            <div className="mt-0.5">
                              <span className="text-muted-foreground">Batas: </span>
                              <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                                {new Date(loan.rencanaKembali).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                            {loan.tanggalKembali && (
                              <div className="text-emerald-600 mt-0.5">
                                <span>Kembali: </span>
                                <span>{new Date(loan.tanggalKembali).toLocaleDateString('id-ID')}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 text-xs max-w-xs truncate" title={loan.keperluan}>
                            {loan.keperluan}
                          </td>

                          <td className="px-4 py-3 text-center">
                            {loan.status === 'DIPINJAM' && !isOverdue && (
                              <Badge className="bg-sky-100 text-sky-800 border-sky-300">
                                Sedang Dipinjam
                              </Badge>
                            )}
                            {isOverdue && loan.status !== 'DIKEMBALIKAN' && (
                              <Badge className="bg-red-100 text-red-800 border-red-300 animate-pulse">
                                Terlambat
                              </Badge>
                            )}
                            {loan.status === 'DIKEMBALIKAN' && (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                                Sudah Kembali
                              </Badge>
                            )}
                            {loan.status === 'HILANG_RUSAK' && (
                              <Badge className="bg-rose-100 text-rose-800 border-rose-300">
                                Hilang / Rusak
                              </Badge>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {loan.status !== 'DIKEMBALIKAN' && loan.status !== 'HILANG_RUSAK' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                  onClick={() => {
                                    setSelectedLoanKembali(loan)
                                    setOpenKembaliDialog(true)
                                  }}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Kembali
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Cetak Berita Acara Pinjam"
                                onClick={() => {
                                  setSelectedLoanBukti(loan)
                                  setOpenBuktiModal(true)
                                }}
                              >
                                <FileText className="w-4 h-4 text-slate-700" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 3: LEMBAR STIKER QR MASSAL ==================== */}
        <TabsContent value="stiker" className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                Lembar Stiker Label QR Fisik Inventaris
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cetak seluruh stiker QR sekaligus ke kertas stiker / label (ukuran A4
                grid).
              </p>
            </div>

            <Button onClick={() => window.print()} disabled={generatingSheetQr}>
              <Printer className="w-4 h-4 mr-2" />
              Cetak Lembar Stiker
            </Button>
          </div>

          {/* Grid Stiker Label */}
          <div
            id="inventaris-sheet-container"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3 p-4 bg-muted/20 border rounded-xl"
          >
            {items.map((it) => (
              <div
                key={it.id}
                className="p-3 bg-white text-slate-900 border-2 border-slate-800 rounded-lg shadow-xs flex items-center gap-3 break-inside-avoid"
              >
                <div className="w-20 h-20 flex-shrink-0 bg-white p-0.5 border border-slate-200 rounded flex items-center justify-center">
                  {sheetQrs[it.id] ? (
                    <img
                      src={sheetQrs[it.id]}
                      alt={it.kodeBarang}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                    HUBBHQ INVENTARIS
                  </div>
                  <div className="font-mono font-black text-xs text-slate-950 truncate">
                    {it.kodeBarang}
                  </div>
                  <div className="font-bold text-xs text-slate-900 truncate mt-0.5">
                    {it.namaBarang}
                  </div>
                  <div className="text-[10px] text-slate-600 truncate mt-0.5">
                    Lokasi: {it.lokasiPenyimpanan}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Modals */}
      <BarangDialog
        open={openBarangDialog}
        onOpenChange={setOpenBarangDialog}
        item={selectedBarangEdit}
        onSuccess={() => {
          fetchItems()
        }}
      />

      <QrLabelModal
        open={openQrModal}
        onOpenChange={setOpenQrModal}
        item={selectedBarangQr}
      />

      <PeminjamanDialog
        open={openPinjamDialog}
        onOpenChange={setOpenPinjamDialog}
        item={selectedBarangPinjam}
        itemList={items}
        onSuccess={() => {
          fetchItems()
          fetchLoans()
        }}
      />

      <PengembalianDialog
        open={openKembaliDialog}
        onOpenChange={setOpenKembaliDialog}
        peminjaman={selectedLoanKembali}
        onSuccess={() => {
          fetchItems()
          fetchLoans()
        }}
      />

      <BuktiPinjamModal
        open={openBuktiModal}
        onOpenChange={setOpenBuktiModal}
        peminjaman={selectedLoanBukti}
      />
    </div>
  )
}

