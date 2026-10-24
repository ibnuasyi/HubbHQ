export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || '';
    const canViewAllAspirasi =
      ['admin', 'ketua', 'sekretaris', 'pengurus'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit'));

    if (!canViewAllAspirasi) {
      return NextResponse.json(
        { error: "Forbidden: Hanya pengurus/pimpinan yang memiliki wewenang melihat daftar aspirasi masuk" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const kategori = searchParams.get("kategori");
    const urgensi = searchParams.get("urgensi");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (kategori && kategori !== "ALL") {
      where.kategori = kategori;
    }
    if (urgensi && urgensi !== "ALL") {
      where.urgensi = urgensi;
    }
    if (search) {
      where.OR = [
        { kodeTiket: { contains: search } },
        { judul: { contains: search } },
        { isi: { contains: search } },
        { namaPelapor: { contains: search } },
      ];
    }

    const [rawAspirasi, total, countByStatus] = await Promise.all([
      prisma.aspirasi.findMany({
        where,
        include: {
          ditindakLanjutOleh: {
            select: { id: true, name: true, nickname: true, avatar: true },
          },
          _count: {
            select: { tanggapan: true },
          },
        },
        orderBy: [{ urgensi: "desc" }, { createdAt: "desc" }],
      }),
      prisma.aspirasi.count({ where }),
      prisma.aspirasi.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    // Omit secret pinPelacak from all returned records
    const aspirasi = rawAspirasi.map(({ pinPelacak, ...rest }) => rest);

    const stats = {
      TOTAL: 0,
      MENUNGGU: 0,
      DIVERIFIKASI: 0,
      DALAM_ADVOKASI: 0,
      SELESAI: 0,
      DITOLAK: 0,
    };
    countByStatus.forEach((item) => {
      stats[item.status] = item._count._all;
      stats.TOTAL += item._count._all;
    });

    return NextResponse.json({ data: aspirasi, total, stats });
  } catch (error) {
    console.error("Error fetching aspirasi:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

