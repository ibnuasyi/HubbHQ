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

interface DonasiDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  alumniList: any[];
  preselectedAlumniId?: string;
}

export function DonasiDialog({
  isOpen,
  onClose,
  onSuccess,
  alumniList,
  preselectedAlumniId,
}: DonasiDialogProps) {
  const [alumniId, setAlumniId] = useState(preselectedAlumniId || "UMUM");
  const [namaDonatur, setNamaDonatur] = useState("");
  const [nominal, setNominal] = useState("");
  const [programDonasi, setProgramDonasi] = useState("DANA_ABADI");
  const [metodeBayar, setMetodeBayar] = useState("QRIS");
  const [referensiBayar, setReferensiBayar] = useState("");
  const [catatan, setCatatan] = useState("");
  const [pesanAlumni, setPesanAlumni] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAlumniChange = (val: string) => {
    setAlumniId(val);
    if (val !== "UMUM") {
      const selected = alumniList.find((a) => a.id === val);
      if (selected) {
        setNamaDonatur(selected.nama);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaDonatur.trim() || !nominal) {
      alert("Nama donatur dan nominal wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/alumni/donasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alumniId: alumniId === "UMUM" ? null : alumniId,
          namaDonatur,
          nominal: Number(nominal),
          programDonasi,
          metodeBayar,
          referensiBayar,
          catatan,
          pesanAlumni,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mencatat donasi");
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Catat Penerimaan Donasi / Dana Abadi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Tautkan Profil Alumni (Opsional)</Label>
            <Select value={alumniId} onValueChange={handleAlumniChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Alumni" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UMUM">Donatur Umum / Simpatisan</SelectItem>
                {alumniList.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nama} (Lulus {a.tahunLulus})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="namaDonatur">Nama Lengkap Donatur *</Label>
            <Input
              id="namaDonatur"
              required
              placeholder="Nama donatur / hamba Allah"
              value={namaDonatur}
              onChange={(e) => setNamaDonatur(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="nominal">Nominal Donasi (Rp) *</Label>
            <Input
              id="nominal"
              type="number"
              required
              min={1000}
              placeholder="Contoh: 500000"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Alokasi Program</Label>
              <Select value={programDonasi} onValueChange={setProgramDonasi}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DANA_ABADI">Dana Abadi Organisasi</SelectItem>
                  <SelectItem value="BEASISWA_KADER">Beasiswa Kader Berprestasi</SelectItem>
                  <SelectItem value="RENOVASI_SEKRETARIAT">Renovasi Sekretariat</SelectItem>
                  <SelectItem value="TANGGAP_BENCANA">Aksi Tanggap Bencana</SelectItem>
                  <SelectItem value="SPONSOR_ACARA">Sponsor Kegiatan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Metode Pembayaran</Label>
              <Select value={metodeBayar} onValueChange={setMetodeBayar}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QRIS">QRIS Dinamis</SelectItem>
                  <SelectItem value="TRANSFER_BANK">Transfer Bank</SelectItem>
                  <SelectItem value="TUNAI">Tunai / Langsung</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ref">No. Referensi / Bukti Transfer</Label>
            <Input
              id="ref"
              placeholder="ID transaksi m-banking atau QRIS"
              value={referensiBayar}
              onChange={(e) => setReferensiBayar(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="pesan">Pesan & Doa dari Donatur</Label>
            <Textarea
              id="pesan"
              rows={2}
              placeholder="Pesan penyemangat untuk adik-adik pengurus..."
              value={pesanAlumni}
              onChange={(e) => setPesanAlumni(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Penerimaan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

