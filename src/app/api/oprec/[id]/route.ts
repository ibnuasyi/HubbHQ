export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission, isSuperAdminRole } from "@/lib/auth";

async function canManageOprec(userId: string, role?: any): Promise<boolean> {
  if (isSuperAdminRole(role)) return true;
  const roleName = (typeof role === "string" ? role : role?.name || "").toLowerCase();
  if (["admin", "superadmin", "ketua", "sekretaris"].includes(roleName)) return true;
  if (await hasPermission(userId, "members.create")) return true;
  if (await hasPermission(userId, "members.edit")) return true;
  if (await hasPermission(userId, "proker.edit")) return true;
  return false;
}

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
    const isManager = await canManageOprec(session.user.id, (session.user as any)?.role);

    const oprec = await prisma.oprecEvent.findUnique({
      where: { id },
      include: {
        programKerja: true,
        pendaftar: isManager
          ? {
              orderBy: { createdAt: "desc" },
            }
          : {
              select: {
                id: true,
                nomorRegistrasi: true,
                namaLengkap: true,
                divisiPilihan1: true,
                divisiPilihan2: true,
                statusTahap: true,
                divisiDiterima: true,
                jabatanDiterima: true,
                createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
      },
    });

    if (!oprec) {
      return NextResponse.json({ error: "Agenda oprec tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: oprec });
  } catch (error) {
    console.error("Error fetching detail oprec:", error);
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

    const canManage = await canManageOprec(session.user.id, (session.user as any)?.role);
    if (!canManage) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Pengurus SDM, Panitia Oprec, atau Admin yang berwenang mengubah agenda oprec" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const updateData: any = {};

    if (body.judul !== undefined) updateData.judul = body.judul;
    if (body.deskripsi !== undefined) updateData.deskripsi = body.deskripsi;
    if (body.tanggalBuka !== undefined) updateData.tanggalBuka = new Date(body.tanggalBuka);
    if (body.tanggalTutup !== undefined) updateData.tanggalTutup = new Date(body.tanggalTutup);
    if (body.isOpen !== undefined) updateData.isOpen = Boolean(body.isOpen);
    if (body.isPengumumanBuka !== undefined) updateData.isPengumumanBuka = Boolean(body.isPengumumanBuka);
    if (body.kuota !== undefined) updateData.kuota = Number(body.kuota);
    if (body.bannerUrl !== undefined) updateData.bannerUrl = body.bannerUrl;
    if (body.persyaratan !== undefined) updateData.persyaratan = body.persyaratan;
    if (body.divisiPilihan !== undefined) {
      updateData.divisiPilihan =
        typeof body.divisiPilihan === "string" ? body.divisiPilihan : JSON.stringify(body.divisiPilihan);
    }

    const updated = await prisma.oprecEvent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating oprec:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui oprec" }, { status: 500 });
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

    const canManage = await canManageOprec(session.user.id, (session.user as any)?.role);
    if (!canManage) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Pengurus SDM, Panitia Oprec, atau Admin yang berwenang menghapus agenda oprec" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    await prisma.oprecEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Agenda oprec berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

