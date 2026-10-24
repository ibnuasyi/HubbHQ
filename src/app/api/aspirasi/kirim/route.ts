export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/api-security";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    // Batasi pengiriman maksimal 10 aspirasi per menit per IP untuk mencegah flooding spam
    const rate = checkRateLimit(`kirim-aspirasi:${clientIp}`, { windowMs: 60000, maxRequests: 10 });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Batas pengiriman tercapai. Harap tunggu 1 menit sebelum mengirim aspirasi baru." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Honeypot check untuk mendeteksi bot otomatis
    if (body._hp_field && body._hp_field.trim() !== "") {
      return NextResponse.json({ error: "Permintaan ditolak" }, { status: 400 });
    }

    const {
      judul,
      kategori,
      isi,
      isAnonim = true,
      namaPelapor,
      kontakPelapor,
      lampiranUrl,
      urgensi = "SEDANG",
    } = body;

    if (!judul || !kategori || !isi) {
      return NextResponse.json(
        { error: "Judul, kategori, dan isi aspirasi wajib diisi" },
        { status: 400 }
      );
    }

    // Generate unique kode tiket (contoh: ASP-2026-9281)
    const year = new Date().getFullYear();
    let kodeTiket = "";
    let isUnique = false;
    while (!isUnique) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      kodeTiket = `ASP-${year}-${rand}`;
      const existing = await prisma.aspirasi.findUnique({ where: { kodeTiket } });
      if (!existing) isUnique = true;
    }

    // Generate PIN pelacak 6 digit angka
    const pinPelacak = Math.floor(100000 + Math.random() * 900000).toString();

    const aspirasi = await prisma.aspirasi.create({
      data: {
        kodeTiket,
        pinPelacak,
        judul,
        kategori,
        isi,
        isAnonim: Boolean(isAnonim),
        namaPelapor: isAnonim ? null : namaPelapor,
        kontakPelapor: isAnonim ? null : kontakPelapor,
        lampiranUrl,
        urgensi: urgensi || "SEDANG",
        status: "MENUNGGU",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Aspirasi berhasil dikirimkan",
      kodeTiket: aspirasi.kodeTiket,
      pinPelacak: aspirasi.pinPelacak,
      data: {
        id: aspirasi.id,
        kodeTiket: aspirasi.kodeTiket,
        judul: aspirasi.judul,
        kategori: aspirasi.kategori,
        status: aspirasi.status,
        createdAt: aspirasi.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating aspirasi:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

