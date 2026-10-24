export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimitByIP, getClientIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIP(req);
    const rateCheck = checkRateLimitByIP(clientIp, "track_tanggapan_aspirasi", {
      maxRequests: 15,
      windowMs: 60 * 1000,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan pengiriman pesan tanggapan. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    const { kodeTiket, pinPelacak, pesan } = await req.json();

    if (!kodeTiket || !pinPelacak || !pesan?.trim()) {
      return NextResponse.json(
        { error: "Kode tiket, PIN pelacak, dan pesan wajib diisi" },
        { status: 400 }
      );
    }

    if (String(pesan).trim().length > 3000) {
      return NextResponse.json(
        { error: "Pesan tanggapan maksimal 3000 karakter" },
        { status: 400 }
      );
    }

    const aspirasi = await prisma.aspirasi.findFirst({
      where: {
        kodeTiket: String(kodeTiket).trim().toUpperCase(),
        pinPelacak: String(pinPelacak).trim(),
      },
    });

    if (!aspirasi) {
      return NextResponse.json(
        { error: "Aspirasi tidak valid atau tiket/PIN salah" },
        { status: 404 }
      );
    }

    const tanggapan = await prisma.aspirasiTanggapan.create({
      data: {
        aspirasiId: aspirasi.id,
        pengirim: "PELAPOR",
        pesan: String(pesan).trim(),
        isInternal: false,
      },
    });

    return NextResponse.json({ success: true, data: tanggapan });
  } catch (error) {
    console.error("Error creating tanggapan pelapor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

