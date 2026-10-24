export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const oprec = await prisma.oprecEvent.findUnique({
      where: { slug },
      include: {
        programKerja: {
          select: { title: true },
        },
        _count: {
          select: { pendaftar: true },
        },
      },
    });

    if (!oprec) {
      return NextResponse.json({ error: "Agenda Open Recruitment tidak ditemukan" }, { status: 404 });
    }

    const now = new Date();
    const isClosedByDate = now > new Date(oprec.tanggalTutup) || now < new Date(oprec.tanggalBuka);
    const isAcceptingApplications = oprec.isOpen && !isClosedByDate;

    let divisiList = [];
    try {
      divisiList = JSON.parse(oprec.divisiPilihan);
    } catch {
      divisiList = ["Umum"];
    }

    return NextResponse.json({
      data: {
        id: oprec.id,
        slug: oprec.slug,
        judul: oprec.judul,
        deskripsi: oprec.deskripsi,
        tipeOprec: oprec.tipeOprec,
        tanggalBuka: oprec.tanggalBuka,
        tanggalTutup: oprec.tanggalTutup,
        isOpen: oprec.isOpen,
        isAcceptingApplications,
        kuota: oprec.kuota,
        bannerUrl: oprec.bannerUrl,
        persyaratan: oprec.persyaratan,
        divisiList,
        isPengumumanBuka: oprec.isPengumumanBuka,
        namaProgramKerja: oprec.programKerja?.title || null,
        totalPelamar: oprec._count.pendaftar,
      },
    });
  } catch (error) {
    console.error("Error fetching public oprec:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

