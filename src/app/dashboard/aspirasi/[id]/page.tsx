"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Lock,
  MessageSquare,
  ExternalLink,
  Trash2,
} from "lucide-react";

export default function DetailAspirasiDashboard() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form Tindak Lanjut & Status
  const [status, setStatus] = useState("");
  const [urgensi, setUrgensi] = useState("");
  const [tindakLanjut, setTindakLanjut] = useState("");
  const [catatanInternal, setCatatanInternal] = useState("");
  const [updating, setUpdating] = useState(false);

  // Form Tanggapan / Balasan
  const [pesan, setPesan] = useState("");
  const [isInternalReply, setIsInternalReply] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/aspirasi/${id}`);
      const json = await res.json();
      if (res.ok) {
        setData(json.data);
        setStatus(json.data.status);
        setUrgensi(json.data.urgensi);
        setTindakLanjut(json.data.tindakLanjut || "");
        setCatatanInternal(json.data.catatanInternal || "");
      } else {
        alert(json.error || "Gagal memuat aspirasi");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleUpdateAdvokasi = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch(`/api/aspirasi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          urgensi,
          tindakLanjut: tindakLanjut.trim() || null,
          catatanInternal: catatanInternal.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui status");
      alert("Progres advokasi berhasil diperbarui");
      fetchDetail();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesan.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/aspirasi/${id}/tanggapan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pesan: pesan.trim(),
          isInternal: isInternalReply,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengirim tanggapan");
      setPesan("");
      fetchDetail();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus tiket aduan ini?")) return;
    try {
      const res = await fetch(`/api/aspirasi/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Aspirasi berhasil dihapus");
        router.push("/dashboard/aspirasi");
      }
    } catch (err) {
      alert("Gagal menghapus aspirasi");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Memuat data aduan...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-sm text-destructive">Aspirasi tidak ditemukan</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/aspirasi"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Meja Advokasi
        </Link>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-1" /> Hapus Tiket
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Detail & Riwayat Dialog (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-mono text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded">
                  {data.kodeTiket}
                </span>
                <span className="text-xs text-muted-foreground">
                  PIN Pelacak: <span className="font-mono font-bold text-foreground">{data.pinPelacak}</span>
                </span>
              </div>
              <CardTitle className="text-xl">{data.judul}</CardTitle>
              <CardDescription>
                Kategori: <span className="font-semibold">{data.kategori}</span> | Dilaporkan pada:{" "}
                {new Date(data.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/40 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Uraian Masalah / Kronologi:
                </p>
                <p className="text-sm whitespace-pre-wrap">{data.isi}</p>
              </div>

              {data.lampiranUrl && (
                <div className="p-3 bg-muted/20 border rounded-lg flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Lampiran Bukti Pengaduan:</span>
                  <a
                    href={data.lampiranUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary font-medium inline-flex items-center hover:underline"
                  >
                    Buka Lampiran Bukti <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t">
                <div>
                  <span className="text-muted-foreground">Identitas Pelapor:</span>
                  <p className="font-medium text-foreground">
                    {data.isAnonim ? "Anonim (Dirahasiakan)" : data.namaPelapor || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Kontak Pelapor:</span>
                  <p className="font-medium text-foreground">
                    {data.isAnonim ? "Anonim" : data.kontakPelapor || "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dialog Komunikasi & Tanggapan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Riwayat Dialog & Catatan Advokasi
              </CardTitle>
              <CardDescription>
                Pesan publik dapat dilihat oleh pelapor via kode tiket. Catatan internal hanya tampak oleh pengurus.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {data.tanggapan?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    Belum ada riwayat dialog pada tiket ini.
                  </p>
                ) : (
                  data.tanggapan.map((t: any) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-lg text-sm border ${
                        t.isInternal
                          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                          : t.pengirim === "PELAPOR"
                          ? "bg-muted border-border"
                          : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-semibold flex items-center gap-1">
                          {t.isInternal && <Lock className="w-3 h-3 text-amber-600" />}
                          {t.isInternal
                            ? `Catatan Internal (${t.user?.name || "Pengurus"})`
                            : t.pengirim === "PELAPOR"
                            ? "Pelapor"
                            : `Biro Advokasi (${t.user?.name || "Pengurus"})`}
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

              {/* Form Balas */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-3 border-t">
                <Textarea
                  placeholder="Ketik tanggapan untuk pelapor atau catatan investigasi internal..."
                  rows={3}
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isInternalReply"
                      checked={isInternalReply}
                      onCheckedChange={(c) => setIsInternalReply(Boolean(c))}
                    />
                    <Label htmlFor="isInternalReply" className="text-xs font-medium cursor-pointer">
                      Simpan sebagai Catatan Internal (Tidak Terlihat oleh Pelapor)
                    </Label>
                  </div>
                  <Button type="submit" size="sm" disabled={sendingReply || !pesan.trim()}>
                    <Send className="w-4 h-4 mr-1" />
                    {sendingReply ? "Mengirim..." : "Kirim Balasan"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Meja Kerja Status & Audiensi (1 Col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meja Tindak Lanjut</CardTitle>
              <CardDescription>
                Perbarui tahapan advokasi dan catatan resmi untuk pelapor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateAdvokasi} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs">Status Penanganan</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MENUNGGU">Menunggu</SelectItem>
                      <SelectItem value="DIVERIFIKASI">Diverifikasi</SelectItem>
                      <SelectItem value="DALAM_ADVOKASI">Dalam Advokasi / Audiensi</SelectItem>
                      <SelectItem value="SELESAI">Selesai</SelectItem>
                      <SelectItem value="DITOLAK">Ditolak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Tingkat Urgensi</Label>
                  <Select value={urgensi} onValueChange={setUrgensi}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Urgensi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RENDAH">Rendah</SelectItem>
                      <SelectItem value="SEDANG">Sedang</SelectItem>
                      <SelectItem value="TINGGI">Tinggi</SelectItem>
                      <SelectItem value="DARURAT">Darurat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Catatan Tindak Lanjut Publik</Label>
                  <Textarea
                    rows={4}
                    placeholder="Contoh: Telah diaudiensikan dengan Wakil Rektor III / Pihak Dekanat pada tanggal 24 Oktober. Surat tindak lanjut No. 102 telah dikirim..."
                    value={tindakLanjut}
                    onChange={(e) => setTindakLanjut(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Catatan ini langsung tampil di bilik pelacakan tiket publik.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" /> Catatan Rahasia Tim Advokasi
                  </Label>
                  <Textarea
                    rows={3}
                    placeholder="Catatan verifikasi saksi, strategi audiensi pimpinan, nomor kontak rahasia..."
                    value={catatanInternal}
                    onChange={(e) => setCatatanInternal(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Hanya pengurus yang memiliki hak akses dashboard yang dapat membaca ini.
                  </p>
                </div>

                <Button type="submit" disabled={updating} className="w-full">
                  {updating ? "Menyimpan..." : "Simpan Perubahan Advokasi"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

