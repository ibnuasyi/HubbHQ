export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const template = await prisma.sertifikatTemplate.findUnique({
      where: { id },
      include: {
        sertifikatList: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template sertifikat tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error("Error fetching template detail:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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
        { error: "Forbidden: Anda tidak memiliki wewenang untuk mengubah template e-sertifikat" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const updateData: any = {};

    if (body.namaTemplate !== undefined) updateData.namaTemplate = body.namaTemplate;
    if (body.kategori !== undefined) updateData.kategori = body.kategori;
    if (body.imageUrl !== undefined) {
      const trimmedUrl = String(body.imageUrl).trim();
      if (trimmedUrl.toLowerCase().startsWith('javascript:')) {
        return NextResponse.json({ error: "URL gambar template tidak valid" }, { status: 400 });
      }
      updateData.imageUrl = trimmedUrl;
    }
    if (body.lebarCanvas !== undefined) updateData.lebarCanvas = Number(body.lebarCanvas);
    if (body.tinggiCanvas !== undefined) updateData.tinggiCanvas = Number(body.tinggiCanvas);
    if (body.configJson !== undefined) {
      updateData.configJson =
        typeof body.configJson === "string" ? body.configJson : JSON.stringify(body.configJson);
    }
    if (body.prefixNomor !== undefined) updateData.prefixNomor = body.prefixNomor;

    const updated = await prisma.sertifikatTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui template" }, { status: 500 });
  }
}

export async function DELETE(
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
      (await hasPermission(session.user.id, 'settings.edit'));

    if (!canManageTemplate) {
      return NextResponse.json(
        { error: "Forbidden: Hanya admin yang dapat menghapus template e-sertifikat" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    await prisma.sertifikatTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Template sertifikat berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

