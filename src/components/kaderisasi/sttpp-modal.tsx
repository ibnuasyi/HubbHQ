"use client";

import { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Printer } from "lucide-react";
import QRCode from "qrcode";

interface SttppModalProps {
  isOpen: boolean;
  onClose: () => void;
  peserta: any;
  batch: any;
}

export function SttppModal({ isOpen, onClose, peserta, batch }: SttppModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [qrUrl, setQrUrl] = useState("");

  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/kaderisasi/verifikasi/${peserta?.nomorSttpp || "SAMPLE"}`;

  useEffect(() => {
    if (peserta) {
      QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 })
        .then(setQrUrl)
        .catch(console.error);
    }
  }, [peserta, verifyUrl]);

  if (!peserta || !batch) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Surat Tanda Tamat Pendidikan & Pelatihan (STTPP)
          </DialogTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Cetak Ijazah / Piagam
            </Button>
          </div>
        </DialogHeader>

        {/* Lembar STTPP Siap Cetak */}
        <div
          ref={printRef}
          className="p-8 border-4 border-double border-amber-900/40 bg-white text-slate-900 rounded-lg shadow-inner relative space-y-6 my-4 select-none print:m-0 print:border-none print:shadow-none"
        >
          {/* Header Lembaga */}
          <div className="text-center space-y-1 border-b-2 border-slate-900/20 pb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
              KORPS PENGELOLA LATIHAN & KADERISASI
            </p>
            <h2 className="text-2xl font-serif font-black tracking-wider uppercase text-slate-900">
              SURAT TANDA TAMAT PENDIDIKAN & PELATIHAN
            </h2>
            <p className="font-mono text-xs font-semibold text-slate-700">
              Nomor Registrasi: {peserta.nomorSttpp || "STTPP/SAMPLE/001"}
            </p>
          </div>

          {/* Isi Sertifikat */}
          <div className="text-center space-y-4 py-2">
            <p className="text-sm italic font-serif text-slate-700">
              Diberikan kepada kader pejuang:
            </p>

            <div className="border-b-2 border-slate-900/40 max-w-md mx-auto pb-1">
              <h3 className="text-2xl font-serif font-bold tracking-wide text-slate-950 uppercase">
                {peserta.namaLengkap}
              </h3>
            </div>

            <p className="text-xs font-mono text-slate-700">
              Nomor Registrasi Kader (NRK): <span className="font-bold">{peserta.nomorRegistrasiKader || "-"}</span> |
              NIM/NRA: <span className="font-bold">{peserta.nraOrNim || "-"}</span>
            </p>

            <p className="text-sm max-w-2xl mx-auto leading-relaxed text-slate-800">
              Dinyatakan telah menuntaskan seluruh rangkaian materi perkaderan, tahapan evaluasi, serta dinyatakan{" "}
              <span className="font-bold uppercase tracking-wide">
                {peserta.statusKelulusan?.replace("_", " ") || "LULUS"}
              </span>{" "}
              dengan Indeks Prestasi Akhir <span className="font-bold">{peserta.nilaiAkhir || 0}</span> pada kegiatan:
            </p>

            <div className="py-2">
              <p className="text-lg font-serif font-bold text-slate-900 uppercase">
                {batch.namaDiklat}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                Jenjang: {batch.jenjang?.namaJenjang} ({batch.jenjang?.singkatan})
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Diselenggarakan di {batch.lokasi} pada tanggal{" "}
                {new Date(batch.tanggalMulai).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                s.d.{" "}
                {new Date(batch.tanggalSelesai).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Bagian Tanda Tangan & QR */}
          <div className="grid grid-cols-3 items-center pt-6 border-t border-slate-900/20 text-center">
            {/* Pimpinan / MoT */}
            <div className="space-y-12">
              <p className="text-xs font-semibold text-slate-700">Master of Training / Pimpinan Latihan,</p>
              <div className="border-b border-slate-900 max-w-[150px] mx-auto pb-1">
                <p className="text-xs font-bold uppercase">{batch.motNama || "Pimpinan Latihan"}</p>
              </div>
            </div>

            {/* QR Code Verifikasi */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="p-1 border border-slate-300 rounded bg-white shadow-sm">
                {qrUrl ? (
                  <img src={qrUrl} alt="QR Validasi" className="w-[70px] h-[70px]" />
                ) : (
                  <div className="w-[70px] h-[70px] bg-slate-100" />
                )}
              </div>
              <p className="text-[10px] font-mono text-slate-500">Pindai Validasi Keaslian</p>
            </div>

            {/* Ketua Umum */}
            <div className="space-y-12">
              <p className="text-xs font-semibold text-slate-700">Pengurus Organisasi,</p>
              <div className="border-b border-slate-900 max-w-[150px] mx-auto pb-1">
                <p className="text-xs font-bold uppercase">Ketua Umum</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

