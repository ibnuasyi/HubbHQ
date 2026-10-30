export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/api-security";

export async function POST(req: NextRequest) {
  try {
    const { kodeTiket, pinPelacak } = await req.json();

    if (!kodeTiket || !pinPelacak) {
      return NextResponse.json(
        { error: "Kode tiket dan PIN pelacak wajib diisi" },
        { status: 400 }
      );
    }

    const cleanKode = String(kodeTiket).trim().toUpperCase();
    const cleanPin = String(pinPelacak).trim();

    // 1. Rate-limit per tiket: cegah serangan brute-force PIN terhadap tiket tertentu (maks 5 percobaan per 15 menit)
    const ticketRate = checkRateLimit(`track-ticket:${cleanKode}`, { windowMs: 15 * 60 * 1000, maxRequests: 5 });
    if (!ticketRate.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan untuk tiket ini. Harap tunggu 15 menit demi keamanan." },
        { status: 429 }
      );
    }

    // 2. Rate-limit per IP: prioritaskan header tepercaya reverse-proxy (x-real-ip / cf-connecting-ip)
    const clientIp =
      req.headers.get("x-real-ip")?.trim() ||
      req.headers.get("cf-connecting-ip")?.trim() ||
      req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
      "anonymous";
    const ipRate = checkRateLimit(`track-aspirasi-ip:${clientIp}`, { windowMs: 60000, maxRequests: 10 });
    if (!ipRate.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan pelacakan dari perangkat ini. Harap tunggu 1 menit." },
        { status: 429 }
      );
    }

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

