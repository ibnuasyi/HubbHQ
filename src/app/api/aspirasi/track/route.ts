export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/api-security";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    // Batasi maksimal 5 percobaan per menit per IP untuk mencegah serangan brute-force PIN
    const rate = checkRateLimit(`track-aspirasi:${clientIp}`, { windowMs: 60000, maxRequests: 5 });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan pelacakan. Harap tunggu 1 menit sebelum mencoba kembali." },
        { status: 429 }
      );
    }

    const { kodeTiket, pinPelacak } = await req.json();

    if (!kodeTiket || !pinPelacak) {
      return NextResponse.json(
        { error: "Kode tiket dan PIN pelacak wajib diisi" },
        { status: 400 }
      );
    }

    const cleanKode = kodeTiket.trim().toUpperCase();
    const cleanPin = pinPelacak.trim();

    const aspirasi = await prisma.aspirasi.findFirst({
      where: {
        kodeTiket: cleanKode,
        pinPelacak: cleanPin,
      },
      include: {
        tanggapan: {
          where: { isInternal: false },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            pengirim: true,
            pesan: true,
            createdAt: true,
          },
        },
        ditindakLanjutOleh: {
          select: { name: true, nickname: true },
        },
      },
    });

    if (!aspirasi) {
      return NextResponse.json(
        { error: "Kombinasi kode tiket dan PIN pelacak tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hide confidential fields
    const safeData = {
      id: aspirasi.id,
      kodeTiket: aspirasi.kodeTiket,
      judul: aspirasi.judul,
      kategori: aspirasi.kategori,
      isi: aspirasi.isi,
      isAnonim: aspirasi.isAnonim,
      namaPelapor: aspirasi.isAnonim ? "Anonim" : aspirasi.namaPelapor,
      status: aspirasi.status,
      urgensi: aspirasi.urgensi,
      tindakLanjut: aspirasi.tindakLanjut,
      petugasPIC: aspirasi.ditindakLanjutOleh?.name || aspirasi.ditindakLanjutOleh?.nickname || "Biro Advokasi",
      tanggalSelesai: aspirasi.tanggalSelesai,
      createdAt: aspirasi.createdAt,
      updatedAt: aspirasi.updatedAt,
      tanggapan: aspirasi.tanggapan,
    };

    return NextResponse.json({ success: true, data: safeData });
  } catch (error) {
    console.error("Error tracking aspirasi:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

