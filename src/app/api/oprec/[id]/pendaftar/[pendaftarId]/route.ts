export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission, isSuperAdminRole } from "@/lib/auth";

async function canEvaluatePendaftar(userId: string, role?: any): Promise<boolean> {
  if (isSuperAdminRole(role)) return true;
  const roleName = (typeof role === "string" ? role : role?.name || "").toLowerCase();
  if (["admin", "superadmin", "ketua", "sekretaris"].includes(roleName)) return true;
  if (await hasPermission(userId, "members.create")) return true;
  if (await hasPermission(userId, "members.edit")) return true;
  if (await hasPermission(userId, "proker.edit")) return true;
  return false;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; pendaftarId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canEvaluate = await canEvaluatePendaftar(session.user.id, (session.user as any)?.role);
    if (!canEvaluate) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Panitia Seleksi, Pengurus SDM, atau Admin yang dapat menilai dan menetapkan kelulusan pendaftar" },
        { status: 403 }
      );
    }

    const { id: oprecId, pendaftarId } = await context.params;
    const existing = await prisma.oprecPendaftar.findFirst({
      where: { id: pendaftarId, oprecId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Pendaftar tidak ditemukan" }, { status: 404 });
    }
    const body = await req.json();
    const updateData: any = {};

    if (body.statusTahap !== undefined) updateData.statusTahap = body.statusTahap;
    if (body.divisiDiterima !== undefined) updateData.divisiDiterima = body.divisiDiterima;
    if (body.jabatanDiterima !== undefined) updateData.jabatanDiterima = body.jabatanDiterima;
    if (body.nilaiWawancara !== undefined) updateData.nilaiWawancara = Number(body.nilaiWawancara);
    if (body.catatanInterviewer !== undefined) updateData.catatanInterviewer = body.catatanInterviewer;

    const updated = await prisma.oprecPendaftar.update({
      where: { id: pendaftarId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating pendaftar:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui status pendaftar" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; pendaftarId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canEvaluate = await canEvaluatePendaftar(session.user.id, (session.user as any)?.role);
    if (!canEvaluate) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Panitia Seleksi, Pengurus SDM, atau Admin yang dapat menghapus data pendaftar" },
        { status: 403 }
      );
    }

    const { id: oprecId, pendaftarId } = await context.params;
    const existing = await prisma.oprecPendaftar.findFirst({
      where: { id: pendaftarId, oprecId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Pendaftar tidak ditemukan" }, { status: 404 });
    }

    await prisma.oprecPendaftar.delete({
      where: { id: pendaftarId },
    });

    return NextResponse.json({ success: true, message: "Pendaftar berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

