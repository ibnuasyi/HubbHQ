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
  GraduationCap,
  Plus,
  Search,
  Award,
  Users,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import { BatchDialog } from "@/components/kaderisasi/batch-dialog";
import { SttppModal } from "@/components/kaderisasi/sttpp-modal";

export default function DashboardKaderisasiPage() {
  const [activeTab, setActiveTab] = useState<"batch" | "buku-induk" | "jenjang">("batch");
  const [jenjangList, setJenjangList] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [bukuInduk, setBukuInduk] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [selectedSttpp, setSelectedSttpp] = useState<{ peserta: any; batch: any } | null>(null);

  // Search buku induk
  const [searchKader, setSearchKader] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resJenjang, resBatches, resBuku] = await Promise.all([
        fetch("/api/kaderisasi/jenjang"),
        fetch("/api/kaderisasi/batch"),
        fetch(`/api/kaderisasi/buku-induk${searchKader ? `?search=${searchKader}` : ""}`),
      ]);
      const [dataJenjang, dataBatches, dataBuku] = await Promise.all([
        resJenjang.json(),
        resBatches.json(),
        resBuku.json(),
      ]);

      if (resJenjang.ok) setJenjangList(dataJenjang.data || []);
      if (resBatches.ok) setBatches(dataBatches.data || []);
      if (resBuku.ok) setBukuInduk(dataBuku.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearchBuku = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/kaderisasi/buku-induk?search=${searchKader}`)
      .then((res) => res.json())
      .then((json) => setBukuInduk(json.data || []));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "PENDAFTARAN":
        return <Badge className="bg-blue-600">Pendaftaran Buka</Badge>;
      case "BERJALAN":
        return <Badge className="bg-amber-600">Sedang Berjalan</Badge>;
      case "SELESAI":
        return <Badge className="bg-emerald-600">Selesai</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pendidikan, Pelatihan & Kaderisasi Berjenjang
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola angkatan diklat/dikpol, evaluasi tiga dimensi (kognitif, afektif, psikomotorik), dan buku induk registrasi kader.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsBatchOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Buka Batch Diklat Baru
          </Button>
        </div>
      </div>

      {/* Metrics Sebaran Jenjang Kader */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {jenjangList.map((j) => (
          <Card key={j.id} className="border-l-4 border-l-primary">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Tingkat {j.urutan} ({j.singkatan})
                </p>
                <h3 className="font-bold text-lg">{j.namaJenjang}</h3>
                <p className="text-xs text-muted-foreground">
                  Syarat: {j.minBulanMenujuLanjut} bulan masa tunggu
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">{j._count?.kader || 0}</span>
                <p className="text-[11px] text-muted-foreground">Kader Terdaftar</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border space-x-4">
        <button
          onClick={() => setActiveTab("batch")}
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "batch"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Angkatan Diklat ({batches.length})
        </button>
        <button
          onClick={() => setActiveTab("buku-induk")}
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "buku-induk"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Buku Induk Perkaderan ({bukuInduk.length})
        </button>
        <button
          onClick={() => setActiveTab("jenjang")}
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "jenjang"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Konfigurasi Jenjang AD/ART
        </button>
      </div>

      {/* TAB 1: BATCH DIKLAT */}
      {activeTab === "batch" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.length === 0 ? (
            <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
              Belum ada angkatan diklat yang dibuat. Klik tombol di atas untuk membuka batch pertama.
            </div>
          ) : (
            batches.map((b) => (
              <Card key={b.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary">
                      {b.kodeBatch}
                    </span>
                    {getStatusBadge(b.status)}
                  </div>
                  <CardTitle className="text-base leading-snug">{b.namaDiklat}</CardTitle>
                  <CardDescription className="text-xs">
                    Jenjang: {b.jenjang?.namaJenjang}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {new Date(b.tanggalMulai).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      -{" "}
                      {new Date(b.tanggalSelesai).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="line-clamp-1">{b.lokasi}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t text-muted-foreground">
                    <span>Peserta Terdaftar:</span>
                    <span className="font-bold text-foreground">
                      {b._count?.peserta || 0} / {b.kuota}
                    </span>
                  </div>
                  <div className="pt-2">
                    <Link href={`/dashboard/kaderisasi/batch/${b.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Buka Meja MoT & Peserta <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 2: BUKU INDUK PERKADERAN */}
      {activeTab === "buku-induk" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSearchBuku} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama kader, NRK, nomor STTPP, atau institusi asal..."
                    value={searchKader}
                    onChange={(e) => setSearchKader(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit">Cari Buku Induk</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Buku Registrasi Pokok Kader (BRPK)
              </CardTitle>
              <CardDescription>
                Daftar kader resmi yang telah lulus pengkaderan dan mengantongi Nomor Registrasi Kader (NRK).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {bukuInduk.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Belum ada data kader yang dinyatakan lulus.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {bukuInduk.map((k) => (
                    <div
                      key={k.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded">
                            {k.nomorRegistrasiKader}
                          </span>
                          <Badge className="bg-emerald-600">
                            {k.statusKelulusan?.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Jenjang: {k.batch?.jenjang?.singkatan}
                          </span>
                        </div>
                        <p className="font-semibold text-base">{k.namaLengkap}</p>
                        <p className="text-xs text-muted-foreground">
                          Institusi: {k.instansiAsal || "-"} | NIM/NRA: {k.nraOrNim || "-"} | Nilai Akhir:{" "}
                          <span className="font-bold text-foreground">{k.nilaiAkhir}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSttpp({ peserta: k, batch: k.batch })}
                        >
                          <Award className="w-4 h-4 mr-1 text-amber-600" /> Cetak Piagam STTPP
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: KONFIGURASI JENJANG */}
      {activeTab === "jenjang" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4" /> Alur Penjenjangan Kader Sesuai AD/ART
            </CardTitle>
            <CardDescription>
              Struktur jenjang pengkaderan formal yang dijadikan gerbang kelayakan jabatan dan hak suara.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y divide-border">
              {jenjangList.map((j) => (
                <div key={j.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {j.urutan}
                      </span>
                      <h4 className="font-bold text-base">{j.namaJenjang}</h4>
                      <Badge variant="outline">{j.singkatan}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      Masa Tunggu: {j.minBulanMenujuLanjut} Bulan
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-9">{j.deskripsi}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 pl-9">
                    <span className="font-semibold">Syarat Kelulusan:</span> {j.syaratKelulusan}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <BatchDialog
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onSuccess={fetchData}
        jenjangList={jenjangList}
      />

      {selectedSttpp && (
        <SttppModal
          isOpen={Boolean(selectedSttpp)}
          onClose={() => setSelectedSttpp(null)}
          peserta={selectedSttpp.peserta}
          batch={selectedSttpp.batch}
        />
      )}
    </div>
  );
}

