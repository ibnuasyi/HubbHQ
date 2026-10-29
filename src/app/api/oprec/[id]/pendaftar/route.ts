export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission, isSuperAdminRole } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    const roleName = (typeof role === "string" ? role : role?.name || "").toLowerCase();
    const canViewPendaftar =
      isSuperAdminRole(role) ||
      ["admin", "superadmin", "ketua", "sekretaris"].includes(roleName) ||
      (await hasPermission(session.user.id, "members.view")) ||
      (await hasPermission(session.user.id, "members.create")) ||
      (await hasPermission(session.user.id, "members.edit")) ||
      (await hasPermission(session.user.id, "proker.view")) ||
      (await hasPermission(session.user.id, "proker.edit"));

    if (!canViewPendaftar) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Panitia Oprec, Pengurus, atau Admin yang dapat mengakses daftar pelamar lengkap" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const tahap = searchParams.get("tahap");
    const divisi = searchParams.get("divisi");
    const search = searchParams.get("search");

    const where: any = { oprecId: id };
    if (tahap && tahap !== "ALL") where.statusTahap = tahap;
    if (divisi && divisi !== "ALL") {
      where.OR = [{ divisiPilihan1: divisi }, { divisiPilihan2: divisi }, { divisiDiterima: divisi }];
    }
    if (search) {
      where.OR = [
        { namaLengkap: { contains: search } },
        { nimOrNra: { contains: search } },
        { nomorRegistrasi: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const pendaftar = await prisma.oprecPendaftar.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: pendaftar });
  } catch (error) {
    console.error("Error fetching pendaftar:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

