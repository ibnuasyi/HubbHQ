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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const aspirasi = await prisma.aspirasi.findUnique({
      where: { id },
      include: {
        ditindakLanjutOleh: {
          select: { id: true, name: true, nickname: true, email: true, avatar: true },
        },
        tanggapan: {
          include: {
            user: {
              select: { id: true, name: true, nickname: true, avatar: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!aspirasi) {
      return NextResponse.json({ error: "Aspirasi tidak ditemukan" }, { status: 404 });
    }

    // Do not leak secret pinPelacak in authenticated management API
    const { pinPelacak: _, ...safeAspirasi } = aspirasi;

    return NextResponse.json({ data: safeAspirasi });
  } catch (error) {
    console.error("Error fetching detail aspirasi:", error);
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
    const canManageAspirasi =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit'));

    if (!canManageAspirasi) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki wewenang mengelola aspirasi ini" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const {
      status,
      urgensi,
      tindakLanjut,
      catatanInternal,
      ditindakLanjutOlehId,
      tanggalSelesai,
    } = body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (urgensi !== undefined) updateData.urgensi = urgensi;
    if (tindakLanjut !== undefined) updateData.tindakLanjut = tindakLanjut;
    if (catatanInternal !== undefined) updateData.catatanInternal = catatanInternal;
    if (ditindakLanjutOlehId !== undefined) {
      updateData.ditindakLanjutOlehId = ditindakLanjutOlehId || null;
    }
    if (status === "SELESAI" && !tanggalSelesai) {
      updateData.tanggalSelesai = new Date();
    } else if (tanggalSelesai !== undefined) {
      updateData.tanggalSelesai = tanggalSelesai ? new Date(tanggalSelesai) : null;
    }

    const updated = await prisma.aspirasi.update({
      where: { id },
      data: updateData,
    });

    const { pinPelacak: _, ...safeUpdated } = updated;

    return NextResponse.json({ success: true, data: safeUpdated });
  } catch (error) {
    console.error("Error updating aspirasi:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    const canDeleteAspirasi =
      ['admin', 'ketua'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit'));

    if (!canDeleteAspirasi) {
      return NextResponse.json(
        { error: "Forbidden: Hanya admin yang dapat menghapus data aspirasi" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    await prisma.aspirasi.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Aspirasi berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting aspirasi:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
