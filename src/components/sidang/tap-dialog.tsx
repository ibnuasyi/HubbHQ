"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sidangId: string;
}

export function TapDialog({ isOpen, onClose, onSuccess, sidangId }: TapDialogProps) {
  const [nomorTap, setNomorTap] = useState("");
  const [tentang, setTentang] = useState("");
  const [konsideranMenimbang, setKonsideranMenimbang] = useState(
    "a. Bahwa untuk menjamin kepastian tata tertib dan legalitas persidangan...\nb. Bahwa berdasarkan evaluasi sidang pleno..."
  );
  const [konsideranMengingat, setKonsideranMengingat] = useState(
    "1. Anggaran Dasar (AD) Bab IV tentang Permusyawaratan.\n2. Anggaran Rumah Tangga (ART) Pasal 18 tentang Tata Tertib Sidang."
  );
  const [konsideranMemperhatikan, setKonsideranMemperhatikan] = useState(
    "1. Pandangan umum dan tanggapan fraksi/utusan pada Sidang Pleno.\n2. Hasil musyawarah mufakat forum sidang pleno."
  );
  const [diktumMemutuskan, setDiktumMemutuskan] = useState(
    "Mengesahkan secara sah dan mengikat materi persidangan ini bagi seluruh jajaran kepengurusan dan anggota organisasi."
  );
  const [diktumMenetapkan, setDiktumMenetapkan] = useState(
    "Pasal 1: Ketetapan ini berlaku sejak tanggal ditetapkan.\nPasal 2: Apabila terdapat kekeliruan akan diperbaiki sesuai mekanisme AD/ART."
  );
  const [tempatDitetapkan, setTempatDitetapkan] = useState("Ruang Sidang Pleno");
  const [tanggalDitetapkan, setTanggalDitetapkan] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorTap.trim() || !tentang.trim()) {
      alert("Nomor TAP dan tentang ketetapan wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sidang/${sidangId}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomorTap,
          tentang,
          konsideranMenimbang,
          konsideranMengingat,
          konsideranMemperhatikan,
          diktumMemutuskan,
          diktumMenetapkan,
          tempatDitetapkan,
          tanggalDitetapkan,
          isDisahkan: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menerbitkan Surat Ketetapan");
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Draf & Terbitkan Surat Ketetapan (TAP Sidang Pleno)
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="noTap">Nomor Ketetapan / TAP *</Label>
              <Input
                id="noTap"
                required
                placeholder="Contoh: TAP. 03/MUBES-XXIV/2026"
                value={nomorTap}
                onChange={(e) => setNomorTap(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tglTap">Tanggal Pengesahan</Label>
              <Input
                id="tglTap"
                type="date"
                required
                value={tanggalDitetapkan}
                onChange={(e) => setTanggalDitetapkan(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="tentang">TENTANG (Judul Ketetapan) *</Label>
            <Input
              id="tentang"
              required
              placeholder="Contoh: PENGESAHAN LAPORAN PERTANGGUNGJAWABAN PENGURUS DEMISIONER"
              value={tentang}
              onChange={(e) => setTentang(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="menimbang">Konsideran Menimbang</Label>
            <Textarea
              id="menimbang"
              rows={2}
              value={konsideranMenimbang}
              onChange={(e) => setKonsideranMenimbang(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="mengingat">Konsideran Mengingat</Label>
            <Textarea
              id="mengingat"
              rows={2}
              value={konsideranMengingat}
              onChange={(e) => setKonsideranMengingat(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="memperhatikan">Konsideran Memperhatikan</Label>
            <Textarea
              id="memperhatikan"
              rows={2}
              value={konsideranMemperhatikan}
              onChange={(e) => setKonsideranMemperhatikan(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="memutuskan">Diktum MEMUTUSKAN</Label>
            <Textarea
              id="memutuskan"
              rows={2}
              value={diktumMemutuskan}
              onChange={(e) => setDiktumMemutuskan(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="menetapkan">Diktum MENETAPKAN</Label>
            <Textarea
              id="menetapkan"
              rows={3}
              value={diktumMenetapkan}
              onChange={(e) => setDiktumMenetapkan(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tempat">Tempat Ditetapkan</Label>
            <Input
              id="tempat"
              placeholder="Gedung Pemuda Lt. 2 / Ruang Pleno"
              value={tempatDitetapkan}
              onChange={(e) => setTempatDitetapkan(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menerbitkan..." : "Sahkan Surat Ketetapan (TAP)"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

