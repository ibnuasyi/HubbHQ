"use client";

import { useState, useEffect } from "react";
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
  Users,
  HeartHandshake,
  Plus,
  Search,
  Briefcase,
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  Linkedin,
  Edit2,
  Trash2,
  Coins,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { AlumniDialog } from "@/components/alumni/alumni-dialog";
import { DonasiDialog } from "@/components/alumni/donasi-dialog";

export default function DashboardAlumniPage() {
  const [activeTab, setActiveTab] = useState<"direktori" | "donasi">("direktori");
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [donasiList, setDonasiList] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalAlumni: 0,
    kontributorAktif: 0,
    totalDanaAbadi: 0,
    totalTransaksiDonasi: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [editingAlumni, setEditingAlumni] = useState<any>(null);
  const [isAlumniModalOpen, setIsAlumniModalOpen] = useState(false);
  const [isDonasiModalOpen, setIsDonasiModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAlumni, resDonasi, resStats] = await Promise.all([
        fetch(`/api/alumni${search ? `?search=${search}` : ""}`),
        fetch("/api/alumni/donasi"),
        fetch("/api/alumni/statistik"),
      ]);

      const [dataAlumni, dataDonasi, dataStats] = await Promise.all([
        resAlumni.json(),
        resDonasi.json(),
        resStats.json(),
      ]);

      if (resAlumni.ok) setAlumniList(dataAlumni.data || []);
      if (resDonasi.ok) setDonasiList(dataDonasi.data || []);
      if (resStats.ok) setStats(dataStats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/alumni?search=${search}`)
      .then((res) => res.json())
      .then((json) => setAlumniList(json.data || []));
  };

  const handleDeleteAlumni = async (id: string) => {
    if (!confirm("Hapus data alumni ini?")) return;
    try {
      const res = await fetch(`/api/alumni/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      alert("Gagal menghapus");
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getProgramBadge = (program: string) => {
    switch (program) {
      case "DANA_ABADI":
        return <Badge className="bg-purple-600">Dana Abadi</Badge>;
      case "BEASISWA_KADER":
        return <Badge className="bg-blue-600">Beasiswa Kader</Badge>;
      case "RENOVASI_SEKRETARIAT":
        return <Badge className="bg-amber-600">Renovasi Sekretariat</Badge>;
      case "TANGGAP_BENCANA":
        return <Badge className="bg-red-600">Tanggap Bencana</Badge>;
      default:
        return <Badge variant="outline">{program}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Jejaring Alumni & Dana Abadi Organisasi
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pangkalan data alumni, sinergi karier/mentoring, serta penerimaan filantropi dana abadi.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsDonasiModalOpen(true)}>
            <HeartHandshake className="w-4 h-4 mr-2 text-rose-600" /> Catat Donasi
          </Button>
          <Button
            onClick={() => {
              setEditingAlumni(null);
              setIsAlumniModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Alumni
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total Alumni Terdata</p>
            <p className="text-2xl font-bold">{stats.totalAlumni}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Donatur / Kontributor Aktif</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.kontributorAktif}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <HeartHandshake className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total Dana Abadi Terkumpul</p>
            <p className="text-xl font-bold text-purple-600">
              {formatRupiah(stats.totalDanaAbadi)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600">
            <Coins className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total Transaksi Masuk</p>
            <p className="text-2xl font-bold">{stats.totalTransaksiDonasi}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-4">
        <button
          onClick={() => setActiveTab("direktori")}
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "direktori"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Direktori Profil Alumni ({alumniList.length})
        </button>
        <button
          onClick={() => setActiveTab("donasi")}
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "donasi"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Riwayat Dana Abadi & Filantropi ({donasiList.length})
        </button>
      </div>

      {/* TAB 1: DIREKTORI ALUMNI */}
      {activeTab === "direktori" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama alumni, instansi, domisili, atau jabatan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit">Cari Alumni</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alumniList.length === 0 ? (
              <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
                Belum ada data alumni yang dicatat.
              </div>
            ) : (
              alumniList.map((a) => (
                <Card key={a.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">
                        Angkatan {a.angkatanMasuk} - Lulus {a.tahunLulus}
                      </span>
                      {a.isKontributorAktif && (
                        <Badge className="bg-emerald-600 text-[10px]">Kontributor Aktif</Badge>
                      )}
                    </div>
                    <CardTitle className="text-base">{a.nama}</CardTitle>
                    {a.jabatanTerakhir && (
                      <p className="text-xs text-primary font-medium">{a.jabatanTerakhir}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {(a.profesi || a.instansiBekerja) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-1">
                          {a.profesi ? `${a.profesi}` : ""}{" "}
                          {a.instansiBekerja ? `di ${a.instansiBekerja}` : ""}
                        </span>
                      </div>
                    )}
                    {a.domisili && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{a.domisili}</span>
                      </div>
                    )}
                    {a.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{a.phone}</span>
                      </div>
                    )}
                    {a.bio && (
                      <p className="text-muted-foreground italic line-clamp-2 pt-1 border-t">
                        "{a.bio}"
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-1 pt-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setEditingAlumni(a);
                          setIsAlumniModalOpen(true);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Ubah
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteAlumni(a.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT DANA ABADI */}
      {activeTab === "donasi" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="w-4 h-4" /> Mutasi Penerimaan Filantropi Alumni
            </CardTitle>
            <CardDescription>
              Rekapitulasi penerimaan donasi program Dana Abadi, beasiswa kader, atau renovasi sekretariat.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {donasiList.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Belum ada donasi yang dicatat.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {donasiList.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getProgramBadge(d.programDonasi)}
                        <Badge variant="outline">{d.metodeBayar}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(d.tanggalBayar).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="font-semibold text-base">{d.namaDonatur}</p>
                      {d.pesanAlumni && (
                        <p className="text-xs text-muted-foreground italic">
                          "{d.pesanAlumni}"
                        </p>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-emerald-600">
                        +{formatRupiah(Number(d.nominal))}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        Ref: {d.referensiBayar || "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog Modals */}
      <AlumniDialog
        isOpen={isAlumniModalOpen}
        onClose={() => setIsAlumniModalOpen(false)}
        onSuccess={fetchData}
        editingAlumni={editingAlumni}
      />

      <DonasiDialog
        isOpen={isDonasiModalOpen}
        onClose={() => setIsDonasiModalOpen(false)}
        onSuccess={fetchData}
        alumniList={alumniList}
      />
    </div>
  );
}

