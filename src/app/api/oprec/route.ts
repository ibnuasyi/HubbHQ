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

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const oprecs = await prisma.oprecEvent.findMany({
      include: {
        programKerja: {
          select: { id: true, title: true },
        },
        _count: {
          select: { pendaftar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: oprecs });
  } catch (error) {
    console.error("Error fetching oprec events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManage = await canManageOprec(session.user.id, (session.user as any)?.role);
    if (!canManage) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Pengurus SDM, Panitia Oprec, atau Admin yang dapat membuat agenda oprec" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      slug,
      judul,
      deskripsi,
      tipeOprec = "PANITIA_EVENT",
      tanggalBuka,
      tanggalTutup,
      kuota = 0,
      bannerUrl,
      persyaratan,
      divisiPilihan = '["Acara", "Humas", "Kestari", "Logistik", "Konsumsi", "Pubdok"]',
      programKerjaId,
    } = body;

    if (!slug || !judul || !tanggalBuka || !tanggalTutup) {
      return NextResponse.json(
        { error: "Slug, judul, dan tanggal buka-tutup wajib diisi" },
        { status: 400 }
      );
    }

    const cleanSlug = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");

    const existing = await prisma.oprecEvent.findUnique({
      where: { slug: cleanSlug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Slug URL ini sudah digunakan, silakan buat slug lain" },
        { status: 400 }
      );
    }

    const divisiJson =
      typeof divisiPilihan === "string" ? divisiPilihan : JSON.stringify(divisiPilihan);

    const created = await prisma.oprecEvent.create({
      data: {
        slug: cleanSlug,
        judul,
        deskripsi,
        tipeOprec,
        tanggalBuka: new Date(tanggalBuka),
        tanggalTutup: new Date(tanggalTutup),
        kuota: Number(kuota) || 0,
        bannerUrl,
        persyaratan,
        divisiPilihan: divisiJson,
        programKerjaId: programKerjaId || null,
        isOpen: true,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Error creating oprec:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat agenda oprec" },
      { status: 500 }
    );
  }
}

