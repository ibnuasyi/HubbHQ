export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
        { error: "Forbidden: Anda tidak memiliki wewenang untuk men-generate sertifikat" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const { recipients } = await req.json();

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "Daftar penerima sertifikat (recipients) tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (recipients.length > 500) {
      return NextResponse.json(
        { error: "Jumlah penerima maksimal adalah 500 orang per batch pembuatan" },
        { status: 400 }
      );
    }

    const template = await prisma.sertifikatTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }

    const countExisting = await prisma.sertifikatGenerated.count({
      where: { templateId: id },
    });

    const year = new Date().getFullYear();
    const pattern = template.prefixNomor || "SERT/[NO]/HUBB/[YEAR]";

    let counter = countExisting + 1;
    const createdList = [];

    for (const r of recipients) {
      if (!r.nama?.trim()) continue;

      const formattedNo = String(counter).padStart(3, "0");
      const nomorSertifikat = pattern
        .replace("[NO]", formattedNo)
        .replace("[YEAR]", String(year));

      const cert = await prisma.sertifikatGenerated.create({
        data: {
          templateId: id,
          nomorSertifikat,
          namaPenerima: r.nama.trim(),
          sebagai: r.sebagai || "Peserta",
          keterangan: r.keterangan || null,
        },
      });

      createdList.push(cert);
      counter++;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil men-generate ${createdList.length} sertifikat secara otomatis`,
      data: createdList,
    });
  } catch (error: any) {
    console.error("Error generating certificates:", error);
    return NextResponse.json(
      { error: error.message || "Gagal men-generate sertifikat" },
      { status: 500 }
    );
  }
}

