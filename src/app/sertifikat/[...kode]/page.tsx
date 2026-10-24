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
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  XCircle,
  Award,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Download,
} from "lucide-react";

export default function PublicVerifyCertificatePage() {
  const params = useParams();
  const kodeArray = params.kode as string[];
  const kode = Array.isArray(kodeArray) ? kodeArray.join("/") : decodeURIComponent(kodeArray || "");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (kode) {
      fetch(`/api/sertifikat/verify/${kode}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setData(json.data);
          } else {
            setError(json.error || "Sertifikat tidak valid");
          }
        })
        .catch((err) => setError("Gagal memverifikasi sertifikat"))
        .finally(() => setLoading(false));
    }
  }, [kode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-3 h-3 mr-1" /> Kembali ke Beranda
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Portal Verifikasi Keabsahan Sertifikat Digital
          </h1>
          <p className="text-xs text-muted-foreground">
            Layanan validasi integritas dokumen dan bukti kepesertaan/kepanitiaan resmi HubbHQ.
          </p>
        </div>

        {loading ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            Memverifikasi data sertifikat pada basis data resmi...
          </Card>
        ) : error ? (
          <Card className="border-destructive/50">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <XCircle className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl text-destructive">Sertifikat Tidak Valid / Palsu</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-xs text-muted-foreground">
              Nomor dokumen yang dipindai tidak terdaftar pada pangkalan data organisasi. Pastikan Anda memindai kode QR dari naskah asli.
            </CardContent>
          </Card>
        ) : (
          <Card className="border-emerald-500/50 shadow-md">
            <CardHeader className="text-center space-y-2 border-b bg-emerald-50/40 dark:bg-emerald-950/20 pb-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <Badge className="bg-emerald-600 mx-auto">Dokumen Sah & Terverifikasi</Badge>
              <CardTitle className="text-xl pt-1">
                {data.namaPenerima}
              </CardTitle>
              <p className="text-xs font-mono font-semibold text-muted-foreground">
                No. Registrasi: {data.nomorSertifikat}
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
                <div>
                  <span className="text-muted-foreground">Peran / Status:</span>
                  <p className="font-bold text-foreground text-sm">{data.sebagai}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Kategori:</span>
                  <p className="font-bold text-foreground text-sm">{data.kategori}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground">Nama Agenda / Kegiatan:</span>
                <p className="font-semibold text-foreground text-sm">{data.kegiatan}</p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground">Tanggal Penerbitan:</span>
                <p className="font-medium text-foreground">
                  {new Date(data.issuedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {data.keterangan && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">Keterangan Tambahan:</span>
                  <p className="text-muted-foreground italic">{data.keterangan}</p>
                </div>
              )}

              {data.outputImageUrl && (
                <div className="pt-2">
                  <a href={data.outputImageUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="w-full text-xs">
                      <Download className="w-4 h-4 mr-2 text-primary" /> Unduh Berkas Sertifikat Asli (Cloud Storage)
                    </Button>
                  </a>
                </div>
              )}

              <div className="pt-4 border-t text-center text-muted-foreground">
                <p className="text-[11px]">
                  Terdaftar resmi pada sistem arsip Surat Keterangan Pendamping Ijazah (SKPI) & Kepengurusan HubbHQ.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

