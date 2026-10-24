export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth, hasPermission } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || '';
    const canReplyAsPengurus =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit'));

    if (!canReplyAsPengurus) {
      return NextResponse.json(
        { error: "Forbidden: Hanya pimpinan/pengurus yang dapat mengirimkan tanggapan resmi atas aspirasi ini" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const { pesan, isInternal = false } = await req.json();

    if (!pesan?.trim()) {
      return NextResponse.json({ error: "Pesan tanggapan wajib diisi" }, { status: 400 });
    }

    const tanggapan = await prisma.aspirasiTanggapan.create({
      data: {
        aspirasiId: id,
        userId: session.user.id,
        pengirim: "PENGURUS",
        pesan: pesan.trim(),
        isInternal: Boolean(isInternal),
      },
      include: {
        user: {
          select: { id: true, name: true, nickname: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: tanggapan });
  } catch (error) {
    console.error("Error creating tanggapan pengurus:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
