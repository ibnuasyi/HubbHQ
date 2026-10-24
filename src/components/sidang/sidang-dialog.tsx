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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SidangDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SidangDialog({ isOpen, onClose, onSuccess }: SidangDialogProps) {
  const [namaMusyawarah, setNamaMusyawarah] = useState("");
  const [tema, setTema] = useState("");
  const [tempat, setTempat] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [presidium1, setPresidium1] = useState("");
  const [presidium2, setPresidium2] = useState("");
  const [presidium3, setPresidium3] = useState("");
  const [totalKuorum, setTotalKuorum] = useState("30");
  const [status, setStatus] = useState("PERSIAPAN");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/sidang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaMusyawarah,
          tema,
          tempat,
          tanggalMulai,
          tanggalSelesai,
          presidium1,
          presidium2,
          presidium3,
          totalKuorum,
          status,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat musyawarah");
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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Buka Forum Musyawarah / Mubes Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="namaMubes">Nama Agenda Musyawarah *</Label>
            <Input
              id="namaMubes"
              required
              placeholder="Contoh: Musyawarah Besar XXIV / Kongres Wilayah 2026"
              value={namaMusyawarah}
              onChange={(e) => setNamaMusyawarah(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tema">Tema Musyawarah</Label>
            <Textarea
              id="tema"
              rows={2}
              placeholder="Tema sentral kepemimpinan atau pembaharuan..."
              value={tema}
              onChange={(e) => setTema(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="tempat">Tempat / Ruang Sidang *</Label>
              <Input
                id="tempat"
                required
                placeholder="Aula Pertemuan Lt. 2"
                value={tempat}
                onChange={(e) => setTempat(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="kuorum">Target Peserta Penuh (Kuorum)</Label>
              <Input
                id="kuorum"
                type="number"
                value={totalKuorum}
                onChange={(e) => setTotalKuorum(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="tglMulai">Tanggal Mulai *</Label>
              <Input
                id="tglMulai"
                type="date"
                required
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tglSelesai">Tanggal Selesai *</Label>
              <Input
                id="tglSelesai"
                type="date"
                required
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
              />
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Susunan Pimpinan Sidang (Presidium Pleno)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Presidium I</Label>
                <Input
                  placeholder="Ketua Sidang"
                  value={presidium1}
                  onChange={(e) => setPresidium1(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Presidium II</Label>
                <Input
                  placeholder="Sekretaris Sidang"
                  value={presidium2}
                  onChange={(e) => setPresidium2(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Presidium III</Label>
                <Input
                  placeholder="Anggota Sidang"
                  value={presidium3}
                  onChange={(e) => setPresidium3(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Buat Musyawarah"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

