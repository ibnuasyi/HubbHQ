export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const taps = await prisma.sidangKetetapanSK.findMany({
      where: { sidangId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: taps });
  } catch (error) {
    console.error("Error fetching TAP SK:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || '';
    const canIssueTap =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'surat.approve')) ||
      (await hasPermission(session.user.id, 'proker.edit'));

    if (!canIssueTap) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Presidium Sidang, Pimpinan, atau Admin yang berwenang menerbitkan Surat Ketetapan (TAP)" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const {
      nomorTap,
      tentang,
      konsideranMenimbang,
      konsideranMengingat,
      konsideranMemperhatikan,
      diktumMemutuskan,
      diktumMenetapkan,
      tanggalDitetapkan,
      tempatDitetapkan,
      isDisahkan = true,
    } = body;

    if (!nomorTap || !tentang || !diktumMemutuskan || !diktumMenetapkan) {
      return NextResponse.json(
        { error: "Nomor TAP, tentang, diktum memutuskan, dan menetapkan wajib diisi" },
        { status: 400 }
      );
    }

    const created = await prisma.sidangKetetapanSK.create({
      data: {
        sidangId: id,
        nomorTap: nomorTap.trim().toUpperCase(),
        tentang,
        konsideranMenimbang: konsideranMenimbang || "Bahwa demi kelancaran mekanisme roda organisasi...",
        konsideranMengingat: konsideranMengingat || "Anggaran Dasar dan Anggaran Rumah Tangga...",
        konsideranMemperhatikan: konsideranMemperhatikan || "Hasil permusyawaratan sidang pleno...",
        diktumMemutuskan,
        diktumMenetapkan,
        tanggalDitetapkan: tanggalDitetapkan ? new Date(tanggalDitetapkan) : new Date(),
        tempatDitetapkan: tempatDitetapkan || "Ruang Sidang Pleno",
        isDisahkan: Boolean(isDisahkan),
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Error creating TAP SK:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menerbitkan Surat Ketetapan" },
      { status: 500 }
    );
  }
}
