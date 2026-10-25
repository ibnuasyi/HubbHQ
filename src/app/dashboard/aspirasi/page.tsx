"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Building2,
  GraduationCap,
  Scale,
} from "lucide-react";

export default function DashboardAspirasiPage() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    TOTAL: 0,
    MENUNGGU: 0,
    DIVERIFIKASI: 0,
    DALAM_ADVOKASI: 0,
    SELESAI: 0,
    DITOLAK: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [kategoriFilter, setKategoriFilter] = useState("ALL");
  const [urgensiFilter, setUrgensiFilter] = useState("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (statusFilter !== "ALL") query.set("status", statusFilter);
      if (kategoriFilter !== "ALL") query.set("kategori", kategoriFilter);
      if (urgensiFilter !== "ALL") query.set("urgensi", urgensiFilter);

      const res = await fetch(`/api/aspirasi?${query.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setData(json.data || []);
        if (json.stats) setStats(json.stats);
      }
    } catch (err) {
      console.error("Error fetching aspirasi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, kategoriFilter, urgensiFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MENUNGGU":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Menunggu</Badge>;
      case "DIVERIFIKASI":
        return <Badge className="bg-blue-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Diverifikasi</Badge>;
      case "DALAM_ADVOKASI":
        return <Badge className="bg-amber-600"><AlertTriangle className="w-3 h-3 mr-1" /> Dalam Advokasi</Badge>;
      case "SELESAI":
        return <Badge className="bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Selesai</Badge>;
      case "DITOLAK":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgensiBadge = (urgensi: string) => {
    switch (urgensi) {
      case "DARURAT":
        return <Badge variant="destructive">Darurat</Badge>;
      case "TINGGI":
        return <Badge className="bg-orange-500">Tinggi</Badge>;
      case "SEDANG":
        return <Badge variant="outline">Sedang</Badge>;
      default:
        return <Badge variant="secondary">Rendah</Badge>;
    }
  };

  const getKategoriIcon = (kategori: string) => {
    switch (kategori) {
      case "FASILITAS":
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case "AKADEMIK_UKT":
        return <GraduationCap className="w-4 h-4 text-emerald-500" />;
      case "KEBIJAKAN":
        return <Scale className="w-4 h-4 text-purple-500" />;
      case "KEAMANAN_PERUNDUNGAN":
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Kotak Aspirasi & Meja Advokasi
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pengaduan fasilitas, advokasi kebijakan, dan aspirasi mahasiswa/warga secara terstruktur.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/aspirasi" target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" /> Buka Portal Publik
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Aduan</p>
          <p className="text-2xl font-bold">{stats.TOTAL}</p>
        </Card>
        <Card className="p-3 border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20">
          <p className="text-xs text-amber-700 dark:text-amber-400">Menunggu</p>
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">{stats.MENUNGGU}</p>
        </Card>
        <Card className="p-3 border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20">
          <p className="text-xs text-blue-700 dark:text-blue-400">Diverifikasi</p>
          <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{stats.DIVERIFIKASI}</p>
        </Card>
        <Card className="p-3 border-purple-200 dark:border-purple-900 bg-purple-50/30 dark:bg-purple-950/20">
          <p className="text-xs text-purple-700 dark:text-purple-400">Dalam Advokasi</p>
          <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{stats.DALAM_ADVOKASI}</p>
        </Card>
        <Card className="p-3 border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20">
          <p className="text-xs text-emerald-700 dark:text-emerald-400">Selesai</p>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{stats.SELESAI}</p>
        </Card>
        <Card className="p-3 border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20">
          <p className="text-xs text-red-700 dark:text-red-400">Ditolak</p>
          <p className="text-2xl font-bold text-red-800 dark:text-red-300">{stats.DITOLAK}</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Cari kode tiket / judul..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="MENUNGGU">Menunggu</SelectItem>
                <SelectItem value="DIVERIFIKASI">Diverifikasi</SelectItem>
                <SelectItem value="DALAM_ADVOKASI">Dalam Advokasi</SelectItem>
                <SelectItem value="SELESAI">Selesai</SelectItem>
                <SelectItem value="DITOLAK">Ditolak</SelectItem>
              </SelectContent>
            </Select>

            <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Kategori</SelectItem>
                <SelectItem value="FASILITAS">Fasilitas</SelectItem>
                <SelectItem value="AKADEMIK_UKT">Akademik & UKT</SelectItem>
                <SelectItem value="KEBIJAKAN">Kebijakan</SelectItem>
                <SelectItem value="KEAMANAN_PERUNDUNGAN">Keamanan & Perundungan</SelectItem>
                <SelectItem value="SARAN_UMUM">Saran Umum</SelectItem>
              </SelectContent>
            </Select>

            <Select value={urgensiFilter} onValueChange={setUrgensiFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Urgensi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Urgensi</SelectItem>
                <SelectItem value="DARURAT">Darurat</SelectItem>
                <SelectItem value="TINGGI">Tinggi</SelectItem>
                <SelectItem value="SEDANG">Sedang</SelectItem>
                <SelectItem value="RENDAH">Rendah</SelectItem>
              </SelectContent>
            </Select>
          </form>
        </CardContent>
      </Card>

      {/* List Aspirasi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Pengaduan Masuk</CardTitle>
          <CardDescription>
            Klik pada salah satu baris untuk membuka meja tindak lanjut, memperbarui status, atau membalas aduan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Memuat data aspirasi...
            </div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Tidak ada aduan yang sesuai dengan kriteria filter.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/aspirasi/${item.id}`}
                  className="block p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary">
                          {item.kodeTiket}
                        </span>
                        {getStatusBadge(item.status)}
                        {getUrgensiBadge(item.urgensi)}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getKategoriIcon(item.kategori)}
                          {item.kategori.replace("_", " ")}
                        </span>
                      </div>
                      <p className="font-semibold text-base">{item.judul}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.isi}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground text-left sm:text-right shrink-0 space-y-1">
                      <p>
                        Pelapor:{" "}
                        <span className="font-medium text-foreground">
                          {item.isAnonim ? "Anonim" : item.namaPelapor || "Terbuka"}
                        </span>
                      </p>
                      <p>
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      {item._count?.tanggapan > 0 && (
                        <span className="inline-flex items-center text-primary font-medium">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {item._count.tanggapan} tanggapan
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

