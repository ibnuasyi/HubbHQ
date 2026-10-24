export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jenjangId = searchParams.get("jenjangId");
    const status = searchParams.get("status");

    const where: any = {};
    if (jenjangId && jenjangId !== "ALL") where.jenjangId = jenjangId;
    if (status && status !== "ALL") where.status = status;

    const batches = await prisma.diklatBatch.findMany({
      where,
      include: {
        jenjang: true,
        _count: {
          select: { peserta: true },
        },
      },
      orderBy: { tanggalMulai: "desc" },
    });

    return NextResponse.json({ data: batches });
  } catch (error) {
    console.error("Error fetching batches:", error);
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
      (await hasPermission(session.user.id, 'members.edit')) ||
      (await hasPermission(session.user.id, 'proker.create'));

    if (!canCreate) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Pimpinan atau Bidang Kaderisasi yang dapat membuka angkatan diklat" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      jenjangId,
      kodeBatch,
      namaDiklat,
      tanggalMulai,
      tanggalSelesai,
      lokasi,
      biayaPendaftaran = 0,
      kuota = 50,
      motNama,
      skKepanitiaan,
      status = "DRAFT",
    } = body;

    if (!jenjangId || !kodeBatch || !namaDiklat || !tanggalMulai || !tanggalSelesai || !lokasi) {
      return NextResponse.json(
        { error: "Mohon lengkapi seluruh field wajib batch diklat" },
        { status: 400 }
      );
    }

    const created = await prisma.diklatBatch.create({
      data: {
        jenjangId,
        kodeBatch: kodeBatch.trim().toUpperCase(),
        namaDiklat,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
        lokasi,
        biayaPendaftaran: Number(biayaPendaftaran) || 0,
        kuota: Number(kuota) || 50,
        motNama,
        skKepanitiaan,
        status: status || "DRAFT",
      },
      include: { jenjang: true },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Error creating batch:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat angkatan diklat" },
      { status: 500 }
    );
  }
}
