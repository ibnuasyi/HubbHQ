export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const programDonasi = searchParams.get("programDonasi");
    const status = searchParams.get("status");

    const where: any = {};
    if (programDonasi && programDonasi !== "ALL") where.programDonasi = programDonasi;
    if (status && status !== "ALL") where.status = status;

    const donasiList = await prisma.alumniDonasi.findMany({
      where,
      include: {
        alumni: {
          select: { id: true, nama: true, angkatanMasuk: true, tahunLulus: true, profesi: true },
        },
      },
      orderBy: { tanggalBayar: "desc" },
    });

    return NextResponse.json({ data: donasiList });
  } catch (error) {
    console.error("Error fetching donasi alumni:", error);
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
    const canManageFinances =
      ['admin', 'bendahara', 'ketua'].includes(roleName) ||
      (await hasPermission(session.user.id, 'keuangan.create')) ||
      (await hasPermission(session.user.id, 'keuangan.approve'));

    const body = await req.json();
    const {
      alumniId,
      namaDonatur,
      nominal,
      programDonasi = "DANA_ABADI",
      metodeBayar = "QRIS",
      referensiBayar,
      status: requestedStatus,
      catatan,
      pesanAlumni,
    } = body;

    // Hanya pengurus keuangan / admin yang dapat langsung menandai status TERVERIFIKASI
    const status = canManageFinances
      ? (requestedStatus || "TERVERIFIKASI")
      : "PENDING";

    if (!namaDonatur || !nominal) {
      return NextResponse.json(
        { error: "Nama donatur dan nominal donasi wajib diisi" },
        { status: 400 }
      );
    }

    const created = await prisma.alumniDonasi.create({
      data: {
        alumniId: alumniId || null,
        namaDonatur,
        nominal: Number(nominal),
        programDonasi,
        metodeBayar,
        referensiBayar,
        status,
        catatan,
        pesanAlumni,
      },
    });

    // Jika alumniId ada, tandai alumni sebagai kontributor aktif
    if (alumniId) {
      await prisma.alumni.update({
        where: { id: alumniId },
        data: { isKontributorAktif: true },
      });
    }

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Error recording donasi alumni:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mencatat donasi" },
      { status: 500 }
    );
  }
}
