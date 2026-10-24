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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Users,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function PublicOprecPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState<"daftar" | "cek">("daftar");
  const [oprec, setOprec] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form Pendaftaran
  const [namaLengkap, setNamaLengkap] = useState("");
  const [nimOrNra, setNimOrNra] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fakultasProdi, setFakultasProdi] = useState("");
  const [angkatan, setAngkatan] = useState(String(new Date().getFullYear()));
  const [divisiPilihan1, setDivisiPilihan1] = useState("");
  const [divisiPilihan2, setDivisiPilihan2] = useState("");
  const [alasanMemilih, setAlasanMemilih] = useState("");
  const [pengalamanOrganisasi, setPengalamanOrganisasi] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [ktmUrl, setKtmUrl] = useState("");
  const [portofolioUrl, setPortofolioUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState<any>(null);
  const [copiedReg, setCopiedReg] = useState(false);

  // Form Cek Status
  const [searchKey, setSearchKey] = useState("");
  const [checking, setChecking] = useState(false);
  const [statusResult, setStatusResult] = useState<any>(null);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    if (slug) {
      fetch(`/api/oprec/public/${slug}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.data) {
            setOprec(json.data);
            if (json.data.divisiList?.length > 0) {
              setDivisiPilihan1(json.data.divisiList[0]);
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!divisiPilihan1) {
      alert("Pilih divisi pilihan utama");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/oprec/public/${slug}/daftar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaLengkap,
          nimOrNra,
          email,
          phone,
          fakultasProdi,
          angkatan: Number(angkatan) || null,
          divisiPilihan1,
          divisiPilihan2: divisiPilihan2 === "NONE" ? null : divisiPilihan2,
          alasanMemilih,
          pengalamanOrganisasi,
          cvUrl,
          ktmUrl,
          portofolioUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengirim pendaftaran");
      setRegSuccess(json);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKey.trim()) return;
    setChecking(true);
    setStatusError("");
    try {
      const res = await fetch(`/api/oprec/public/${slug}/cek-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memeriksa status");
      setStatusResult(json);
    } catch (err: any) {
      setStatusError(err.message);
      setStatusResult(null);
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Memuat informasi pendaftaran...</div>;
  }

  if (!oprec) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-base text-destructive font-semibold">Agenda Open Recruitment Tidak Ditemukan</p>
        <Link href="/" className="text-xs text-primary hover:underline">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

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
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-xs uppercase">
              {oprec.tipeOprec === "PENGURUS_BARU" ? "Pengurus Baru" : "Kepanitiaan Acara"}
            </Badge>
            {oprec.isAcceptingApplications ? (
              <Badge className="bg-emerald-600">Pendaftaran Dibuka</Badge>
            ) : (
              <Badge variant="secondary">Pendaftaran Ditutup</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{oprec.judul}</h1>
          {oprec.namaProgramKerja && (
            <p className="text-xs text-primary font-semibold">
              Kepanitiaan Program: {oprec.namaProgramKerja}
            </p>
          )}
          {oprec.deskripsi && (
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {oprec.deskripsi}
            </p>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab("daftar")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "daftar"
                  ? "bg-white dark:bg-slate-900 shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Formulir Pendaftaran
            </button>
            <button
              onClick={() => setActiveTab("cek")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "cek"
                  ? "bg-white dark:bg-slate-900 shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cek Hasil Seleksi
            </button>
          </div>
        </div>

        {/* TAB 1: FORMULIR PENDAFTARAN */}
        {activeTab === "daftar" && (
          <>
            {regSuccess ? (
              <Card className="border-emerald-500/50">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">Pendaftaran Berhasil Dikirimkan!</CardTitle>
                  <CardDescription>
                    Terima kasih telah mendaftar. Simpan Nomor Registrasi Anda berikut untuk memantau pengumuman hasil seleksi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Nomor Registrasi Anda</p>
                      <p className="text-xl font-mono font-bold text-primary tracking-wider">
                        {regSuccess.nomorRegistrasi}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(regSuccess.nomorRegistrasi);
                        setCopiedReg(true);
                        setTimeout(() => setCopiedReg(false), 2000);
                      }}
                    >
                      {copiedReg ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 p-3 rounded border border-blue-200 dark:border-blue-900">
                    Pengumuman seleksi berkas dan jadwal wawancara akan disampaikan melalui email atau nomor WhatsApp Anda. Anda juga dapat mengecek kelulusan pada tab "Cek Hasil Seleksi".
                  </p>

                  <div className="flex gap-2">
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSearchKey(regSuccess.nomorRegistrasi);
                        setActiveTab("cek");
                        setRegSuccess(null);
                      }}
                    >
                      Cek Status Kelulusan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : !oprec.isAcceptingApplications ? (
              <Card className="p-8 text-center space-y-2">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto" />
                <CardTitle className="text-lg">Pendaftaran Telah Ditutup</CardTitle>
                <CardDescription>
                  Batas waktu pendaftaran untuk agenda ini telah berakhir pada tanggal{" "}
                  {new Date(oprec.tanggalTutup).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}.
                </CardDescription>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Formulir Rekrutmen</CardTitle>
                  <CardDescription>
                    Lengkapi identitas diri, pilihan divisi, serta lampiran berkas pendukung di bawah ini.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="nama">Nama Lengkap *</Label>
                      <Input
                        id="nama"
                        required
                        placeholder="Nama sesuai KTP / KTM"
                        value={namaLengkap}
                        onChange={(e) => setNamaLengkap(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="nim">NIM / Nomor Identitas Mahasiswa *</Label>
                        <Input
                          id="nim"
                          required
                          placeholder="Contoh: 1202204050"
                          value={nimOrNra}
                          onChange={(e) => setNimOrNra(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="angkatan">Tahun Angkatan *</Label>
                        <Input
                          id="angkatan"
                          type="number"
                          required
                          placeholder="2023"
                          value={angkatan}
                          onChange={(e) => setAngkatan(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="email">Alamat Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="email@student.ac.id"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="phone">No. WhatsApp Aktif *</Label>
                        <Input
                          id="phone"
                          required
                          placeholder="08xxxxxxxxxx"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="fakultas">Fakultas / Program Studi</Label>
                      <Input
                        id="fakultas"
                        placeholder="Contoh: Teknik Informatika / FTI"
                        value={fakultasProdi}
                        onChange={(e) => setFakultasProdi(e.target.value)}
                      />
                    </div>

                    {/* Pilihan Divisi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                      <div className="space-y-1">
                        <Label htmlFor="divisi1">Pilihan Divisi Utama *</Label>
                        <Select value={divisiPilihan1} onValueChange={setDivisiPilihan1}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Divisi 1" />
                          </SelectTrigger>
                          <SelectContent>
                            {oprec.divisiList.map((d: string) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="divisi2">Pilihan Divisi Cadangan (Opsional)</Label>
                        <Select value={divisiPilihan2} onValueChange={setDivisiPilihan2}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Divisi 2" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Tidak Ada (Hanya Pilihan 1)</SelectItem>
                            {oprec.divisiList.map((d: string) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="alasan">Motivasi & Alasan Memilih Divisi Tersebut *</Label>
                      <Textarea
                        id="alasan"
                        required
                        rows={3}
                        placeholder="Ceritakan ketertarikan Anda, keahlian yang relevan, atau kontribusi yang ingin diberikan..."
                        value={alasanMemilih}
                        onChange={(e) => setAlasanMemilih(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pengalaman">Pengalaman Organisasi / Kepanitiaan Sebelumnya</Label>
                      <Textarea
                        id="pengalaman"
                        rows={2}
                        placeholder="Sebutkan organisasi, kepanitiaan, atau proyek yang pernah Anda ikuti..."
                        value={pengalamanOrganisasi}
                        onChange={(e) => setPengalamanOrganisasi(e.target.value)}
                      />
                    </div>

                    {/* Lampiran Berkas */}
                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Tautan Berkas Pendukung (Google Drive / Cloud Storage)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Tautan CV / Resume</Label>
                          <Input
                            placeholder="Tautan Google Drive CV"
                            value={cvUrl}
                            onChange={(e) => setCvUrl(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Tautan KTM / Kartu Identitas</Label>
                          <Input
                            placeholder="Tautan Scan KTM"
                            value={ktmUrl}
                            onChange={(e) => setKtmUrl(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Tautan Portofolio (Jika Ada)</Label>
                          <Input
                            placeholder="Behance / Drive Portofolio"
                            value={portofolioUrl}
                            onChange={(e) => setPortofolioUrl(e.target.value)}
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Pastikan izin akses tautan Google Drive telah diatur ke "Anyone with the link / Siapa saja yang memiliki link".
                      </p>
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full">
                      <Send className="w-4 h-4 mr-2" />
                      {submitting ? "Mengirim Pendaftaran..." : "Kirim Formulir Pendaftaran"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* TAB 2: CEK HASIL SELEKSI */}
        {activeTab === "cek" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pengumuman & Cek Kelulusan</CardTitle>
                <CardDescription>
                  Masukkan Nomor Registrasi (contoh: REG-2026-XXXX) atau Nomor Induk Mahasiswa (NIM) Anda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCheckStatus} className="flex gap-2">
                  <Input
                    required
                    placeholder="Masukkan Nomor Registrasi / NIM..."
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                  />
                  <Button type="submit" disabled={checking}>
                    <Search className="w-4 h-4 mr-1" />
                    {checking ? "Memeriksa..." : "Periksa"}
                  </Button>
                </form>

                {statusError && (
                  <p className="mt-3 text-sm text-destructive bg-destructive/10 p-3 rounded">
                    {statusError}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Status Result Card */}
            {statusResult && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="text-base">Hasil Penelusuran Pendaftaran</CardTitle>
                  <CardDescription>
                    Pendaftar: <span className="font-semibold">{statusResult.pendaftar.namaLengkap}</span> |
                    No. Reg: <span className="font-mono font-bold">{statusResult.pendaftar.nomorRegistrasi}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!statusResult.isPengumumanBuka ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg space-y-2">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Tahap Seleksi Sedang Berlangsung
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {statusResult.message}
                      </p>
                      <p className="text-xs text-muted-foreground pt-1 border-t">
                        Pilihan Divisi Anda: <span className="font-medium text-foreground">{statusResult.pendaftar.divisiPilihan1}</span>
                        {statusResult.pendaftar.divisiPilihan2 ? ` & ${statusResult.pendaftar.divisiPilihan2}` : ""}
                      </p>
                    </div>
                  ) : statusResult.pendaftar.statusTahap === "LULUS" ? (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-center space-y-3">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">
                        SELAMAT! ANDA DINYATAKAN LULUS
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 max-w-md mx-auto">
                        Anda telah resmi diterima sebagai anggota pada:
                      </p>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-md border inline-block min-w-[200px]">
                        <p className="text-xs text-muted-foreground uppercase">Divisi Diterima</p>
                        <p className="text-lg font-bold text-primary">
                          {statusResult.pendaftar.divisiDiterima || statusResult.pendaftar.divisiPilihan1}
                        </p>
                        {statusResult.pendaftar.jabatanDiterima && (
                          <p className="text-xs font-semibold text-muted-foreground">
                            Jabatan: {statusResult.pendaftar.jabatanDiterima}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Silakan nantikan instruksi penyambutan anggota atau agenda *first gathering* melalui grup koordinasi.
                      </p>
                    </div>
                  ) : statusResult.pendaftar.statusTahap === "DITOLAK" ? (
                    <div className="p-6 bg-slate-100 dark:bg-slate-900 border rounded-lg text-center space-y-2">
                      <h3 className="text-lg font-bold text-foreground">
                        Terima Kasih Atas Partisipasi Anda
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Mohon maaf, pada periode seleksi kali ini Anda belum berhasil lolos. Jangan berkecil hati, tetap semangat dan terus berkarya di kesempatan berikutnya!
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                        Status Saat Ini: {statusResult.pendaftar.statusTahap?.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pendaftaran Anda telah tercatat dan sedang dalam proses verifikasi berkas / wawancara oleh tim penilai.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

