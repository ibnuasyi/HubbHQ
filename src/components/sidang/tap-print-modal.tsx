"use client";

import { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Scale } from "lucide-react";
import QRCode from "qrcode";

interface TapPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  tap: any;
  sidang: any;
}

export function TapPrintModal({ isOpen, onClose, tap, sidang }: TapPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [qrUrl, setQrUrl] = useState("");

  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/sidang/verifikasi/${tap?.nomorTap}`;

  useEffect(() => {
    if (tap) {
      QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 })
        .then(setQrUrl)
        .catch(console.error);
    }
  }, [tap, verifyUrl]);

  if (!tap || !sidang) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Surat Ketetapan Sidang Pleno ({tap.nomorTap})
          </DialogTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Cetak Naskah SK
            </Button>
          </div>
        </DialogHeader>

        {/* Naskah Ketetapan Format Resmi Indonesia */}
        <div
          ref={printRef}
          className="p-10 border bg-white text-slate-900 rounded-lg shadow space-y-6 my-4 select-none print:m-0 print:border-none print:shadow-none font-serif text-sm leading-relaxed"
        >
          {/* Judul & Nomor TAP */}
          <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4">
            <h2 className="text-base font-bold uppercase tracking-widest text-slate-700">
              PRESIDIUM SIDANG PLENO
            </h2>
            <h3 className="text-lg font-black uppercase text-slate-950">
              {sidang.namaMusyawarah}
            </h3>
            <p className="font-mono text-sm font-bold text-slate-800">
              SURAT KETETAPAN NOMOR: {tap.nomorTap}
            </p>
            <div className="pt-2">
              <p className="text-xs font-semibold uppercase text-slate-600">TENTANG</p>
              <p className="text-base font-black uppercase text-slate-900 max-w-xl mx-auto">
                {tap.tentang}
              </p>
            </div>
          </div>

          <div className="text-center italic font-bold text-xs uppercase tracking-wider py-1">
            DENGAN RAHMAT TUHAN YANG MAHA ESA
            <br />
            PRESIDIUM SIDANG {sidang.namaMusyawarah},
          </div>

          {/* Konsideran */}
          <div className="space-y-3 text-xs leading-normal">
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold uppercase">Menimbang</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <div className="col-span-9 whitespace-pre-wrap">{tap.konsideranMenimbang}</div>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold uppercase">Mengingat</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <div className="col-span-9 whitespace-pre-wrap">{tap.konsideranMengingat}</div>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold uppercase">Memperhatikan</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <div className="col-span-9 whitespace-pre-wrap">{tap.konsideranMemperhatikan}</div>
            </div>
          </div>

          {/* Memutuskan & Menetapkan */}
          <div className="text-center font-bold text-sm uppercase tracking-wider py-2 border-y border-slate-900/40">
            MEMUTUSKAN
          </div>

          <div className="space-y-3 text-xs leading-normal">
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold uppercase">Menetapkan</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <div className="col-span-9 font-bold uppercase text-slate-900">
                {tap.tentang}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold uppercase">Pasal / Diktum</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <div className="col-span-9 space-y-2 whitespace-pre-wrap">
                <div>
                  <span className="font-bold underline block mb-1">MEMUTUSKAN:</span>
                  <p>{tap.diktumMemutuskan}</p>
                </div>
                <div>
                  <span className="font-bold underline block mb-1">MENETAPKAN:</span>
                  <p>{tap.diktumMenetapkan}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Waktu & Lokasi Pengesahan */}
          <div className="text-right text-xs pt-4 border-t border-slate-900/20">
            <p>
              Ditetapkan di : <span className="font-bold">{tap.tempatDitetapkan}</span>
            </p>
            <p>
              Pada Tanggal :{" "}
              <span className="font-bold">
                {new Date(tap.tanggalDitetapkan).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>

          {/* Tanda Tangan Presidium Sidang */}
          <div className="pt-6">
            <p className="text-center font-bold text-xs uppercase mb-8">
              PRESIDIUM SIDANG PLENO
            </p>
            <div className="grid grid-cols-3 text-center text-xs">
              <div className="space-y-14">
                <p className="font-semibold text-slate-700">Presidium Sidang I</p>
                <div className="border-b border-slate-900 max-w-[140px] mx-auto pb-1 font-bold uppercase">
                  {sidang.presidium1 || "( .................................. )"}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="p-1 border border-slate-300 rounded bg-white">
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR Validasi" className="w-[65px] h-[65px]" />
                  ) : (
                    <div className="w-[65px] h-[65px] bg-slate-100" />
                  )}
                </div>
                <p className="text-[9px] font-mono text-slate-500">QR Validasi Konsideran</p>
              </div>

              <div className="space-y-14">
                <p className="font-semibold text-slate-700">Presidium Sidang II</p>
                <div className="border-b border-slate-900 max-w-[140px] mx-auto pb-1 font-bold uppercase">
                  {sidang.presidium2 || "( .................................. )"}
                </div>
              </div>
            </div>

            {sidang.presidium3 && (
              <div className="text-center text-xs pt-6">
                <div className="space-y-14 max-w-[180px] mx-auto">
                  <p className="font-semibold text-slate-700">Presidium Sidang III</p>
                  <div className="border-b border-slate-900 pb-1 font-bold uppercase">
                    {sidang.presidium3}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

