export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; pendaftarId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pendaftarId } = await context.params;
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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pendaftarId } = await context.params;

    await prisma.oprecPendaftar.delete({
      where: { id: pendaftarId },
    });

    return NextResponse.json({ success: true, message: "Pendaftar berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

