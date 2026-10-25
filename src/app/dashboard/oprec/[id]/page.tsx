"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  ArrowLeft,
  Users,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  UserCheck,
  Trash2,
  Eye,
  FileText,
  Phone,
  Mail,
} from "lucide-react";

export default function DetailOprecWorkbench() {
  const params = useParams();
  const id = params.id as string;

  const [oprec, setOprec] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [tahapFilter, setTahapFilter] = useState("ALL");
  const [divisiFilter, setDivisiFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modal Penilaian / Seleksi
  const [selectedPendaftar, setSelectedPendaftar] = useState<any>(null);
  const [statusTahap, setStatusTahap] = useState("");
  const [divisiDiterima, setDivisiDiterima] = useState("");
  const [jabatanDiterima, setJabatanDiterima] = useState("");
  const [nilaiWawancara, setNilaiWawancara] = useState("0");
  const [catatanInterviewer, setCatatanInterviewer] = useState("");
  const [savingScore, setSavingScore] = useState(false);

  // Conversion loading
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchOprec = async () => {
    try {
      const res = await fetch(`/api/oprec/${id}`);
      const json = await res.json();
      if (res.ok) {
        setOprec(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOprec();
  }, [id]);

  const handleTogglePengumuman = async () => {
    try {
      const res = await fetch(`/api/oprec/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPengumumanBuka: !oprec.isPengumumanBuka }),
      });
      if (res.ok) fetchOprec();
    } catch (err) {
      alert("Gagal mengubah status pengumuman");
    }
  };

  const handleToggleStatusOpen = async () => {
    try {
      const res = await fetch(`/api/oprec/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: !oprec.isOpen }),
      });
      if (res.ok) fetchOprec();
    } catch (err) {
      alert("Gagal mengubah status pendaftaran");
    }
  };

  const openSelectionModal = (p: any) => {
    setSelectedPendaftar(p);
    setStatusTahap(p.statusTahap);
    setDivisiDiterima(p.divisiDiterima || p.divisiPilihan1 || "");
    setJabatanDiterima(p.jabatanDiterima || "Staff Divisi");
    setNilaiWawancara(String(p.nilaiWawancara || 0));
    setCatatanInterviewer(p.catatanInterviewer || "");
  };

  const handleSaveSelection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPendaftar) return;
    setSavingScore(true);
    try {
      const res = await fetch(`/api/oprec/${id}/pendaftar/${selectedPendaftar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusTahap,
          divisiDiterima: statusTahap === "LULUS" ? divisiDiterima : null,
          jabatanDiterima: statusTahap === "LULUS" ? jabatanDiterima : null,
          nilaiWawancara: Number(nilaiWawancara) || 0,
          catatanInterviewer,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan keputusan");
      setSelectedPendaftar(null);
      fetchOprec();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingScore(false);
    }
  };

  const handleKonversi = async (pendaftarId: string) => {
    if (!confirm("Konversi pelamar ini menjadi anggota/panitia resmi di HubbHQ?")) return;
    setConvertingId(pendaftarId);
    try {
      const res = await fetch(`/api/oprec/${id}/pendaftar/${pendaftarId}/konversi`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengonversi");
      alert(json.message);
      fetchOprec();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConvertingId(null);
    }
  };

  const handleDeletePendaftar = async (pendaftarId: string) => {
    if (!confirm("Hapus data berkas pelamar ini?")) return;
    try {
      const res = await fetch(`/api/oprec/${id}/pendaftar/${pendaftarId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchOprec();
    } catch (err) {
      alert("Gagal menghapus");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Memuat meja seleksi...</div>;
  }

  if (!oprec) {
    return <div className="p-12 text-center text-sm text-destructive">Data oprec tidak ditemukan</div>;
  }

  let divisiList: string[] = [];
  try {
    divisiList = JSON.parse(oprec.divisiPilihan);
  } catch {
    divisiList = [];
  }

  const filteredPendaftar = (oprec.pendaftar || []).filter((p: any) => {
    if (tahapFilter !== "ALL" && p.statusTahap !== tahapFilter) return false;
    if (divisiFilter !== "ALL" && p.divisiPilihan1 !== divisiFilter && p.divisiDiterima !== divisiFilter) {
      return false;
    }
    if (search) {
      const s = search.toLowerCase();
      return (
        p.namaLengkap.toLowerCase().includes(s) ||
        p.nimOrNra.toLowerCase().includes(s) ||
        p.nomorRegistrasi.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const getTahapBadge = (tahap: string) => {
    switch (tahap) {
      case "BERKAS_PENDING":
        return <Badge variant="secondary">Berkas Masuk</Badge>;
      case "BERKAS_LOLOS":
        return <Badge className="bg-blue-600">Lolos Berkas</Badge>;
      case "WAWANCARA":
        return <Badge className="bg-purple-600">Wawancara</Badge>;
      case "LULUS":
        return <Badge className="bg-emerald-600">Lulus / Diterima</Badge>;
      case "DITOLAK":
        return <Badge variant="destructive">Tidak Lulus</Badge>;
      default:
        return <Badge variant="outline">{tahap}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/oprec"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar Oprec
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/oprec/${oprec.slug}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-1" /> Buka Tautan Publik
            </Button>
          </Link>
          <Button
            size="sm"
            variant={oprec.isPengumumanBuka ? "default" : "outline"}
            onClick={handleTogglePengumuman}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {oprec.isPengumumanBuka ? "Pengumuman: Terbuka Publik" : "Buka Pengumuman Hasil"}
          </Button>
        </div>
      </div>

      {/* Header Card */}
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Badge variant="outline">
              {oprec.tipeOprec === "PENGURUS_BARU" ? "Pengurus Baru" : "Kepanitiaan Acara"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={handleToggleStatusOpen}
            >
              Status Pendaftaran:{" "}
              <span className={`font-bold ml-1 ${oprec.isOpen ? "text-emerald-600" : "text-destructive"}`}>
                {oprec.isOpen ? "Terbuka" : "Ditutup"}
              </span>
            </Button>
          </div>
          <CardTitle className="text-2xl">{oprec.judul}</CardTitle>
          {oprec.programKerja && (
            <CardDescription className="text-primary font-medium">
              Program Kerja: {oprec.programKerja.title}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t">
            <div>
              <p className="text-muted-foreground">Total Pendaftar</p>
              <p className="text-lg font-bold">{oprec.pendaftar?.length || 0} Orang</p>
            </div>
            <div>
              <p className="text-muted-foreground">Lolos / Diterima</p>
              <p className="text-lg font-bold text-emerald-600">
                {oprec.pendaftar?.filter((p: any) => p.statusTahap === "LULUS").length || 0} Orang
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Sudah Dikonversi</p>
              <p className="text-lg font-bold text-blue-600">
                {oprec.pendaftar?.filter((p: any) => p.isConverted).length || 0} Orang
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tenggat Waktu</p>
              <p className="text-xs font-semibold">
                {new Date(oprec.tanggalTutup).toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIM, atau No. Reg..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={tahapFilter} onValueChange={setTahapFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Tahap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Tahapan</SelectItem>
                <SelectItem value="BERKAS_PENDING">Berkas Masuk</SelectItem>
                <SelectItem value="BERKAS_LOLOS">Lolos Berkas</SelectItem>
                <SelectItem value="WAWANCARA">Wawancara</SelectItem>
                <SelectItem value="LULUS">Lulus / Diterima</SelectItem>
                <SelectItem value="DITOLAK">Tidak Lulus</SelectItem>
              </SelectContent>
            </Select>

            <Select value={divisiFilter} onValueChange={setDivisiFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Divisi</SelectItem>
                {divisiList.map((d: string) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Pelamar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Daftar Pelamar Masuk ({filteredPendaftar.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Periksa lampiran berkas, input skor wawancara, dan klik "Konversi" untuk pelamar yang diterima.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPendaftar.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Tidak ada data pelamar yang sesuai dengan kriteria filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-y font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Pelamar & Kontak</th>
                    <th className="p-3">Pilihan Divisi</th>
                    <th className="p-3">Berkas</th>
                    <th className="p-3">Tahap</th>
                    <th className="p-3 text-center">Skor Interviu</th>
                    <th className="p-3">Divisi Diterima</th>
                    <th className="p-3 text-right">Aksi & Konversi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPendaftar.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <p className="font-semibold text-foreground text-sm">{p.namaLengkap}</p>
                        <p className="text-[11px] text-muted-foreground">
                          NIM: {p.nimOrNra} | No. Reg: <span className="font-mono">{p.nomorRegistrasi}</span>
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <Phone className="w-3 h-3" /> {p.phone}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Mail className="w-3 h-3" /> {p.email}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-foreground">1: {p.divisiPilihan1}</p>
                        {p.divisiPilihan2 && (
                          <p className="text-[11px] text-muted-foreground">2: {p.divisiPilihan2}</p>
                        )}
                      </td>
                      <td className="p-3 space-y-1">
                        {p.cvUrl ? (
                          <a
                            href={p.cvUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline block"
                          >
                            Buka CV
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">Tanpa CV</span>
                        )}
                        {p.ktmUrl && (
                          <a
                            href={p.ktmUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline block"
                          >
                            Buka KTM
                          </a>
                        )}
                      </td>
                      <td className="p-3">{getTahapBadge(p.statusTahap)}</td>
                      <td className="p-3 text-center font-bold text-sm">
                        {p.nilaiWawancara || "-"}
                      </td>
                      <td className="p-3">
                        {p.divisiDiterima ? (
                          <span className="font-semibold text-emerald-600">
                            {p.divisiDiterima}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openSelectionModal(p)}
                        >
                          Seleksi & Nilai
                        </Button>
                        {p.statusTahap === "LULUS" && (
                          <Button
                            size="sm"
                            className={`h-7 text-xs ${
                              p.isConverted
                                ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                            disabled={p.isConverted || convertingId === p.id}
                            onClick={() => handleKonversi(p.id)}
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1" />
                            {p.isConverted ? "Terkonversi" : "1-Klik Konversi"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeletePendaftar(p.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Seleksi & Nilai Wawancara */}
      {selectedPendaftar && (
        <Dialog open={Boolean(selectedPendaftar)} onOpenChange={() => setSelectedPendaftar(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg">
                Seleksi & Wawancara: {selectedPendaftar.namaLengkap}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveSelection} className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                <p>
                  <span className="text-muted-foreground">Pilihan 1:</span>{" "}
                  <span className="font-bold text-foreground">{selectedPendaftar.divisiPilihan1}</span>
                </p>
                {selectedPendaftar.divisiPilihan2 && (
                  <p>
                    <span className="text-muted-foreground">Pilihan 2:</span>{" "}
                    <span className="font-bold text-foreground">{selectedPendaftar.divisiPilihan2}</span>
                  </p>
                )}
                {selectedPendaftar.alasanMemilih && (
                  <p className="pt-1 border-t text-muted-foreground italic">
                    "{selectedPendaftar.alasanMemilih}"
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Status Tahapan</Label>
                  <Select value={statusTahap} onValueChange={setStatusTahap}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BERKAS_PENDING">Berkas Masuk</SelectItem>
                      <SelectItem value="BERKAS_LOLOS">Lolos Berkas</SelectItem>
                      <SelectItem value="WAWANCARA">Tahap Wawancara</SelectItem>
                      <SelectItem value="LULUS">Diterima / Lulus</SelectItem>
                      <SelectItem value="DITOLAK">Ditolak / Gagal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Skor Wawancara (0-100)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={nilaiWawancara}
                    onChange={(e) => setNilaiWawancara(e.target.value)}
                  />
                </div>
              </div>

              {statusTahap === "LULUS" && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-lg space-y-3">
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                    Penetapan Penempatan Divisi
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Divisi Diterima</Label>
                      <Select value={divisiDiterima} onValueChange={setDivisiDiterima}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Divisi" />
                        </SelectTrigger>
                        <SelectContent>
                          {divisiList.map((d: string) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Jabatan / Role</Label>
                      <Input
                        placeholder="Staff Divisi / Koordinator"
                        value={jabatanDiterima}
                        onChange={(e) => setJabatanDiterima(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label>Catatan Hasil Wawancara / Pewawancara</Label>
                <Textarea
                  rows={2}
                  placeholder="Kesan interviewer, komitmen waktu, kepribadian, dll..."
                  value={catatanInterviewer}
                  onChange={(e) => setCatatanInterviewer(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedPendaftar(null)}>
                  Batal
                </Button>
                <Button type="submit" disabled={savingScore}>
                  {savingScore ? "Menyimpan..." : "Simpan Keputusan Seleksi"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

