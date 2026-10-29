export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission, isSuperAdminRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sidangs = await prisma.sidangMusyawarah.findMany({
      include: {
        _count: {
          select: { risalah: true, ketetapanSK: true },
        },
      },
      orderBy: { tanggalMulai: "desc" },
    });

    return NextResponse.json({ data: sidangs });
  } catch (error) {
    console.error("Error fetching sidang musyawarah:", error);
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
    const canCreateSidang =
      isSuperAdminRole((session.user as any)?.role) ||
      ['admin', 'superadmin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'proker.create')) ||
      (await hasPermission(session.user.id, 'proker.edit'));

    if (!canCreateSidang) {
      return NextResponse.json(
        { error: "Forbidden: Hanya pimpinan organisasi atau admin yang dapat membuat sidang musyawarah" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      namaMusyawarah,
      tema,
      tempat,
      tanggalMulai,
      tanggalSelesai,
      presidium1,
      presidium2,
      presidium3,
      totalKuorum = 0,
      status = "PERSIAPAN",
    } = body;

    if (!namaMusyawarah || !tempat || !tanggalMulai || !tanggalSelesai) {
      return NextResponse.json(
        { error: "Nama musyawarah, tempat, dan tanggal pelaksanaan wajib diisi" },
        { status: 400 }
      );
    }

    const created = await prisma.sidangMusyawarah.create({
      data: {
        namaMusyawarah,
        tema,
        tempat,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
        presidium1,
        presidium2,
        presidium3,
        totalKuorum: Number(totalKuorum) || 0,
        status,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Error creating sidang:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat sidang musyawarah" },
      { status: 500 }
    );
  }
}
