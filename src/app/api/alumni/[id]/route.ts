export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission } from "@/lib/auth";

async function canManageAlumni(userId: string, roleName: string): Promise<boolean> {
  if (['admin', 'ketua', 'sekretaris'].includes(roleName)) return true;
  if (await hasPermission(userId, 'members.edit')) return true;
  return false;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const alumni = await prisma.alumni.findUnique({
      where: { id },
      include: {
        donasi: {
          orderBy: { tanggalBayar: "desc" },
        },
      },
    });

    if (!alumni) {
      return NextResponse.json({ error: "Alumni tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: alumni });
  } catch (error) {
    console.error("Error fetching alumni detail:", error);
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

    const { id } = await context.params;
    const existing = await prisma.alumni.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Alumni tidak ditemukan" }, { status: 404 });
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || '';
    const isManager = await canManageAlumni(session.user.id, roleName);
    const isSelf = existing.userId === session.user.id;

    if (!isManager && !isSelf) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki wewenang untuk mengedit profil alumni ini" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.nama !== undefined) updateData.nama = body.nama;
    if (body.angkatanMasuk !== undefined) updateData.angkatanMasuk = Number(body.angkatanMasuk);
    if (body.tahunLulus !== undefined) updateData.tahunLulus = Number(body.tahunLulus);
    if (body.jabatanTerakhir !== undefined) updateData.jabatanTerakhir = body.jabatanTerakhir;
    if (body.profesi !== undefined) updateData.profesi = body.profesi;
    if (body.instansiBekerja !== undefined) updateData.instansiBekerja = body.instansiBekerja;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.domisili !== undefined) updateData.domisili = body.domisili;
    if (body.linkedin !== undefined) updateData.linkedin = body.linkedin;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (isManager && body.isKontributorAktif !== undefined) {
      updateData.isKontributorAktif = Boolean(body.isKontributorAktif);
    }

    const updated = await prisma.alumni.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating alumni:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui data" }, { status: 500 });
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
    const canDelete =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'members.delete'));

    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden: Hanya pengurus berwenang yang dapat menghapus data alumni" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    await prisma.alumni.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Data alumni berhasil dihapus" });
  } catch (error: any) {
    console.error("Error deleting alumni:", error);
    return NextResponse.json({ error: error.message || "Gagal menghapus alumni" }, { status: 500 });
  }
}
