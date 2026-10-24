"use client";

import { useState, useEffect } from "react";
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
  Scale,
  Plus,
  Calendar,
  MapPin,
  FileText,
  Users,
  ArrowRight,
  Gavel,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { SidangDialog } from "@/components/sidang/sidang-dialog";

export default function DashboardSidangPage() {
  const [sidangs, setSidangs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpenDialog, setIsOpenDialog] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sidang");
      const json = await res.json();
      if (res.ok) setSidangs(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BERLANGSUNG":
        return <Badge className="bg-emerald-600 animate-pulse"><Gavel className="w-3 h-3 mr-1" /> Sidang Berlangsung</Badge>;
      case "SKORSING":
        return <Badge className="bg-amber-600"><Clock className="w-3 h-3 mr-1" /> Diskorsing</Badge>;
      case "DITUTUP":
        return <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 mr-1" /> Ditutup / Selesai</Badge>;
      default:
        return <Badge variant="outline">Persiapan Forum</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Persidangan Pleno & Risalah Ketetapan (TAP Mubes)
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola tata tertib persidangan, risalah dinamika pleno, pencatatan kuorum, dan konsideran Surat Ketetapan (TAP).
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsOpenDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Buka Agenda Musyawarah
          </Button>
        </div>
      </div>

      {/* Grid Sidang Musyawarah */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
            Memuat data agenda musyawarah...
          </div>
        ) : sidangs.length === 0 ? (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
            Belum ada agenda persidangan musyawarah. Klik tombol di atas untuk membuat forum pertama.
          </div>
        ) : (
          sidangs.map((s) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  {getStatusBadge(s.status)}
                  <span className="font-mono text-xs text-muted-foreground">
                    Kuorum: {s.totalKuorum} Orang
                  </span>
                </div>
                <CardTitle className="text-base leading-snug">{s.namaMusyawarah}</CardTitle>
                {s.tema && (
                  <CardDescription className="text-xs line-clamp-2 italic">
                    "{s.tema}"
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {new Date(s.tanggalMulai).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    -{" "}
                    {new Date(s.tanggalSelesai).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="line-clamp-1">{s.tempat}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px] text-muted-foreground">
                  <div>
                    <span>Risalah Pleno:</span>
                    <p className="font-bold text-foreground">{s._count?.risalah || 0} Agenda</p>
                  </div>
                  <div>
                    <span>Ketetapan Sah (TAP):</span>
                    <p className="font-bold text-primary">{s._count?.ketetapanSK || 0} Berkas</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href={`/dashboard/sidang/${s.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Meja Presidium Sidang <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <SidangDialog
        isOpen={isOpenDialog}
        onClose={() => setIsOpenDialog(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}

