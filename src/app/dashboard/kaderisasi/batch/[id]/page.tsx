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
  ArrowLeft,
  Users,
  Award,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileText,
} from "lucide-react";
import { SttppModal } from "@/components/kaderisasi/sttpp-modal";

export default function DetailBatchKaderisasiPage() {
  const params = useParams();
  const id = params.id as string;

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dialog Tambah Peserta
  const [isAddPesertaOpen, setIsAddPesertaOpen] = useState(false);
  const [namaLengkap, setNamaLengkap] = useState("");
  const [nraOrNim, setNraOrNim] = useState("");
  const [instansiAsal, setInstansiAsal] = useState("");
  const [kontak, setKontak] = useState("");
  const [esaiUrl, setEsaiUrl] = useState("");
  const [addingPeserta, setAddingPeserta] = useState(false);

  // Dialog Penilaian MoT
  const [scoringPeserta, setScoringPeserta] = useState<any>(null);
  const [nilaiKognitif, setNilaiKognitif] = useState("0");
  const [nilaiAfektif, setNilaiAfektif] = useState("0");
  const [nilaiPsikomotorik, setNilaiPsikomotorik] = useState("0");
  const [statusScreening, setStatusScreening] = useState("PENDING");
  const [statusKelulusan, setStatusKelulusan] = useState("BELUM_DITETAPKAN");
  const [catatanInstruktur, setCatatanInstruktur] = useState("");
  const [savingScore, setSavingScore] = useState(false);

  // Modal STTPP
  const [selectedSttpp, setSelectedSttpp] = useState<any>(null);

  const fetchBatch = async () => {
    try {
      const res = await fetch(`/api/kaderisasi/batch/${id}`);
      const json = await res.json();
      if (res.ok) {
        setBatch(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBatch();
  }, [id]);

  const handleUpdateStatusBatch = async (status: string) => {
    try {
      const res = await fetch(`/api/kaderisasi/batch/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchBatch();
    } catch (err) {
      alert("Gagal memperbarui status batch");
    }
  };

  const handleAddPeserta = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingPeserta(true);
    try {
      const res = await fetch(`/api/kaderisasi/batch/${id}/peserta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaLengkap,
          nraOrNim,
          instansiAsal,
          kontak,
          esaiUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambah peserta");
      setIsAddPesertaOpen(false);
      setNamaLengkap("");
      setNraOrNim("");
      setInstansiAsal("");
      setKontak("");
      setEsaiUrl("");
      fetchBatch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddingPeserta(false);
    }
  };

  const openScoringDialog = (peserta: any) => {
    setScoringPeserta(peserta);
    setNilaiKognitif(String(peserta.nilaiKognitif || 0));
    setNilaiAfektif(String(peserta.nilaiAfektif || 0));
    setNilaiPsikomotorik(String(peserta.nilaiPsikomotorik || 0));
    setStatusScreening(peserta.statusScreening || "PENDING");
    setStatusKelulusan(peserta.statusKelulusan || "BELUM_DITETAPKAN");
    setCatatanInstruktur(peserta.catatanInstruktur || "");
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoringPeserta) return;
    setSavingScore(true);
    try {
      const res = await fetch(`/api/kaderisasi/batch/${id}/peserta/${scoringPeserta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nilaiKognitif: Number(nilaiKognitif),
          nilaiAfektif: Number(nilaiAfektif),
          nilaiPsikomotorik: Number(nilaiPsikomotorik),
          statusScreening,
          statusKelulusan,
          catatanInstruktur,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan penilaian");
      setScoringPeserta(null);
      fetchBatch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingScore(false);
    }
  };

  const handleDeletePeserta = async (pesertaId: string) => {
    if (!confirm("Hapus peserta ini dari batch diklat?")) return;
    try {
      const res = await fetch(`/api/kaderisasi/batch/${id}/peserta/${pesertaId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchBatch();
    } catch (err) {
      alert("Gagal menghapus peserta");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Memuat detail angkatan diklat...</div>;
  }

  if (!batch) {
    return <div className="p-8 text-center text-sm text-destructive">Batch diklat tidak ditemukan.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/kaderisasi"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Manajemen Perkaderan
        </Link>
        <div className="flex items-center gap-2">
          <Select value={batch.status} onValueChange={handleUpdateStatusBatch}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Status: Draft</SelectItem>
              <SelectItem value="PENDAFTARAN">Status: Buka Pendaftaran</SelectItem>
              <SelectItem value="BERJALAN">Status: Sedang Berjalan</SelectItem>
              <SelectItem value="SELESAI">Status: Selesai</SelectItem>
              <SelectItem value="DIBATALKAN">Status: Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Batch Overview Card */}
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">
              {batch.kodeBatch}
            </span>
            <Badge variant="outline">{batch.jenjang?.namaJenjang}</Badge>
          </div>
          <CardTitle className="text-2xl">{batch.namaDiklat}</CardTitle>
          <CardDescription>
            Master of Training (MoT): <span className="font-semibold">{batch.motNama || "Belum Ditetapkan"}</span> |
            SK Kepanitiaan: <span className="font-semibold">{batch.skKepanitiaan || "-"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs pt-2 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Waktu Pelaksanaan</p>
                <p className="font-semibold">
                  {new Date(batch.tanggalMulai).toLocaleDateString("id-ID")} - {new Date(batch.tanggalSelesai).toLocaleDateString("id-ID")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Lokasi Diklat</p>
                <p className="font-semibold line-clamp-1">{batch.lokasi}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Target Peserta</p>
                <p className="font-semibold">
                  {batch.peserta?.length || 0} / {batch.kuota} Orang
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-muted-foreground">Lulus Pengkaderan</p>
                <p className="font-semibold">
                  {batch.peserta?.filter((p: any) => p.statusKelulusan === "LULUS_MURNI" || p.statusKelulusan === "LULUS_BERSYARAT").length || 0} Kader
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Peserta & Lembar Penilaian MoT */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> Daftar Peserta & Penilaian Rubrik MoT
            </CardTitle>
            <CardDescription className="text-xs">
              Bobot Nilai: Kognitif (40%), Afektif (30%), Psikomotorik (30%). Peserta lulus otomatis diterbitkan NRK & STTPP.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAddPesertaOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Peserta
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {batch.peserta?.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Belum ada peserta yang didaftarkan ke angkatan diklat ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-y font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Nama Lengkap & Instansi</th>
                    <th className="p-3">Screening</th>
                    <th className="p-3 text-center">Kognitif (40%)</th>
                    <th className="p-3 text-center">Afektif (30%)</th>
                    <th className="p-3 text-center">Psiko (30%)</th>
                    <th className="p-3 text-center font-bold">IP Akhir</th>
                    <th className="p-3">Kelulusan</th>
                    <th className="p-3">NRK / STTPP</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batch.peserta.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <p className="font-semibold text-foreground text-sm">{p.namaLengkap}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {p.instansiAsal || "-"} | NIM/NRA: {p.nraOrNim || "-"}
                        </p>
                      </td>
                      <td className="p-3">
                        {p.statusScreening === "LOLOS" ? (
                          <Badge className="bg-emerald-600">Lolos</Badge>
                        ) : p.statusScreening === "GAGAL" ? (
                          <Badge variant="destructive">Gagal</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </td>
                      <td className="p-3 text-center">{p.nilaiKognitif}</td>
                      <td className="p-3 text-center">{p.nilaiAfektif}</td>
                      <td className="p-3 text-center">{p.nilaiPsikomotorik}</td>
                      <td className="p-3 text-center font-bold text-sm text-primary">
                        {p.nilaiAkhir}
                      </td>
                      <td className="p-3">
                        {p.statusKelulusan === "LULUS_MURNI" ? (
                          <Badge className="bg-emerald-600">Lulus Murni</Badge>
                        ) : p.statusKelulusan === "LULUS_BERSYARAT" ? (
                          <Badge className="bg-amber-600">Lulus Bersyarat</Badge>
                        ) : p.statusKelulusan === "TIDAK_LULUS" ? (
                          <Badge variant="destructive">Tidak Lulus</Badge>
                        ) : (
                          <Badge variant="secondary">Belum Ditetapkan</Badge>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {p.nomorRegistrasiKader ? (
                          <div>
                            <p className="text-primary font-bold">{p.nomorRegistrasiKader}</p>
                            <p className="text-muted-foreground text-[10px]">{p.nomorSttpp}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openScoringDialog(p)}
                        >
                          Nilai MoT
                        </Button>
                        {p.nomorSttpp && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-amber-600"
                            onClick={() => setSelectedSttpp(p)}
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" /> STTPP
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeletePeserta(p.id)}
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

      {/* Dialog Tambah Peserta */}
      <Dialog open={isAddPesertaOpen} onOpenChange={setIsAddPesertaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg">Daftarkan Peserta Diklat</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPeserta} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="pNama">Nama Lengkap Peserta *</Label>
              <Input
                id="pNama"
                required
                placeholder="Nama sesuai KTP / KTM"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pNim">NIM / NRA / NIK</Label>
                <Input
                  id="pNim"
                  placeholder="Nomor identitas"
                  value={nraOrNim}
                  onChange={(e) => setNraOrNim(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pInstansi">Instansi / Asal Komisariat</Label>
                <Input
                  id="pInstansi"
                  placeholder="Fakultas / Cabang"
                  value={instansiAsal}
                  onChange={(e) => setInstansiAsal(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pKontak">No. WhatsApp</Label>
                <Input
                  id="pKontak"
                  placeholder="08xxxxxxxxxx"
                  value={kontak}
                  onChange={(e) => setKontak(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pEsai">Tautan Esai / Berkas</Label>
                <Input
                  id="pEsai"
                  placeholder="Tautan Google Drive"
                  value={esaiUrl}
                  onChange={(e) => setEsaiUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddPesertaOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={addingPeserta}>
                {addingPeserta ? "Menyimpan..." : "Daftarkan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Penilaian MoT */}
      {scoringPeserta && (
        <Dialog open={Boolean(scoringPeserta)} onOpenChange={() => setScoringPeserta(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg">
                Lembar Penilaian MoT: {scoringPeserta.namaLengkap}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveScore} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Status Screening</Label>
                  <Select value={statusScreening} onValueChange={setStatusScreening}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="LOLOS">Lolos Berkas</SelectItem>
                      <SelectItem value="GAGAL">Gagal Screening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Keputusan Kelulusan</Label>
                  <Select value={statusKelulusan} onValueChange={setStatusKelulusan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BELUM_DITETAPKAN">Belum Ditetapkan</SelectItem>
                      <SelectItem value="LULUS_MURNI">Lulus Murni</SelectItem>
                      <SelectItem value="LULUS_BERSYARAT">Lulus Bersyarat</SelectItem>
                      <SelectItem value="TIDAK_LULUS">Tidak Lulus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Rubrik Penilaian Tiga Dimensi (Skala 0 - 100)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Kognitif (40%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={nilaiKognitif}
                      onChange={(e) => setNilaiKognitif(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Afektif (30%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={nilaiAfektif}
                      onChange={(e) => setNilaiAfektif(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Psikomotorik (30%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={nilaiPsikomotorik}
                      onChange={(e) => setNilaiPsikomotorik(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Perkiraan Nilai Akhir:{" "}
                  <span className="font-bold text-foreground">
                    {Math.round(
                      (Number(nilaiKognitif) * 0.4 +
                        Number(nilaiAfektif) * 0.3 +
                        Number(nilaiPsikomotorik) * 0.3) *
                        100
                    ) / 100}
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <Label>Catatan Tim Instruktur / MoT</Label>
                <Input
                  placeholder="Catatan keaktifan, evaluasi esai, atau syarat kelulusan..."
                  value={catatanInstruktur}
                  onChange={(e) => setCatatanInstruktur(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setScoringPeserta(null)}>
                  Batal
                </Button>
                <Button type="submit" disabled={savingScore}>
                  {savingScore ? "Menyimpan..." : "Simpan Penilaian"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Cetak STTPP */}
      {selectedSttpp && (
        <SttppModal
          isOpen={Boolean(selectedSttpp)}
          onClose={() => setSelectedSttpp(null)}
          peserta={selectedSttpp}
          batch={batch}
        />
      )}
    </div>
  );
}

