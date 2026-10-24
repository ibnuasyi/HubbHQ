"use client";

import { useState, useEffect } from "react";
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

interface AlumniDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingAlumni?: any;
}

export function AlumniDialog({
  isOpen,
  onClose,
  onSuccess,
  editingAlumni,
}: AlumniDialogProps) {
  const [nama, setNama] = useState("");
  const [angkatanMasuk, setAngkatanMasuk] = useState("");
  const [tahunLulus, setTahunLulus] = useState("");
  const [jabatanTerakhir, setJabatanTerakhir] = useState("");
  const [profesi, setProfesi] = useState("");
  const [instansiBekerja, setInstansiBekerja] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [domisili, setDomisili] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingAlumni) {
      setNama(editingAlumni.nama || "");
      setAngkatanMasuk(String(editingAlumni.angkatanMasuk || ""));
      setTahunLulus(String(editingAlumni.tahunLulus || ""));
      setJabatanTerakhir(editingAlumni.jabatanTerakhir || "");
      setProfesi(editingAlumni.profesi || "");
      setInstansiBekerja(editingAlumni.instansiBekerja || "");
      setEmail(editingAlumni.email || "");
      setPhone(editingAlumni.phone || "");
      setDomisili(editingAlumni.domisili || "");
      setLinkedin(editingAlumni.linkedin || "");
      setBio(editingAlumni.bio || "");
    } else {
      setNama("");
      setAngkatanMasuk(String(new Date().getFullYear() - 4));
      setTahunLulus(String(new Date().getFullYear()));
      setJabatanTerakhir("");
      setProfesi("");
      setInstansiBekerja("");
      setEmail("");
      setPhone("");
      setDomisili("");
      setLinkedin("");
      setBio("");
    }
  }, [editingAlumni, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingAlumni ? `/api/alumni/${editingAlumni.id}` : "/api/alumni";
      const method = editingAlumni ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          angkatanMasuk: Number(angkatanMasuk),
          tahunLulus: Number(tahunLulus),
          jabatanTerakhir,
          profesi,
          instansiBekerja,
          email,
          phone,
          domisili,
          linkedin,
          bio,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan data alumni");
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
          <DialogTitle className="text-lg">
            {editingAlumni ? "Ubah Data Profil Alumni" : "Tambah Profil Alumni / Senior"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="nama">Nama Lengkap & Gelar *</Label>
            <Input
              id="nama"
              required
              placeholder="Contoh: Dr. Budi Santoso, S.T., M.Kom"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="angkatan">Angkatan Masuk Organisasi *</Label>
              <Input
                id="angkatan"
                type="number"
                required
                placeholder="2018"
                value={angkatanMasuk}
                onChange={(e) => setAngkatanMasuk(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lulus">Tahun Demisioner / Lulus *</Label>
              <Input
                id="lulus"
                type="number"
                required
                placeholder="2022"
                value={tahunLulus}
                onChange={(e) => setTahunLulus(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="jabatan">Jabatan Terakhir di Organisasi</Label>
            <Input
              id="jabatan"
              placeholder="Contoh: Ketua Umum Periode 2021/2022"
              value={jabatanTerakhir}
              onChange={(e) => setJabatanTerakhir(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="profesi">Profesi / Keahlian</Label>
              <Input
                id="profesi"
                placeholder="Contoh: Software Engineer / Pengusaha"
                value={profesi}
                onChange={(e) => setProfesi(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="instansi">Instansi / Perusahaan Tempat Bekerja</Label>
              <Input
                id="instansi"
                placeholder="Contoh: PT Telkom Indonesia"
                value={instansiBekerja}
                onChange={(e) => setInstansiBekerja(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@alumni.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">No. WhatsApp</Label>
              <Input
                id="phone"
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="domisili">Kota Domisili Saat Ini</Label>
              <Input
                id="domisili"
                placeholder="Contoh: Jakarta Selatan"
                value={domisili}
                onChange={(e) => setDomisili(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="linkedin">Tautan LinkedIn / Profil</Label>
              <Input
                id="linkedin"
                placeholder="linkedin.com/in/username"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bio">Catatan Singkat / Bio</Label>
            <Textarea
              id="bio"
              rows={2}
              placeholder="Minat riset, kesediaan menjadi mentor, atau portofolio..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Profil Alumni"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

