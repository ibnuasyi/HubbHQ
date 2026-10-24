export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await prisma.sertifikatTemplate.findMany({
      include: {
        _count: {
          select: { sertifikatList: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
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
    const canManageTemplate =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit')) ||
      (await hasPermission(session.user.id, 'proker.edit'));

    if (!canManageTemplate) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki wewenang untuk membuat template e-sertifikat" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      namaTemplate,
      kategori = "UMUM",
      imageUrl,
      lebarCanvas = 1920,
      tinggiCanvas = 1080,
      configJson,
      prefixNomor = "SERT/[NO]/HUBB/[YEAR]",
    } = body;

    if (!namaTemplate || !imageUrl) {
      return NextResponse.json(
        { error: "Nama template dan URL gambar template sertifikat wajib diisi" },
        { status: 400 }
      );
    }

    const trimmedImageUrl = String(imageUrl).trim();
    if (trimmedImageUrl.toLowerCase().startsWith('javascript:')) {
      return NextResponse.json(
        { error: "URL gambar template tidak valid" },
        { status: 400 }
      );
    }

    // Default configuration for tags: {Nama}, {Sebagai}, {Nomor}, {Tanggal}, {QR}
    const defaultConfig = JSON.stringify({
      nama: {
        x: lebarCanvas / 2,
        y: Math.round(tinggiCanvas * 0.48),
        fontSize: 54,
        color: "#1e293b",
        fontFamily: "Georgia, serif",
        align: "center",
        isBold: true,
      },
      sebagai: {
        x: lebarCanvas / 2,
        y: Math.round(tinggiCanvas * 0.58),
        fontSize: 32,
        color: "#475569",
        fontFamily: "Arial, sans-serif",
        align: "center",
        isBold: false,
      },
      nomor: {
        x: lebarCanvas / 2,
        y: Math.round(tinggiCanvas * 0.32),
        fontSize: 22,
        color: "#64748b",
        fontFamily: "Courier New, monospace",
        align: "center",
        isBold: true,
      },
      tanggal: {
        x: Math.round(lebarCanvas * 0.75),
        y: Math.round(tinggiCanvas * 0.82),
        fontSize: 20,
        color: "#334155",
        fontFamily: "Arial, sans-serif",
        align: "center",
        isBold: false,
      },
      qr: {
        x: Math.round(lebarCanvas * 0.12),
        y: Math.round(tinggiCanvas * 0.78),
        size: 110,
        show: true,
      },
    });

    const created = await prisma.sertifikatTemplate.create({
      data: {
        namaTemplate,
        kategori,
        imageUrl,
        lebarCanvas: Number(lebarCanvas) || 1920,
        tinggiCanvas: Number(tinggiCanvas) || 1080,
        configJson: configJson || defaultConfig,
        prefixNomor,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat template sertifikat" },
      { status: 500 }
    );
  }
}

