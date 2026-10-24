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
    const risalah = await prisma.sidangRisalah.findMany({
      where: { sidangId: id },
      orderBy: { waktuMulai: "asc" },
    });

    return NextResponse.json({ data: risalah });
  } catch (error) {
    console.error("Error fetching risalah:", error);
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
    const canRecordRisalah =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'proker.edit'));

    if (!canRecordRisalah) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Notulis Sidang, Pimpinan, atau Admin yang berwenang mencatat risalah sidang" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { agenda, waktuMulai, waktuSelesai, isiRisalah, interupsiDanDinamika, notulisNama } = body;

    if (!agenda || !isiRisalah || !notulisNama) {
      return NextResponse.json(
        { error: "Agenda sidang, isi risalah, dan nama notulis wajib diisi" },
        { status: 400 }
      );
    }

    const created = await prisma.sidangRisalah.create({
      data: {
        sidangId: id,
        agenda,
        waktuMulai: waktuMulai ? new Date(waktuMulai) : new Date(),
        waktuSelesai: waktuSelesai ? new Date(waktuSelesai) : null,
        isiRisalah,
        interupsiDanDinamika,
        notulisNama,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Error creating risalah:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mencatat risalah" },
      { status: 500 }
    );
  }
}
