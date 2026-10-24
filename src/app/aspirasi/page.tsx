"use client";

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Send,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";

export default function PublicAspirasiPage() {
  const [activeTab, setActiveTab] = useState<"kirim" | "lacak">("kirim");

  // State Form Kirim
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState("FASILITAS");
  const [urgensi, setUrgensi] = useState("SEDANG");
  const [isi, setIsi] = useState("");
  const [isAnonim, setIsAnonim] = useState(true);
  const [namaPelapor, setNamaPelapor] = useState("");
  const [kontakPelapor, setKontakPelapor] = useState("");
  const [lampiranUrl, setLampiranUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // State Form Lacak
  const [searchKode, setSearchKode] = useState("");
  const [searchPin, setSearchPin] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState("");
  const [replyPesan, setReplyPesan] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/aspirasi/kirim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul,
          kategori,
          urgensi,
          isi,
          isAnonim,
          namaPelapor,
          kontakPelapor,
          lampiranUrl: lampiranUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim aspirasi");
      setSubmitSuccess(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setTracking(true);
    setTrackError("");
    try {
      const res = await fetch("/api/aspirasi/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kodeTiket: searchKode.trim(),
          pinPelacak: searchPin.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal melacak tiket");
      setTrackResult(data.data);
    } catch (err: any) {
      setTrackError(err.message);
      setTrackResult(null);
    } finally {
      setTracking(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyPesan.trim() || !trackResult) return;
    setSendingReply(true);
    try {
      const res = await fetch("/api/aspirasi/track/tanggapan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kodeTiket: trackResult.kodeTiket,
          pinPelacak: searchPin.trim(),
          pesan: replyPesan.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim tanggapan");
      setTrackResult({
        ...trackResult,
        tanggapan: [...trackResult.tanggapan, data.data],
      });
      setReplyPesan("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MENUNGGU":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Menunggu Verifikasi</Badge>;
      case "DIVERIFIKASI":
        return <Badge className="bg-blue-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Diverifikasi</Badge>;
      case "DALAM_ADVOKASI":
        return <Badge className="bg-amber-600"><AlertCircle className="w-3 h-3 mr-1" /> Dalam Advokasi</Badge>;
      case "SELESAI":
        return <Badge className="bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Selesai Ditindaklanjuti</Badge>;
      case "DITOLAK":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-3 h-3 mr-1" /> Kembali ke Beranda
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Kotak Aspirasi & Layanan Advokasi
          </h1>
          <p className="text-sm text-muted-foreground">
            Sampaikan pengaduan fasilitas, kebijakan, akademik, atau aspirasi umum dengan opsi anonim dan pelacakan status transparan.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab("kirim")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "kirim"
                  ? "bg-white dark:bg-slate-900 shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Kirim Aspirasi Baru
            </button>
            <button
              onClick={() => setActiveTab("lacak")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "lacak"
                  ? "bg-white dark:bg-slate-900 shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Lacak Tiket Aduan
            </button>
          </div>
        </div>

        {/* Tab 1: Kirim Aspirasi */}
        {activeTab === "kirim" && (
          <>
            {submitSuccess ? (
              <Card className="border-emerald-500/50">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">Aspirasi Berhasil Terkirim</CardTitle>
                  <CardDescription>
                    Simpan Kode Tiket dan PIN Pelacak berikut untuk memantau proses tindak lanjut advokasi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Kode Tiket Aduan</p>
                        <p className="text-lg font-mono font-bold tracking-wide">
                          {submitSuccess.kodeTiket}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(submitSuccess.kodeTiket);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">PIN Rahasia Pelacak</p>
                        <p className="text-lg font-mono font-bold tracking-wider text-blue-600 dark:text-blue-400">
                          {submitSuccess.pinPelacak}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(submitSuccess.pinPelacak);
                          setCopiedPin(true);
                          setTimeout(() => setCopiedPin(false), 2000);
                        }}
                      >
                        {copiedPin ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 p-3 rounded border border-amber-200 dark:border-amber-800">
                    Penting: Jangan sebarkan PIN Pelacak kepada pihak lain jika ingin menjaga kerahasiaan komunikasi dengan tim advokasi.
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="w-1/2"
                      onClick={() => {
                        setSubmitSuccess(null);
                        setJudul("");
                        setIsi("");
                        setLampiranUrl("");
                      }}
                    >
                      Kirim Aduan Lain
                    </Button>
                    <Button
                      className="w-1/2"
                      onClick={() => {
                        setSearchKode(submitSuccess.kodeTiket);
                        setSearchPin(submitSuccess.pinPelacak);
                        setActiveTab("lacak");
                        setSubmitSuccess(null);
                      }}
                    >
                      Buka Bilik Pelacakan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Formulir Penyampaian Aspirasi</CardTitle>
                  <CardDescription>
                    Pilih opsi anonim jika Anda tidak ingin identitas Anda diketahui oleh pengurus maupun publik.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="judul">Judul Aspirasi / Pengaduan *</Label>
                      <Input
                        id="judul"
                        required
                        placeholder="Contoh: Kerusakan Proyektor Ruang Sidang Lt. 3"
                        value={judul}
                        onChange={(e) => setJudul(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="kategori">Kategori Isu *</Label>
                        <Select value={kategori} onValueChange={setKategori}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FASILITAS">Fasilitas & Sarana</SelectItem>
                            <SelectItem value="AKADEMIK_UKT">Akademik & Biaya Kuliah (UKT)</SelectItem>
                            <SelectItem value="KEBIJAKAN">Kebijakan & Birokrasi</SelectItem>
                            <SelectItem value="KEAMANAN_PERUNDUNGAN">Keamanan & Anti-Perundungan</SelectItem>
                            <SelectItem value="SARAN_UMUM">Saran & Ide Kreatif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="urgensi">Tingkat Urgensi</Label>
                        <Select value={urgensi} onValueChange={setUrgensi}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Urgensi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RENDAH">Rendah (Saran Santai)</SelectItem>
                            <SelectItem value="SEDANG">Sedang (Perlu Perhatian)</SelectItem>
                            <SelectItem value="TINGGI">Tinggi (Mendesak)</SelectItem>
                            <SelectItem value="DARURAT">Darurat (Segera Ditindaklanjuti)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="isi">Uraian Lengkap / Kronologi *</Label>
                      <Textarea
                        id="isi"
                        required
                        rows={5}
                        placeholder="Jelaskan detail permasalahan, lokasi spesifik, waktu kejadian, dan harapan penyelesaian..."
                        value={isi}
                        onChange={(e) => setIsi(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="lampiran">Tautan Bukti / Lampiran (Opsional)</Label>
                      <Input
                        id="lampiran"
                        placeholder="Tautan Google Drive / Imgur / Foto Bukti"
                        value={lampiranUrl}
                        onChange={(e) => setLampiranUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Pastikan tautan dapat diakses publik atau tim peninjau.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isAnonim"
                          checked={isAnonim}
                          onCheckedChange={(c) => setIsAnonim(Boolean(c))}
                        />
                        <Label htmlFor="isAnonim" className="text-sm font-medium cursor-pointer">
                          Kirim Sebagai Anonim (Rahasiakan Identitas Saya)
                        </Label>
                      </div>

                      {!isAnonim && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <div>
                            <Label htmlFor="nama" className="text-xs">Nama Lengkap / NIM</Label>
                            <Input
                              id="nama"
                              placeholder="Nama Anda"
                              value={namaPelapor}
                              onChange={(e) => setNamaPelapor(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="kontak" className="text-xs">No. WhatsApp / Email</Label>
                            <Input
                              id="kontak"
                              placeholder="08xxxxxxxxxx"
                              value={kontakPelapor}
                              onChange={(e) => setKontakPelapor(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full">
                      <Send className="w-4 h-4 mr-2" />
                      {submitting ? "Mengirimkan Aspirasi..." : "Kirim Aspirasi Sekarang"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Tab 2: Lacak Status Tiket */}
        {activeTab === "lacak" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pelacakan Status Aduan</CardTitle>
                <CardDescription>
                  Masukkan Kode Tiket dan PIN Rahasia yang Anda dapatkan saat pertama kali mengirim aduan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTrack} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="searchKode">Kode Tiket</Label>
                      <Input
                        id="searchKode"
                        required
                        placeholder="Contoh: ASP-2026-1234"
                        value={searchKode}
                        onChange={(e) => setSearchKode(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="searchPin">PIN Pelacak (6 Digit)</Label>
                      <Input
                        id="searchPin"
                        required
                        type="password"
                        maxLength={6}
                        placeholder="Contoh: 849201"
                        value={searchPin}
                        onChange={(e) => setSearchPin(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={tracking} className="w-full">
                    <Search className="w-4 h-4 mr-2" />
                    {tracking ? "Mencari Data Tiket..." : "Lacak Status Advokasi"}
                  </Button>
                </form>

                {trackError && (
                  <p className="mt-3 text-sm text-destructive bg-destructive/10 p-3 rounded">
                    {trackError}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Hasil Pelacakan */}
            {trackResult && (
              <Card className="border-blue-500/50">
                <CardHeader className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-muted-foreground">
                      {trackResult.kodeTiket}
                    </span>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(trackResult.status)}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{trackResult.judul}</CardTitle>
                  <CardDescription>
                    Kategori: {trackResult.kategori} | Pelapor: {trackResult.namaPelapor} | Tanggal:{" "}
                    {new Date(trackResult.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Isi Aduan */}
                  <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Isi Laporan / Aspirasi:</p>
                    <p className="text-sm whitespace-pre-wrap">{trackResult.isi}</p>
                  </div>

                  {/* Tindak Lanjut dari Biro Advokasi */}
                  <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        Progres Tindak Lanjut Biro Advokasi
                      </p>
                      <span className="text-xs text-muted-foreground">
                        PIC: {trackResult.petugasPIC}
                      </span>
                    </div>
                    {trackResult.tindakLanjut ? (
                      <p className="text-sm whitespace-pre-wrap">{trackResult.tindakLanjut}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Laporan sedang ditelaah oleh tim advokasi. Catatan audiensi atau solusi akan diperbarui di sini.
                      </p>
                    )}
                  </div>

                  {/* Komunikasi Dua Arah */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Riwayat Komunikasi & Tanggapan
                    </h3>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {trackResult.tanggapan.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          Belum ada riwayat dialog langsung.
                        </p>
                      ) : (
                        trackResult.tanggapan.map((t: any) => (
                          <div
                            key={t.id}
                            className={`p-3 rounded-lg text-sm ${
                              t.pengirim === "PELAPOR"
                                ? "bg-slate-200 dark:bg-slate-800 ml-6 text-right"
                                : "bg-blue-100 dark:bg-blue-950/60 mr-6 text-left"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span className="font-semibold">
                                {t.pengirim === "PELAPOR" ? "Anda (Pelapor)" : "Tim Advokasi"}
                              </span>
                              <span>
                                {new Date(t.createdAt).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{t.pesan}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Form Kirim Balasan dari Pelapor */}
                    <form onSubmit={handleSendReply} className="flex gap-2 pt-2">
                      <Input
                        placeholder="Tulis pesan tambahan atau klarifikasi..."
                        value={replyPesan}
                        onChange={(e) => setReplyPesan(e.target.value)}
                      />
                      <Button type="submit" size="sm" disabled={sendingReply || !replyPesan.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

