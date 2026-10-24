"use client";

import { useState, useEffect, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Award,
  Plus,
  Layers,
  Sparkles,
  Download,
  Printer,
  Eye,
  Trash2,
  Users,
  Calendar,
  ExternalLink,
  Sliders,
  CheckCircle2,
  Cloud,
  CloudUpload,
  Loader2,
} from "lucide-react";
import QRCode from "qrcode";

export default function DashboardStudioSertifikatPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Buat Template
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [namaTemplate, setNamaTemplate] = useState("");
  const [kategori, setKategori] = useState("UMUM");
  const [imageUrl, setImageUrl] = useState("");
  const [prefixNomor, setPrefixNomor] = useState("SERT/[NO]/HUBB/[YEAR]");
  const [submittingTemplate, setSubmittingTemplate] = useState(false);

  // Studio Mode
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [canvasConfig, setCanvasConfig] = useState<any>(null);

  // Data Source & Recipient List
  const [sourceMode, setSourceMode] = useState<"manual" | "anggota" | "panitia">("manual");
  const [rawNames, setRawNames] = useState(
    "Ahmad Fauzi, Ketua Panitia\nSiti Rahma, Sekretaris Panitia\nBudi Santoso, Divisi Acara"
  );
  const [generating, setGenerating] = useState(false);
  const [autoArchive, setAutoArchive] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [batchArchiving, setBatchArchiving] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Generated Certificates Display
  const [generatedList, setGeneratedList] = useState<any[]>([]);
  const [previewCert, setPreviewCert] = useState<any>(null);

  // Hidden Render Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sertifikat/template");
      const json = await res.json();
      if (res.ok) setTemplates(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenStudio = async (templateId: string) => {
    try {
      const res = await fetch(`/api/sertifikat/template/${templateId}`);
      const json = await res.json();
      if (res.ok) {
        setSelectedTemplate(json.data);
        setGeneratedList(json.data.sertifikatList || []);
        let cfg = null;
        try {
          cfg = JSON.parse(json.data.configJson);
        } catch {
          cfg = {
            nama: { x: 960, y: 520, fontSize: 54, color: "#0f172a", align: "center", isBold: true },
            sebagai: { x: 960, y: 620, fontSize: 32, color: "#334155", align: "center", isBold: false },
            nomor: { x: 960, y: 350, fontSize: 22, color: "#64748b", align: "center", isBold: true },
            tanggal: { x: 1440, y: 880, fontSize: 20, color: "#334155", align: "center", isBold: false },
            qr: { x: 220, y: 840, size: 110, show: true },
          };
        }
        setCanvasConfig(cfg);
      }
    } catch (err) {
      alert("Gagal memuat studio sertifikat");
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTemplate(true);
    try {
      const res = await fetch("/api/sertifikat/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaTemplate,
          kategori,
          imageUrl,
          prefixNomor,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat template");
      setIsCreateModalOpen(false);
      setNamaTemplate("");
      setImageUrl("");
      fetchTemplates();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingTemplate(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedTemplate || !canvasConfig) return;
    try {
      const res = await fetch(`/api/sertifikat/template/${selectedTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configJson: canvasConfig,
        }),
      });
      if (res.ok) alert("Tata letak teks dan QR sertifikat berhasil disimpan");
    } catch (err) {
      alert("Gagal menyimpan tata letak");
    }
  };

  const handleMassGenerate = async () => {
    if (!selectedTemplate) return;

    // Parse recipients
    const lines = rawNames.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      alert("Masukkan minimal satu nama penerima");
      return;
    }

    const recipients = lines.map((line) => {
      const parts = line.split(",");
      return {
        nama: parts[0]?.trim() || "",
        sebagai: parts[1]?.trim() || "Peserta",
      };
    });

    setGenerating(true);
    try {
      const res = await fetch(`/api/sertifikat/template/${selectedTemplate.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal men-generate sertifikat");
      alert(json.message);
      await handleOpenStudio(selectedTemplate.id);

      // Jika opsi auto-archive aktif, langsung render dan unggah ke Object Storage
      const newCerts = json.data || [];
      if (autoArchive && newCerts.length > 0) {
        setBatchArchiving(true);
        setBatchProgress({ current: 0, total: newCerts.length });

        for (let i = 0; i < newCerts.length; i++) {
          const cert = newCerts[i];
          setBatchProgress({ current: i + 1, total: newCerts.length });
          try {
            const dataUrl = await renderCertificateImage(cert);
            const archRes = await fetch("/api/sertifikat/archive", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ certId: cert.id, imageBase64: dataUrl }),
            });
            if (archRes.ok) {
              const archJson = await archRes.json();
              setGeneratedList((prev) =>
                prev.map((c) => (c.id === cert.id ? { ...c, outputImageUrl: archJson.url } : c))
              );
            }
          } catch (e) {
            console.error("Gagal auto-arsip cert:", cert.nomorSertifikat, e);
          }
        }
        setBatchArchiving(false);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Render Sertifikat ke Gambar HD
  const renderCertificateImage = async (cert: any): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      if (!selectedTemplate || !canvasConfig) return reject("Config missing");

      const canvas = document.createElement("canvas");
      canvas.width = selectedTemplate.lebarCanvas || 1920;
      canvas.height = selectedTemplate.tinggiCanvas || 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas context null");

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        // 1. Draw Background Image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 2. Draw Teks Nomor Sertifikat
        const cfgNo = canvasConfig.nomor;
        ctx.font = `${cfgNo.isBold ? "bold " : ""}${cfgNo.fontSize}px Courier New, monospace`;
        ctx.fillStyle = cfgNo.color || "#64748b";
        ctx.textAlign = cfgNo.align || "center";
        ctx.fillText(`Nomor: ${cert.nomorSertifikat}`, cfgNo.x, cfgNo.y);

        // 3. Draw Teks {Nama}
        const cfgNama = canvasConfig.nama;
        ctx.font = `${cfgNama.isBold ? "bold " : ""}${cfgNama.fontSize}px Georgia, serif`;
        ctx.fillStyle = cfgNama.color || "#0f172a";
        ctx.textAlign = cfgNama.align || "center";
        ctx.fillText(cert.namaPenerima, cfgNama.x, cfgNama.y);

        // 4. Draw Teks {Sebagai}
        const cfgSebagai = canvasConfig.sebagai;
        ctx.font = `${cfgSebagai.isBold ? "bold " : ""}${cfgSebagai.fontSize}px Arial, sans-serif`;
        ctx.fillStyle = cfgSebagai.color || "#334155";
        ctx.textAlign = cfgSebagai.align || "center";
        ctx.fillText(`Sebagai: ${cert.sebagai}`, cfgSebagai.x, cfgSebagai.y);

        // 5. Draw Teks {Tanggal}
        const cfgTgl = canvasConfig.tanggal;
        ctx.font = `${cfgTgl.fontSize}px Arial, sans-serif`;
        ctx.fillStyle = cfgTgl.color || "#334155";
        ctx.textAlign = cfgTgl.align || "center";
        const dateStr = new Date(cert.issuedAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        ctx.fillText(dateStr, cfgTgl.x, cfgTgl.y);

        // 6. Draw QR Code Verifikasi
        if (canvasConfig.qr?.show) {
          const verifyUrl = `${window.location.origin}/sertifikat/${cert.nomorSertifikat}`;
          try {
            const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: canvasConfig.qr.size || 110, margin: 1 });
            const qrImg = new Image();
            qrImg.onload = () => {
              ctx.drawImage(
                qrImg,
                canvasConfig.qr.x - (canvasConfig.qr.size || 110) / 2,
                canvasConfig.qr.y - (canvasConfig.qr.size || 110) / 2,
                canvasConfig.qr.size || 110,
                canvasConfig.qr.size || 110
              );
              resolve(canvas.toDataURL("image/png"));
            };
            qrImg.src = qrDataUrl;
          } catch {
            resolve(canvas.toDataURL("image/png"));
          }
        } else {
          resolve(canvas.toDataURL("image/png"));
        }
      };
      img.onerror = () => reject("Gagal memuat gambar latar template");
      img.src = selectedTemplate.imageUrl;
    });
  };

  const handleDownloadSingle = async (cert: any) => {
    try {
      const dataUrl = await renderCertificateImage(cert);
      const link = document.createElement("a");
      link.download = `Sertifikat-${cert.namaPenerima.replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      alert("Gagal mengunduh sertifikat: " + err);
    }
  };

  const handlePreview = async (cert: any) => {
    try {
      const dataUrl = await renderCertificateImage(cert);
      setPreviewCert({ ...cert, previewUrl: dataUrl });
    } catch (err: any) {
      alert("Gagal merender pratinjau: " + err);
    }
  };

  const handleArchiveSingle = async (cert: any) => {
    try {
      setArchivingId(cert.id);
      const dataUrl = await renderCertificateImage(cert);
      const res = await fetch("/api/sertifikat/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certId: cert.id, imageBase64: dataUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengarsipkan sertifikat");

      setGeneratedList((prev) =>
        prev.map((c) => (c.id === cert.id ? { ...c, outputImageUrl: json.url } : c))
      );
      alert(`Berhasil diarsipkan ke ${json.provider || "Object Storage"}`);
    } catch (err: any) {
      alert("Gagal mengarsipkan: " + err.message);
    } finally {
      setArchivingId(null);
    }
  };

  const handleArchiveAll = async () => {
    const pending = generatedList.filter((c) => !c.outputImageUrl);
    if (pending.length === 0) {
      alert("Semua sertifikat sudah tersimpan di Object Storage.");
      return;
    }

    setBatchArchiving(true);
    setBatchProgress({ current: 0, total: pending.length });

    let successCount = 0;
    for (let i = 0; i < pending.length; i++) {
      const cert = pending[i];
      setBatchProgress({ current: i + 1, total: pending.length });
      try {
        const dataUrl = await renderCertificateImage(cert);
        const res = await fetch("/api/sertifikat/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ certId: cert.id, imageBase64: dataUrl }),
        });
        if (res.ok) {
          const json = await res.json();
          setGeneratedList((prev) =>
            prev.map((c) => (c.id === cert.id ? { ...c, outputImageUrl: json.url } : c))
          );
          successCount++;
        }
      } catch (e) {
        console.error("Gagal arsip cert:", cert.nomorSertifikat, e);
      }
    }

    setBatchArchiving(false);
    alert(`Selesai. ${successCount} dari ${pending.length} sertifikat berhasil diarsipkan ke Object Storage.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Studio E-Sertifikat
          </h1>
          <p className="text-sm text-muted-foreground">
            Unggah gambar template kosong dari Canva/Photoshop, sesuaikan posisi placeholder {`{Nama}`}, lalu generate ratusan sertifikat resmi secara massal.
          </p>
        </div>
        <div className="flex gap-2">
          {selectedTemplate ? (
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Kembali ke Galeri Template
            </Button>
          ) : (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Buat Template Baru
            </Button>
          )}
        </div>
      </div>

      {/* VIEW 1: GALERI TEMPLATE */}
      {!selectedTemplate && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
              Memuat template sertifikat...
            </div>
          ) : templates.length === 0 ? (
            <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
              Belum ada template sertifikat yang diunggah. Klik tombol di atas untuk membuat template pertama.
            </div>
          ) : (
            templates.map((t) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow overflow-hidden">
                <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative overflow-hidden border-b">
                  <img
                    src={t.imageUrl}
                    alt={t.namaTemplate}
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=60";
                    }}
                  />
                  <Badge className="absolute top-2 right-2 text-[10px]">
                    {t.kategori}
                  </Badge>
                </div>
                <CardHeader className="pb-2 space-y-1">
                  <CardTitle className="text-base line-clamp-1">{t.namaTemplate}</CardTitle>
                  <CardDescription className="text-xs font-mono">
                    Pola No: {t.prefixNomor}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Sertifikat Terbit:</span>
                    <span className="font-bold text-foreground">
                      {t._count?.sertifikatList || 0} Berkas
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleOpenStudio(t.id)}
                  >
                    <Sliders className="w-3.5 h-3.5 mr-1" /> Buka Studio & Generate
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: STUDIO WORKBENCH */}
      {selectedTemplate && canvasConfig && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedTemplate.kategori}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    Pola: {selectedTemplate.prefixNomor}
                  </span>
                </div>
                <CardTitle className="text-xl pt-1">{selectedTemplate.namaTemplate}</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSaveConfig}>
                  Simpan Tata Letak
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Kolom Kiri: Konfigurasi Koordinat Placeholder (4 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Slider Penempatan Posisi */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sliders className="w-4 h-4" /> Pengaturan Posisi Placeholder
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Atur posisi Y dan ukuran font untuk teks {`{Nama}`}, {`{Sebagai}`}, dan {`{Nomor}`}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  {/* Posisi Nama */}
                  <div className="p-3 bg-muted/40 rounded-lg space-y-2">
                    <p className="font-bold text-foreground uppercase tracking-wide">
                      Tag {`{Nama}`}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px]">Posisi Vertikal (Y)</Label>
                        <Input
                          type="number"
                          value={canvasConfig.nama.y}
                          onChange={(e) =>
                            setCanvasConfig({
                              ...canvasConfig,
                              nama: { ...canvasConfig.nama, y: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Ukuran Font (px)</Label>
                        <Input
                          type="number"
                          value={canvasConfig.nama.fontSize}
                          onChange={(e) =>
                            setCanvasConfig({
                              ...canvasConfig,
                              nama: { ...canvasConfig.nama, fontSize: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Posisi Sebagai */}
                  <div className="p-3 bg-muted/40 rounded-lg space-y-2">
                    <p className="font-bold text-foreground uppercase tracking-wide">
                      Tag {`{Sebagai}`}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px]">Posisi Vertikal (Y)</Label>
                        <Input
                          type="number"
                          value={canvasConfig.sebagai.y}
                          onChange={(e) =>
                            setCanvasConfig({
                              ...canvasConfig,
                              sebagai: { ...canvasConfig.sebagai, y: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Ukuran Font (px)</Label>
                        <Input
                          type="number"
                          value={canvasConfig.sebagai.fontSize}
                          onChange={(e) =>
                            setCanvasConfig({
                              ...canvasConfig,
                              sebagai: { ...canvasConfig.sebagai, fontSize: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Posisi Nomor */}
                  <div className="p-3 bg-muted/40 rounded-lg space-y-2">
                    <p className="font-bold text-foreground uppercase tracking-wide">
                      Tag {`{Nomor}`}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px]">Posisi Vertikal (Y)</Label>
                        <Input
                          type="number"
                          value={canvasConfig.nomor.y}
                          onChange={(e) =>
                            setCanvasConfig({
                              ...canvasConfig,
                              nomor: { ...canvasConfig.nomor, y: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Ukuran Font (px)</Label>
                        <Input
                          type="number"
                          value={canvasConfig.nomor.fontSize}
                          onChange={(e) =>
                            setCanvasConfig({
                              ...canvasConfig,
                              nomor: { ...canvasConfig.nomor, fontSize: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Input List Nama */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" /> Masukkan Daftar Nama Penerima
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tempel daftar nama penerima (format: "Nama Lengkap, Peran") per baris.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    rows={6}
                    placeholder="Ahmad Fauzi, Ketua Pelaksana&#10;Siti Rahma, Sekretaris Panitia&#10;Budi Santoso, Peserta"
                    value={rawNames}
                    onChange={(e) => setRawNames(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <div className="flex items-center space-x-2 pt-1 pb-1">
                    <Checkbox
                      id="autoArchive"
                      checked={autoArchive}
                      onCheckedChange={(checked) => setAutoArchive(Boolean(checked))}
                    />
                    <label
                      htmlFor="autoArchive"
                      className="text-xs text-muted-foreground cursor-pointer select-none"
                    >
                      Otomatis arsipkan berkas HD ke Object Storage (Cloudflare R2 / S3 / AList)
                    </label>
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={generating || batchArchiving}
                    onClick={handleMassGenerate}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generating
                      ? "Men-generate Sertifikat..."
                      : batchArchiving
                      ? `Mengarsipkan ke Cloud (${batchProgress.current}/${batchProgress.total})...`
                      : "Mulai Generate Massal"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Kolom Kanan: Pratinjau Canvas & Berkas Terbit (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Pratinjau Visual Template */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Pratinjau Gambar Template
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Template beresolusi HD {selectedTemplate.lebarCanvas}x{selectedTemplate.tinggiCanvas}px.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video border rounded-lg bg-slate-900 overflow-hidden relative shadow-inner">
                    <img
                      src={selectedTemplate.imageUrl}
                      alt="Template Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Daftar Sertifikat Terbit */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <span>Sertifikat Terbit ({generatedList.length})</span>
                        {generatedList.length > 0 && (
                          <Badge variant="outline" className="text-[10px]">
                            {generatedList.filter((c) => Boolean(c.outputImageUrl)).length}/{generatedList.length} Tersimpan di Cloud
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Sertifikat individual yang sudah memiliki nomor registrasi resmi dan QR Code publik.
                      </CardDescription>
                    </div>

                    {generatedList.length > 0 && generatedList.some((c) => !c.outputImageUrl) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs h-7"
                        disabled={batchArchiving}
                        onClick={handleArchiveAll}
                      >
                        {batchArchiving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            Mengarsipkan ({batchProgress.current}/{batchProgress.total})
                          </>
                        ) : (
                          <>
                            <CloudUpload className="w-3.5 h-3.5 mr-1 text-primary" />
                            Arsipkan Semua ke Object Storage
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {generatedList.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Belum ada sertifikat yang di-generate. Masukkan daftar nama di sebelah kiri.
                    </div>
                  ) : (
                    <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                      {generatedList.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 flex items-center justify-between hover:bg-muted/40 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-sm">{c.namaPenerima}</p>
                            <p className="text-xs text-muted-foreground">
                              Sebagai: <span className="font-medium text-foreground">{c.sebagai}</span> |
                              No: <span className="font-mono text-primary font-bold">{c.nomorSertifikat}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {c.outputImageUrl ? (
                              <a href={c.outputImageUrl} target="_blank" rel="noreferrer">
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] text-emerald-600 border-emerald-500/30 flex items-center gap-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                >
                                  <Cloud className="w-3 h-3 text-emerald-600" /> Cloud Storage
                                </Badge>
                              </a>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                disabled={archivingId === c.id || batchArchiving}
                                onClick={() => handleArchiveSingle(c)}
                                title="Unggah ke Object Storage agar berkas asli tersimpan di Cloud"
                              >
                                {archivingId === c.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <CloudUpload className="w-3.5 h-3.5 mr-1" /> Arsipkan
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handlePreview(c)}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> Pratinjau
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-primary"
                              onClick={() => handleDownloadSingle(c)}
                            >
                              <Download className="w-3.5 h-3.5 mr-1" /> Unduh HD
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Buat Template */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Buat Template Sertifikat Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTemplate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="tNama">Nama Template / Kegiatan *</Label>
              <Input
                id="tNama"
                required
                placeholder="Contoh: Sertifikat Seminar Nasional 2026"
                value={namaTemplate}
                onChange={(e) => setNamaTemplate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Kategori</Label>
                <Select value={kategori} onValueChange={setKategori}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UMUM">Umum</SelectItem>
                    <SelectItem value="PESERTA">Peserta Kegiatan</SelectItem>
                    <SelectItem value="PANITIA">Panitia Pelaksana</SelectItem>
                    <SelectItem value="PENGURUS">Pengurus Organisasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="tPola">Pola Penomoran</Label>
                <Input
                  id="tPola"
                  placeholder="SERT/[NO]/HUBB/[YEAR]"
                  value={prefixNomor}
                  onChange={(e) => setPrefixNomor(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="tUrl">Tautan Gambar Template Kosong (URL Gambar) *</Label>
              <Input
                id="tUrl"
                required
                placeholder="https://... atau /uploads/... (PNG/JPG)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Unggah desain sertifikat Anda dari Canva / Photoshop (tanpa nama peserta).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submittingTemplate}>
                {submittingTemplate ? "Menyimpan..." : "Buat Template"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Pratinjau Render */}
      {previewCert && (
        <Dialog open={Boolean(previewCert)} onOpenChange={() => setPreviewCert(null)}>
          <DialogContent className="max-w-4xl p-6">
            <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <DialogTitle className="text-base">
                Pratinjau Hasil Render: {previewCert.namaPenerima}
              </DialogTitle>
              <Button size="sm" onClick={() => handleDownloadSingle(previewCert)}>
                <Download className="w-4 h-4 mr-1" /> Unduh Gambar HD
              </Button>
            </DialogHeader>
            <div className="aspect-video border rounded-lg bg-slate-900 overflow-hidden shadow-inner my-2">
              <img
                src={previewCert.previewUrl}
                alt="Render Preview"
                className="w-full h-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

