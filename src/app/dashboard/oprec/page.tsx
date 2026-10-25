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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Plus,
  Users,
  Calendar,
  ExternalLink,
  ArrowRight,
  Clock,
  CheckCircle2,
  Sparkles,
  Link2,
} from "lucide-react";

export default function DashboardOprecPage() {
  const [oprecs, setOprecs] = useState<any[]>([]);
  const [prokerList, setProkerList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog Buat Oprec
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [slug, setSlug] = useState("");
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [tipeOprec, setTipeOprec] = useState("PANITIA_EVENT");
  const [programKerjaId, setProgramKerjaId] = useState("NONE");
  const [tanggalBuka, setTanggalBuka] = useState("");
  const [tanggalTutup, setTanggalTutup] = useState("");
  const [kuota, setKuota] = useState("30");
  const [divisiPilihan, setDivisiPilihan] = useState(
    "Acara, Humas & Publikasi, Kesekretariatan, Logistik & Aset, Konsumsi, Desain & Dokumentasi"
  );
  const [persyaratan, setPersyaratan] = useState(
    "1. Mahasiswa aktif\n2. Berkomitmen dan bertanggung jawab\n3. Melampirkan CV dan KTM"
  );
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resOprec, resProker] = await Promise.all([
        fetch("/api/oprec"),
        fetch("/api/proker"),
      ]);
      const [dataOprec, dataProker] = await Promise.all([
        resOprec.json(),
        resProker.json(),
      ]);

      if (resOprec.ok) setOprecs(dataOprec.data || []);
      if (resProker.ok) setProkerList(dataProker.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJudulChange = (val: string) => {
    setJudul(val);
    if (!slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  };

  const handleCreateOprec = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const divisiArray = divisiPilihan
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      const res = await fetch("/api/oprec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          judul,
          deskripsi,
          tipeOprec,
          programKerjaId: programKerjaId === "NONE" ? null : programKerjaId,
          tanggalBuka,
          tanggalTutup,
          kuota,
          divisiPilihan: divisiArray,
          persyaratan,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat oprec");
      setIsOpenModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPelamar = oprecs.reduce((acc, o) => acc + (o._count?.pendaftar || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Rekrutmen & Open Recruitment (Oprec) Terpadu
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pendaftaran calon pengurus baru dan panitia kegiatan, seleksi berkas/wawancara, serta konversi 1-klik ke anggota.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsOpenModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Buka Oprec Baru
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Agenda Oprec</p>
            <p className="text-2xl font-bold">{oprecs.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <UserPlus className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total Berkas Pendaftar</p>
            <p className="text-2xl font-bold text-primary">{totalPelamar}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Oprec Aktif Berjalan</p>
            <p className="text-2xl font-bold text-amber-600">
              {oprecs.filter((o) => o.isOpen).length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Grid Oprec Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
            Memuat agenda oprec...
          </div>
        ) : oprecs.length === 0 ? (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
            Belum ada agenda Open Recruitment yang dibuat. Klik tombol di atas untuk membuka pendaftaran pertama.
          </div>
        ) : (
          oprecs.map((o) => (
            <Card key={o.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {o.tipeOprec === "PENGURUS_BARU" ? "Pengurus Baru" : "Kepanitiaan Acara"}
                  </Badge>
                  {o.isOpen ? (
                    <Badge className="bg-emerald-600">Buka</Badge>
                  ) : (
                    <Badge variant="secondary">Tutup</Badge>
                  )}
                </div>
                <CardTitle className="text-base leading-snug">{o.judul}</CardTitle>
                {o.programKerja && (
                  <CardDescription className="text-xs text-primary font-medium">
                    Proker: {o.programKerja.title}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {new Date(o.tanggalBuka).toLocaleDateString("id-ID")} -{" "}
                    {new Date(o.tanggalTutup).toLocaleDateString("id-ID")}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t text-muted-foreground">
                  <span>Pelamar Masuk:</span>
                  <span className="font-bold text-foreground text-sm">
                    {o._count?.pendaftar || 0} Orang
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Link href={`/oprec/${o.slug}`} target="_blank" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Form Publik
                    </Button>
                  </Link>
                  <Link href={`/dashboard/oprec/${o.id}`} className="flex-1">
                    <Button size="sm" className="w-full text-xs">
                      Meja Seleksi <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog Buat Oprec Baru */}
      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Buka Agenda Open Recruitment Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOprec} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="judul">Judul Rekrutmen *</Label>
              <Input
                id="judul"
                required
                placeholder="Contoh: Open Recruitment Staff Muda BEM 2026"
                value={judul}
                onChange={(e) => handleJudulChange(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="slug">Slug URL Publik *</Label>
                <Input
                  id="slug"
                  required
                  placeholder="oprec-staff-2026"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Tipe Rekrutmen</Label>
                <Select value={tipeOprec} onValueChange={setTipeOprec}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PANITIA_EVENT">Kepanitiaan Program Kerja</SelectItem>
                    <SelectItem value="PENGURUS_BARU">Calon Pengurus / Staff Baru</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tipeOprec === "PANITIA_EVENT" && (
              <div className="space-y-1">
                <Label>Tautkan ke Program Kerja (Opsional)</Label>
                <Select value={programKerjaId} onValueChange={setProgramKerjaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Program Kerja" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Tanpa Tautan Proker</SelectItem>
                    {prokerList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="buka">Tanggal Buka *</Label>
                <Input
                  id="buka"
                  type="date"
                  required
                  value={tanggalBuka}
                  onChange={(e) => setTanggalBuka(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tutup">Tanggal Tutup *</Label>
                <Input
                  id="tutup"
                  type="date"
                  required
                  value={tanggalTutup}
                  onChange={(e) => setTanggalTutup(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="divisi">Pilihan Divisi yang Dibuka (Pisahkan Koma) *</Label>
              <Input
                id="divisi"
                required
                placeholder="Acara, Humas, Kestari, Logistik, Konsumsi, Pubdok"
                value={divisiPilihan}
                onChange={(e) => setDivisiPilihan(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Calon peserta dapat memilih Divisi 1 & Divisi 2 dari daftar ini.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="deskripsi">Deskripsi Singkat</Label>
              <Textarea
                id="deskripsi"
                rows={2}
                placeholder="Penjelasan latar belakang kegiatan atau ajakan mendaftar..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="persyaratan">Persyaratan / Kriteria Calon</Label>
              <Textarea
                id="persyaratan"
                rows={2}
                placeholder="Persyaratan pendaftaran..."
                value={persyaratan}
                onChange={(e) => setPersyaratan(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpenModal(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Buka Pendaftaran"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

