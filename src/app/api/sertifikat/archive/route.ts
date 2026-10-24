export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission } from "@/lib/auth";
import { storageService } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || '';
    const canManageTemplate =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit')) ||
      (await hasPermission(session.user.id, 'proker.edit'));

    if (!canManageTemplate) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki wewenang untuk mengarsipkan sertifikat" },
        { status: 403 }
      );
    }

    const { certId, imageBase64 } = await req.json();

    if (!certId || !imageBase64) {
      return NextResponse.json(
        { error: "ID sertifikat dan data gambar Base64 wajib diisi" },
        { status: 400 }
      );
    }

    const cert = await prisma.sertifikatGenerated.findUnique({
      where: { id: certId },
    });

    if (!cert) {
      return NextResponse.json({ error: "Data sertifikat tidak ditemukan" }, { status: 404 });
    }

    // Convert base64 data URL to Buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran berkas gambar sertifikat terlalu besar (maksimal 15MB)" },
        { status: 400 }
      );
    }

    // Validate magic bytes
    const headerHex = buffer.subarray(0, 4).toString('hex').toLowerCase();
    const isPng = headerHex === '89504e47';
    const isJpeg = headerHex.startsWith('ffd8ff');

    if (!isPng && !isJpeg) {
      return NextResponse.json(
        { error: "Format gambar sertifikat harus berupa PNG atau JPEG valid" },
        { status: 400 }
      );
    }

    const safeFilename = `${cert.nomorSertifikat.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`;

    // Upload via HubbHQ Unified Storage (Local, S3, Cloudflare R2, atau AList/WebDAV)
    const uploadResult = await storageService.upload(
      buffer,
      "sertifikat",
      safeFilename,
      "image/png"
    );

    // Simpan URL penyimpanan eksternal ke basis data
    const updated = await prisma.sertifikatGenerated.update({
      where: { id: cert.id },
      data: {
        outputImageUrl: uploadResult.url,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Sertifikat berhasil diarsipkan ke ${storageService.getProvider()}`,
      url: uploadResult.url,
      provider: storageService.getProvider(),
      data: updated,
    });
  } catch (error: any) {
    console.error("Error archiving certificate to storage:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengarsipkan sertifikat ke Object Storage" },
      { status: 500 }
    );
  }
}

