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
    const peserta = await prisma.diklatPeserta.findMany({
      where: { batchId: id },
      include: {
        user: {
          select: { id: true, name: true, nickname: true, email: true, nra: true, avatar: true },
        },
      },
      orderBy: { namaLengkap: "asc" },
    });

    return NextResponse.json({ data: peserta });
  } catch (error) {
    console.error("Error fetching peserta:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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
    const { namaLengkap, nraOrNim, instansiAsal, kontak, esaiUrl, userId } = body;

    if (!namaLengkap) {
      return NextResponse.json({ error: "Nama lengkap peserta wajib diisi" }, { status: 400 });
    }

    const created = await prisma.diklatPeserta.create({
      data: {
        batchId: id,
        userId: userId || null,
        namaLengkap,
        nraOrNim,
        instansiAsal,
        kontak,
        esaiUrl,
        statusScreening: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Error creating peserta:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menambahkan peserta" },
      { status: 500 }
    );
  }
}
