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

    const [totalAlumni, kontributorAktif, donasiAgg, donasiByProgram] = await Promise.all([
      prisma.alumni.count(),
      prisma.alumni.count({ where: { isKontributorAktif: true } }),
      prisma.alumniDonasi.aggregate({
        where: { status: "TERVERIFIKASI" },
        _sum: { nominal: true },
        _count: { id: true },
      }),
      prisma.alumniDonasi.groupBy({
        by: ["programDonasi"],
        where: { status: "TERVERIFIKASI" },
        _sum: { nominal: true },
        _count: { id: true },
      }),
    ]);

    const programBreakdown: Record<string, { totalNominal: number; totalTransaksi: number }> = {};
    donasiByProgram.forEach((p) => {
      programBreakdown[p.programDonasi] = {
        totalNominal: Number(p._sum.nominal || 0),
        totalTransaksi: p._count.id,
      };
    });

    return NextResponse.json({
      totalAlumni,
      kontributorAktif,
      totalDanaAbadi: Number(donasiAgg._sum.nominal || 0),
      totalTransaksiDonasi: donasiAgg._count.id,
      programBreakdown,
    });
  } catch (error) {
    console.error("Error fetching alumni stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
