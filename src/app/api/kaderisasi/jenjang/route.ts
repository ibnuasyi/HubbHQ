export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    let jenjangList = await prisma.kaderisasiJenjang.findMany({
      orderBy: { urutan: "asc" },
      include: {
        _count: {
          select: { kader: true, batch: true },
        },
      },
    });

    // Auto-seed default jenjang jika masih kosong
    if (jenjangList.length === 0) {
      const defaults = [
        {
          urutan: 1,
          namaJenjang: "Kader Tingkat Dasar (LK 1 / Mapaba / LDKM / Diksar)",
          singkatan: "DASAR",
          deskripsi: "Pendidikan pengenalan nilai dasar organisasi, ideologi, dan etika berorganisasi.",
          syaratKelulusan: "Kehadiran minimal 85% forum dan lulus screening berkas/esai.",
          minBulanMenujuLanjut: 6,
        },
        {
          urutan: 2,
          namaJenjang: "Kader Tingkat Menengah (LK 2 / PKD / LKMM-TM)",
          singkatan: "MADYA",
          deskripsi: "Pendidikan manajemen kepemimpinan strategis, analisis sosial, dan teknik diplomasi.",
          syaratKelulusan: "Telah lulus Tingkat Dasar minimal 6 bulan dan membuat karya tulis ilmiah.",
          minBulanMenujuLanjut: 12,
        },
        {
          urutan: 3,
          namaJenjang: "Kader Tingkat Lanjut / Utama (LK 3 / PKL / LKMM-TL)",
          singkatan: "UTAMA",
          deskripsi: "Pendidikan kepemimpinan makro, wawasan kebangsaan, dan konseptor gerakan.",
          syaratKelulusan: "Telah lulus Tingkat Madya minimal 12 bulan dan rekomendasi pimpinan.",
          minBulanMenujuLanjut: 0,
        },
      ];

      for (const item of defaults) {
        await prisma.kaderisasiJenjang.create({ data: item });
      }

      jenjangList = await prisma.kaderisasiJenjang.findMany({
        orderBy: { urutan: "asc" },
        include: {
          _count: {
            select: { kader: true, batch: true },
          },
        },
      });
    }

    return NextResponse.json({ data: jenjangList });
  } catch (error) {
    console.error("Error fetching jenjang kaderisasi:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || '';
    const canCreate =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit'));

    if (!canCreate) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Administrator atau Pimpinan yang dapat menambah jenjang kaderisasi" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { urutan, namaJenjang, singkatan, deskripsi, syaratKelulusan, minBulanMenujuLanjut } = body;

    if (!urutan || !namaJenjang || !singkatan) {
      return NextResponse.json(
        { error: "Urutan, nama jenjang, dan singkatan wajib diisi" },
        { status: 400 }
      );
    }

    const created = await prisma.kaderisasiJenjang.create({
      data: {
        urutan: Number(urutan),
        namaJenjang,
        singkatan: singkatan.toUpperCase(),
        deskripsi,
        syaratKelulusan,
        minBulanMenujuLanjut: Number(minBulanMenujuLanjut) || 0,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Error creating jenjang:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat jenjang" },
      { status: 500 }
    );
  }
}
