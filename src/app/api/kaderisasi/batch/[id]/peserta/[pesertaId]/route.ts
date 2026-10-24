export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission } from "@/lib/auth";

async function canManageDiklat(userId: string, roleName: string): Promise<boolean> {
  if (['admin', 'ketua', 'sekretaris'].includes(roleName)) return true;
  if (await hasPermission(userId, 'members.edit')) return true;
  if (await hasPermission(userId, 'proker.edit')) return true;
  return false;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; pesertaId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || '';
    const canManage = await canManageDiklat(session.user.id, roleName);
    if (!canManage) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Instruktur, Pimpinan, atau Admin yang berwenang menilai peserta dan mengesahkan kelulusan" },
        { status: 403 }
      );
    }

    const { id, pesertaId } = await context.params;
    const body = await req.json();
    const {
      statusScreening,
      nilaiKognitif,
      nilaiAfektif,
      nilaiPsikomotorik,
      statusKelulusan,
      catatanInstruktur,
    } = body;

    const peserta = await prisma.diklatPeserta.findUnique({
      where: { id: pesertaId },
      include: {
        batch: {
          include: { jenjang: true },
        },
      },
    });

    if (!peserta) {
      return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });
    }

    const updateData: any = {};
    if (statusScreening !== undefined) updateData.statusScreening = statusScreening;
    if (catatanInstruktur !== undefined) updateData.catatanInstruktur = catatanInstruktur;

    // Hitung bobot nilai
    const kognitif = nilaiKognitif !== undefined ? Number(nilaiKognitif) : peserta.nilaiKognitif;
    const afektif = nilaiAfektif !== undefined ? Number(nilaiAfektif) : peserta.nilaiAfektif;
    const psiko = nilaiPsikomotorik !== undefined ? Number(nilaiPsikomotorik) : peserta.nilaiPsikomotorik;

    if (nilaiKognitif !== undefined) updateData.nilaiKognitif = kognitif;
    if (nilaiAfektif !== undefined) updateData.nilaiAfektif = afektif;
    if (nilaiPsikomotorik !== undefined) updateData.nilaiPsikomotorik = psiko;

    const nilaiAkhir = Math.round((kognitif * 0.4 + afektif * 0.3 + psiko * 0.3) * 100) / 100;
    updateData.nilaiAkhir = nilaiAkhir;

    if (statusKelulusan !== undefined) {
      updateData.statusKelulusan = statusKelulusan;

      // Jika lulus, generate nomor STTPP & NRK otomatis jika belum ada
      if (
        (statusKelulusan === "LULUS_MURNI" || statusKelulusan === "LULUS_BERSYARAT") &&
        !peserta.nomorSttpp
      ) {
        const year = new Date().getFullYear();
        const randId = peserta.id.slice(-4).toUpperCase();
        const singkatan = peserta.batch.jenjang.singkatan;

        const nomorSttpp = `STTPP/${peserta.batch.kodeBatch}/${randId}`;
        const nomorRegistrasiKader = `NRK-${singkatan}-${year}-${randId}`;

        updateData.nomorSttpp = nomorSttpp;
        updateData.nomorRegistrasiKader = nomorRegistrasiKader;
        updateData.sttppIssuedAt = new Date();

        // Update User profile jika peserta terafiliasi dengan akun User
        if (peserta.userId) {
          await prisma.user.update({
            where: { id: peserta.userId },
            data: {
              jenjangKaderId: peserta.batch.jenjangId,
              nrk: nomorRegistrasiKader,
            },
          });
        }
      }
    }

    const updated = await prisma.diklatPeserta.update({
      where: { id: pesertaId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating peserta:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui data peserta" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; pesertaId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || '';
    const canManage = await canManageDiklat(session.user.id, roleName);
    if (!canManage) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Instruktur atau Admin yang dapat menghapus data peserta" },
        { status: 403 }
      );
    }

    const { pesertaId } = await context.params;

    await prisma.diklatPeserta.delete({
      where: { id: pesertaId },
    });

    return NextResponse.json({ success: true, message: "Peserta berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
