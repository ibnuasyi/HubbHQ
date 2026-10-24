export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimitByIP, getClientIP } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ nomor: string[] }> }
) {
  try {
    const clientIp = getClientIP(req);
    const rateCheck = checkRateLimitByIP(clientIp, 'verify_sertifikat', { maxRequests: 60, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan verifikasi sertifikat. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    const { nomor } = await context.params;
    const nomorSertifikat = Array.isArray(nomor) ? nomor.join("/") : decodeURIComponent(nomor);

    const cert = await prisma.sertifikatGenerated.findFirst({
      where: {
        nomorSertifikat: {
          equals: nomorSertifikat,
        },
      },
      include: {
        template: {
          select: {
            namaTemplate: true,
            kategori: true,
          },
        },
      },
    });

    if (!cert) {
      return NextResponse.json(
        { error: "Nomor sertifikat tidak ditemukan dalam pangkalan data verifikasi resmi" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        nomorSertifikat: cert.nomorSertifikat,
        namaPenerima: cert.namaPenerima,
        sebagai: cert.sebagai,
        kegiatan: cert.template.namaTemplate,
        kategori: cert.template.kategori,
        issuedAt: cert.issuedAt,
        keterangan: cert.keterangan,
        outputImageUrl: cert.outputImageUrl,
        isValid: true,
      },
    });
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

