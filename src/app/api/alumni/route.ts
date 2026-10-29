export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const tahunLulus = searchParams.get("tahunLulus");
    const angkatanMasuk = searchParams.get("angkatanMasuk");
    const profesi = searchParams.get("profesi");

    const where: any = {};
    if (tahunLulus && tahunLulus !== "ALL") where.tahunLulus = Number(tahunLulus);
    if (angkatanMasuk && angkatanMasuk !== "ALL") where.angkatanMasuk = Number(angkatanMasuk);
    if (profesi && profesi !== "ALL") where.profesi = { contains: profesi };

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { instansiBekerja: { contains: search } },
        { domisili: { contains: search } },
        { jabatanTerakhir: { contains: search } },
      ];
    }

    const alumni = await prisma.alumni.findMany({
      where,
      include: {
        _count: {
          select: { donasi: true },
        },
      },
      orderBy: [{ tahunLulus: "desc" }, { nama: "asc" }],
    });

    return NextResponse.json({ data: alumni });
  } catch (error) {
    console.error("Error fetching alumni:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      nama,
      angkatanMasuk,
      tahunLulus,
      jabatanTerakhir,
      profesi,
      instansiBekerja,
      email,
      phone,
      domisili,
      linkedin,
      bio,
      isKontributorAktif = false,
      userId,
    } = body;

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || '';
    const canManage =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'members.create'));
    const isSelf = Boolean(userId && userId === session.user.id);

    if (!canManage && !isSelf) {
      return NextResponse.json(
        { error: "Forbidden: Hanya pengurus atau pemilik akun yang dapat menambahkan data alumni" },
        { status: 403 }
      );
    }

    if (!nama || !angkatanMasuk || !tahunLulus) {
      return NextResponse.json(
        { error: "Nama, angkatan masuk, dan tahun lulus wajib diisi" },
        { status: 400 }
      );
    }

    const created = await prisma.alumni.create({
      data: {
        userId: userId || null,
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
        isKontributorAktif: Boolean(isKontributorAktif),
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Error creating alumni:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menambahkan data alumni" },
      { status: 500 }
    );
  }
}
