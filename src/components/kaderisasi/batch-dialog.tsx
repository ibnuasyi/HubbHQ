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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jenjangList: any[];
}

export function BatchDialog({ isOpen, onClose, onSuccess, jenjangList }: BatchDialogProps) {
  const [jenjangId, setJenjangId] = useState("");
  const [kodeBatch, setKodeBatch] = useState("");
  const [namaDiklat, setNamaDiklat] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [biayaPendaftaran, setBiayaPendaftaran] = useState("0");
  const [kuota, setKuota] = useState("50");
  const [motNama, setMotNama] = useState("");
  const [skKepanitiaan, setSkKepanitiaan] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenjangId) {
      alert("Pilih jenjang kaderisasi");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/kaderisasi/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenjangId,
          kodeBatch,
          namaDiklat,
          tanggalMulai,
          tanggalSelesai,
          lokasi,
          biayaPendaftaran,
          kuota,
          motNama,
          skKepanitiaan,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat batch diklat");
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
          <DialogTitle className="text-lg">Buka Angkatan / Batch Diklat Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="jenjang">Jenjang Kaderisasi *</Label>
            <Select value={jenjangId} onValueChange={setJenjangId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Jenjang" />
              </SelectTrigger>
              <SelectContent>
                {jenjangList.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    Tingkat {j.urutan}: {j.namaJenjang} ({j.singkatan})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="kodeBatch">Kode Batch *</Label>
              <Input
                id="kodeBatch"
                required
                placeholder="Contoh: LK1-2026-01"
                value={kodeBatch}
                onChange={(e) => setKodeBatch(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">Status Awal</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDAFTARAN">Buka Pendaftaran</SelectItem>
                  <SelectItem value="BERJALAN">Sedang Berjalan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="namaDiklat">Nama Kegiatan Diklat *</Label>
            <Input
              id="namaDiklat"
              required
              placeholder="Contoh: Latihan Kader 1 Angkatan XXV Komisariat Teknik"
              value={namaDiklat}
              onChange={(e) => setNamaDiklat(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="tanggalMulai">Tanggal Mulai *</Label>
              <Input
                id="tanggalMulai"
                type="date"
                required
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tanggalSelesai">Tanggal Selesai *</Label>
              <Input
                id="tanggalSelesai"
                type="date"
                required
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="lokasi">Lokasi Kegiatan *</Label>
            <Input
              id="lokasi"
              required
              placeholder="Contoh: Wisma Atlet / Aula Gedung Pemuda"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="biaya">Biaya Registrasi Peserta (Rp)</Label>
              <Input
                id="biaya"
                type="number"
                value={biayaPendaftaran}
                onChange={(e) => setBiayaPendaftaran(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="kuota">Target Kuota Peserta</Label>
              <Input
                id="kuota"
                type="number"
                value={kuota}
                onChange={(e) => setKuota(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="motNama">Master of Training / MoT</Label>
              <Input
                id="motNama"
                placeholder="Nama Pimpinan Latihan"
                value={motNama}
                onChange={(e) => setMotNama(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sk">Nomor SK Kepanitiaan</Label>
              <Input
                id="sk"
                placeholder="SK/012/PAN-DIKLAT/2026"
                value={skKepanitiaan}
                onChange={(e) => setSkKepanitiaan(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Buat Batch Diklat"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

