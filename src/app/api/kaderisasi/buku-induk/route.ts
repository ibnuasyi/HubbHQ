export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const jenjangId = searchParams.get("jenjangId");

    const where: any = {
      statusKelulusan: {
        in: ["LULUS_MURNI", "LULUS_BERSYARAT"],
      },
    };

    if (search) {
      where.OR = [
        { namaLengkap: { contains: search } },
        { nomorRegistrasiKader: { contains: search } },
        { nomorSttpp: { contains: search } },
        { instansiAsal: { contains: search } },
        { nraOrNim: { contains: search } },
      ];
    }

    if (jenjangId && jenjangId !== "ALL") {
      where.batch = { jenjangId };
    }

    const kaderList = await prisma.diklatPeserta.findMany({
      where,
      include: {
        batch: {
          include: { jenjang: true },
        },
        user: {
          select: { id: true, name: true, avatar: true, email: true },
        },
      },
      orderBy: { sttppIssuedAt: "desc" },
    });

    return NextResponse.json({ data: kaderList });
  } catch (error) {
    console.error("Error fetching buku induk:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
