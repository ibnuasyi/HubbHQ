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
  Gavel,
  Scale,
  Plus,
  Printer,
  FileText,
  Clock,
  CheckCircle2,
  Users,
  ShieldAlert,
  PauseCircle,
  PlayCircle,
  StopCircle,
} from "lucide-react";
import { TapDialog } from "@/components/sidang/tap-dialog";
import { TapPrintModal } from "@/components/sidang/tap-print-modal";

export default function DetailSidangDashboard() {
  const params = useParams();
  const id = params.id as string;

  const [sidang, setSidang] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"risalah" | "tap">("risalah");

  // Dialogs
  const [isTapDialogOpen, setIsTapDialogOpen] = useState(false);
  const [selectedTapPrint, setSelectedTapPrint] = useState<any>(null);

  // Form Tambah Risalah
  const [isAddRisalahOpen, setIsAddRisalahOpen] = useState(false);
  const [agenda, setAgenda] = useState("");
  const [isiRisalah, setIsiRisalah] = useState("");
  const [interupsi, setInterupsi] = useState("");
  const [notulisNama, setNotulisNama] = useState("");
  const [savingRisalah, setSavingRisalah] = useState(false);

  // Kuorum control
  const [kuorumHadir, setKuorumHadir] = useState(0);

  const fetchSidang = async () => {
    try {
      const res = await fetch(`/api/sidang/${id}`);
      const json = await res.json();
      if (res.ok) {
        setSidang(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSidang();
  }, [id]);

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/sidang/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchSidang();
    } catch (err) {
      alert("Gagal memperbarui status persidangan");
    }
  };

  const handleAddRisalah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agenda.trim() || !isiRisalah.trim() || !notulisNama.trim()) {
      alert("Lengkapi agenda, isi risalah, dan notulis");
      return;
    }
    setSavingRisalah(true);
    try {
      const res = await fetch(`/api/sidang/${id}/risalah`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agenda,
          isiRisalah,
          interupsiDanDinamika: interupsi.trim() || null,
          notulisNama,
          waktuMulai: new Date(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mencatat risalah");
      setIsAddRisalahOpen(false);
      setAgenda("");
      setIsiRisalah("");
      setInterupsi("");
      fetchSidang();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingRisalah(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Memuat meja persidangan...</div>;
  }

  if (!sidang) {
    return <div className="p-8 text-center text-sm text-destructive">Musyawarah tidak ditemukan.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/sidang"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar Musyawarah
        </Link>
        <div className="flex items-center gap-2">
          {sidang.status !== "BERLANGSUNG" && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleUpdateStatus("BERLANGSUNG")}
            >
              <PlayCircle className="w-4 h-4 mr-1" /> Buka Sidang Pleno
            </Button>
          )}
          {sidang.status === "BERLANGSUNG" && (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50"
              onClick={() => handleUpdateStatus("SKORSING")}
            >
              <PauseCircle className="w-4 h-4 mr-1" /> Skorsing Sidang
            </Button>
          )}
          {sidang.status !== "DITUTUP" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleUpdateStatus("DITUTUP")}
            >
              <StopCircle className="w-4 h-4 mr-1" /> Tutup Sidang Pleno
            </Button>
          )}
        </div>
      </div>

      {/* Overview & Presidium Pleno */}
      <Card className="border-t-4 border-t-primary">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono text-xs font-bold text-muted-foreground">
              {sidang.tempat}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Kuorum Forum: {sidang.totalKuorum} Peserta
              </Badge>
              {sidang.status === "BERLANGSUNG" ? (
                <Badge className="bg-emerald-600 animate-pulse">
                  <Gavel className="w-3 h-3 mr-1" /> Sidang Aktif
                </Badge>
              ) : sidang.status === "SKORSING" ? (
                <Badge className="bg-amber-600">Diskorsing (Palu 1x)</Badge>
              ) : sidang.status === "DITUTUP" ? (
                <Badge variant="secondary">Sidang Telah Ditutup</Badge>
              ) : (
                <Badge variant="outline">Persiapan</Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">{sidang.namaMusyawarah}</CardTitle>
          {sidang.tema && (
            <CardDescription className="italic">"{sidang.tema}"</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-muted/40 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground font-semibold">Presidium Sidang I:</span>
              <p className="font-bold text-foreground text-sm">
                {sidang.presidium1 || "Belum Ditetapkan"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Presidium Sidang II:</span>
              <p className="font-bold text-foreground text-sm">
                {sidang.presidium2 || "Belum Ditetapkan"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Presidium Sidang III:</span>
              <p className="font-bold text-foreground text-sm">
                {sidang.presidium3 || "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex border-b border-border space-x-4">
        <button
          onClick={() => setActiveTab("risalah")}
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "risalah"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Risalah Dinamika Pleno ({sidang.risalah?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("tap")}
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "tap"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Surat Ketetapan Sidang / TAP ({sidang.ketetapanSK?.length || 0})
        </button>
      </div>

      {/* TAB 1: RISALAH DINAMIKA PLENO */}
      {activeTab === "risalah" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Catatan kronologis jalannya persidangan, interupsi fraksi, lobi-lobi, dan keputusan pleno.
            </p>
            <Button size="sm" onClick={() => setIsAddRisalahOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Catat Notula / Agenda Baru
            </Button>
          </div>

          <div className="space-y-3">
            {sidang.risalah?.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                Belum ada risalah yang dicatat. Klik tombol di atas untuk mencatat jalannya sidang pleno.
              </Card>
            ) : (
              sidang.risalah.map((r: any) => (
                <Card key={r.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground">
                        {new Date(r.waktuMulai).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Notulis: <span className="font-semibold text-foreground">{r.notulisNama}</span>
                      </span>
                    </div>
                    <CardTitle className="text-base">{r.agenda}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                      <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                        Isi Risalah / Putusan:
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{r.isiRisalah}</p>
                    </div>

                    {r.interupsiDanDinamika && (
                      <div className="p-3 border rounded-lg bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 space-y-1">
                        <p className="font-semibold text-amber-800 dark:text-amber-300 uppercase text-[10px]">
                          Interupsi, Perdebatan & Dinamika Sidang:
                        </p>
                        <p className="text-xs text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
                          {r.interupsiDanDinamika}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SURAT KETETAPAN (TAP SK) */}
      {activeTab === "tap" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Buku Ketetapan Resmi Musyawarah (TAP Pleno) dengan format hukum Menimbang, Mengingat, dan Memutuskan.
            </p>
            <Button size="sm" onClick={() => setIsTapDialogOpen(true)}>
              <Scale className="w-4 h-4 mr-1" /> Terbitkan TAP SK Baru
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sidang.ketetapanSK?.length === 0 ? (
              <div className="col-span-full p-8 text-center text-sm text-muted-foreground">
                Belum ada Surat Ketetapan (TAP) yang disahkan dalam musyawarah ini.
              </div>
            ) : (
              sidang.ketetapanSK.map((tap: any) => (
                <Card key={tap.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary">
                        {tap.nomorTap}
                      </span>
                      <Badge className="bg-emerald-600">Sah & Mengikat</Badge>
                    </div>
                    <CardTitle className="text-base uppercase leading-snug">
                      {tap.tentang}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Ditetapkan di {tap.tempatDitetapkan} pada{" "}
                      {new Date(tap.tanggalDitetapkan).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="p-2.5 bg-muted/40 rounded border text-muted-foreground line-clamp-3">
                      <span className="font-bold text-foreground">MEMUTUSKAN: </span>
                      {tap.diktumMemutuskan}
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTapPrint(tap)}
                      >
                        <Printer className="w-4 h-4 mr-1 text-primary" /> Cetak Naskah SK
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Dialog Catat Risalah */}
      <Dialog open={isAddRisalahOpen} onOpenChange={setIsAddRisalahOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">Catat Notula / Risalah Agenda Pleno</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddRisalah} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="agenda">Nama Agenda / Pleno *</Label>
              <Input
                id="agenda"
                required
                placeholder="Contoh: Sidang Pleno I: Pembahasan Tata Tertib"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="isi">Hasil Notula & Kesepakatan Pleno *</Label>
              <Textarea
                id="isi"
                required
                rows={4}
                placeholder="Tuliskan pokok bahasan, pasal-pasal yang disepakati, dan ketetapan forum..."
                value={isiRisalah}
                onChange={(e) => setIsiRisalah(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="interupsi">Dinamika & Interupsi Forum (Opsional)</Label>
              <Textarea
                id="interupsi"
                rows={2}
                placeholder="Catatan interupsi point of order, perdebatan fraksi, atau proses lobi..."
                value={interupsi}
                onChange={(e) => setInterupsi(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notulis">Nama Notulis Sidang *</Label>
              <Input
                id="notulis"
                required
                placeholder="Nama notulis yang bertugas"
                value={notulisNama}
                onChange={(e) => setNotulisNama(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddRisalahOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={savingRisalah}>
                {savingRisalah ? "Menyimpan..." : "Simpan Risalah"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Terbitkan TAP SK */}
      <TapDialog
        isOpen={isTapDialogOpen}
        onClose={() => setIsTapDialogOpen(false)}
        onSuccess={fetchSidang}
        sidangId={id}
      />

      {/* Modal Cetak TAP SK */}
      {selectedTapPrint && (
        <TapPrintModal
          isOpen={Boolean(selectedTapPrint)}
          onClose={() => setSelectedTapPrint(null)}
          tap={selectedTapPrint}
          sidang={sidang}
        />
      )}
    </div>
  );
}

