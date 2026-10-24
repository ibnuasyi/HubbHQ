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

    const sidang = await prisma.sidangMusyawarah.findUnique({
      where: { id },
      include: {
        risalah: {
          orderBy: { waktuMulai: "asc" },
        },
        ketetapanSK: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!sidang) {
      return NextResponse.json({ error: "Sidang musyawarah tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: sidang });
  } catch (error) {
    console.error("Error fetching detail sidang:", error);
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

    if (body.namaMusyawarah !== undefined) updateData.namaMusyawarah = body.namaMusyawarah;
    if (body.tema !== undefined) updateData.tema = body.tema;
    if (body.tempat !== undefined) updateData.tempat = body.tempat;
    if (body.tanggalMulai !== undefined) updateData.tanggalMulai = new Date(body.tanggalMulai);
    if (body.tanggalSelesai !== undefined) updateData.tanggalSelesai = new Date(body.tanggalSelesai);
    if (body.presidium1 !== undefined) updateData.presidium1 = body.presidium1;
    if (body.presidium2 !== undefined) updateData.presidium2 = body.presidium2;
    if (body.presidium3 !== undefined) updateData.presidium3 = body.presidium3;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.totalKuorum !== undefined) updateData.totalKuorum = Number(body.totalKuorum);
    if (body.kuorumTercapai !== undefined) updateData.kuorumTercapai = Boolean(body.kuorumTercapai);

    const updated = await prisma.sidangMusyawarah.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating sidang:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui sidang" }, { status: 500 });
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

    await prisma.sidangMusyawarah.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Sidang musyawarah berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
