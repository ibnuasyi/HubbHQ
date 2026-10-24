export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const batch = await prisma.diklatBatch.findUnique({
      where: { id },
      include: {
        jenjang: true,
        peserta: {
          include: {
            user: {
              select: { id: true, name: true, nickname: true, avatar: true },
            },
          },
          orderBy: [{ statusKelulusan: "asc" }, { namaLengkap: "asc" }],
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch diklat tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: batch });
  } catch (error) {
    console.error("Error fetching batch detail:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const updateData: any = {};

    if (body.namaDiklat !== undefined) updateData.namaDiklat = body.namaDiklat;
    if (body.kodeBatch !== undefined) updateData.kodeBatch = body.kodeBatch.toUpperCase();
    if (body.tanggalMulai !== undefined) updateData.tanggalMulai = new Date(body.tanggalMulai);
    if (body.tanggalSelesai !== undefined) updateData.tanggalSelesai = new Date(body.tanggalSelesai);
    if (body.lokasi !== undefined) updateData.lokasi = body.lokasi;
    if (body.biayaPendaftaran !== undefined) updateData.biayaPendaftaran = Number(body.biayaPendaftaran);
    if (body.kuota !== undefined) updateData.kuota = Number(body.kuota);
    if (body.motNama !== undefined) updateData.motNama = body.motNama;
    if (body.skKepanitiaan !== undefined) updateData.skKepanitiaan = body.skKepanitiaan;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.diklatBatch.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating batch:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui batch" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    await prisma.diklatBatch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Batch berhasil dihapus" });
  } catch (error: any) {
    console.error("Error deleting batch:", error);
    return NextResponse.json({ error: error.message || "Gagal menghapus batch" }, { status: 500 });
  }
}
