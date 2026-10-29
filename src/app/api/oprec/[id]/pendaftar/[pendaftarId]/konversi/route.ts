export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission, isSuperAdminRole } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; pendaftarId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    const roleName = (typeof role === "string" ? role : role?.name || "").toLowerCase();
    const canConvert =
      isSuperAdminRole(role) ||
      ["admin", "superadmin", "ketua", "sekretaris"].includes(roleName) ||
      (await hasPermission(session.user.id, "members.create")) ||
      (await hasPermission(session.user.id, "members.edit"));

    if (!canConvert) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Pengurus SDM, Pimpinan, atau Admin yang dapat mengonversi pendaftar menjadi akun anggota" },
        { status: 403 }
      );
    }

    const { id, pendaftarId } = await context.params;

    const [oprec, pendaftar] = await Promise.all([
      prisma.oprecEvent.findUnique({
        where: { id },
        include: { programKerja: true },
      }),
      prisma.oprecPendaftar.findFirst({
        where: { id: pendaftarId, oprecId: id },
      }),
    ]);

    if (!oprec || !pendaftar) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    if (pendaftar.statusTahap !== "LULUS") {
      return NextResponse.json(
        { error: "Hanya calon peserta dengan status LULUS yang dapat dikonversi" },
        { status: 400 }
      );
    }

    if (pendaftar.isConverted) {
      return NextResponse.json(
        { error: "Peserta ini sudah pernah dikonversi sebelumnya" },
        { status: 400 }
      );
    }

    // 1. Cari atau buat akun User dengan password sementara acak kriptografis
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: pendaftar.email },
          { nra: pendaftar.nimOrNra },
        ],
      },
    });

    let temporaryPassword: string | undefined;

    if (!user) {
      temporaryPassword = `Hubb-${crypto.randomBytes(6).toString("base64url")}!9`;
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
      user = await prisma.user.create({
        data: {
          email: pendaftar.email,
          password: hashedPassword,
          name: pendaftar.namaLengkap,
          fullName: pendaftar.namaLengkap,
          phone: pendaftar.phone,
          nra: pendaftar.nimOrNra,
          mustChangePassword: true,
          isActive: true,
        },
      });
    }

    // 2. Jika tipe Oprec adalah PANITIA_EVENT dan terhubung ke ProgramKerja
    if (oprec.tipeOprec === "PANITIA_EVENT" && oprec.programKerjaId) {
      const roleJabatan =
        pendaftar.jabatanDiterima ||
        (pendaftar.divisiDiterima ? `Divisi ${pendaftar.divisiDiterima}` : "Panitia Pelaksana");

      // Cek apakah sudah terdaftar di panitia
      const existingPanitia = await prisma.panitiaProker.findFirst({
        where: {
          programKerjaId: oprec.programKerjaId,
          userId: user.id,
        },
      });

      if (!existingPanitia) {
        await prisma.panitiaProker.create({
          data: {
            programKerjaId: oprec.programKerjaId,
            userId: user.id,
            roleJabatan,
          },
        });
      }
    }

    // 3. Jika tipe Oprec adalah PENGURUS_BARU dan ada divisi yang cocok
    if (oprec.tipeOprec === "PENGURUS_BARU" && pendaftar.divisiDiterima) {
      const divisi = await prisma.divisi.findFirst({
        where: {
          name: { contains: pendaftar.divisiDiterima },
        },
      });

      if (divisi) {
        const existingMember = await prisma.divisiMember.findFirst({
          where: {
            divisiId: divisi.id,
            userId: user.id,
          },
        });

        if (!existingMember) {
          await prisma.divisiMember.create({
            data: {
              divisiId: divisi.id,
              userId: user.id,
              position: pendaftar.jabatanDiterima || "Staff Divisi",
            },
          });
        }
      }
    }

    // 4. Update status isConverted pada pendaftar
    await prisma.oprecPendaftar.update({
      where: { id: pendaftar.id },
      data: { isConverted: true },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengonversi ${pendaftar.namaLengkap} ke dalam sistem HubbHQ`,
      userId: user.id,
      ...(temporaryPassword ? { temporaryPassword } : {}),
    });
  } catch (error: any) {
    console.error("Error converting pendaftar:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengonversi pendaftar" },
      { status: 500 }
    );
  }
}

