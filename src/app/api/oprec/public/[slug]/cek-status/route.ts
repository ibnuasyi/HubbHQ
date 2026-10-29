export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/api-security";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous";
    const rate = checkRateLimit(`oprec-cek-status:${clientIp}`, {
      windowMs: 60000,
      maxRequests: 15,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan pengecekan status. Silakan tunggu 1 menit." },
        { status: 429 }
      );
    }

    const { slug } = await context.params;
    const { searchKey } = await req.json();

    if (!searchKey?.trim() || String(searchKey).trim().length < 4) {
      return NextResponse.json(
        { error: "Masukkan Nomor Registrasi atau NIM lengkap Anda" },
        { status: 400 }
      );
    }

    const oprec = await prisma.oprecEvent.findUnique({
      where: { slug },
    });

    if (!oprec) {
      return NextResponse.json({ error: "Agenda oprec tidak ditemukan" }, { status: 404 });
    }

    const key = searchKey.trim();
    const pendaftar = await prisma.oprecPendaftar.findFirst({
      where: {
        oprecId: oprec.id,
        OR: [
          { nomorRegistrasi: key.toUpperCase() },
          { nimOrNra: key },
          { email: key.toLowerCase() },
        ],
      },
    });

    if (!pendaftar) {
      return NextResponse.json(
        { error: "Data pendaftaran dengan Nomor Registrasi / NIM tersebut tidak ditemukan" },
        { status: 404 }
      );
    }

    // Jika pengumuman belum dibuka oleh panitia
    if (!oprec.isPengumumanBuka) {
      return NextResponse.json({
        isPengumumanBuka: false,
        message: "Tahap seleksi sedang berlangsung. Hasil pengumuman resmi belum dibuka oleh panitia/pengurus.",
        pendaftar: {
          nomorRegistrasi: pendaftar.nomorRegistrasi,
          namaLengkap: pendaftar.namaLengkap,
          divisiPilihan1: pendaftar.divisiPilihan1,
          divisiPilihan2: pendaftar.divisiPilihan2,
          tanggalDaftar: pendaftar.createdAt,
        },
      });
    }

    return NextResponse.json({
      isPengumumanBuka: true,
      pendaftar: {
        nomorRegistrasi: pendaftar.nomorRegistrasi,
        namaLengkap: pendaftar.namaLengkap,
        statusTahap: pendaftar.statusTahap,
        divisiDiterima: pendaftar.divisiDiterima,
        jabatanDiterima: pendaftar.jabatanDiterima,
        divisiPilihan1: pendaftar.divisiPilihan1,
        divisiPilihan2: pendaftar.divisiPilihan2,
      },
    });
  } catch (error) {
    console.error("Error checking oprec status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

