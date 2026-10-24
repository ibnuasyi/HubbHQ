export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/api-security";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rate = checkRateLimit(`oprec-daftar:${clientIp}`, { windowMs: 60000, maxRequests: 5 });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan pendaftaran. Harap tunggu sejenak." },
        { status: 429 }
      );
    }

    const { slug } = await context.params;

    const oprec = await prisma.oprecEvent.findUnique({
      where: { slug },
    });

    if (!oprec) {
      return NextResponse.json({ error: "Agenda Open Recruitment tidak ditemukan" }, { status: 404 });
    }

    const now = new Date();
    if (!oprec.isOpen || now > new Date(oprec.tanggalTutup) || now < new Date(oprec.tanggalBuka)) {
      return NextResponse.json(
        { error: "Pendaftaran untuk agenda ini telah ditutup" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      namaLengkap,
      nimOrNra,
      email,
      phone,
      fakultasProdi,
      angkatan,
      divisiPilihan1,
      divisiPilihan2,
      alasanMemilih,
      pengalamanOrganisasi,
      cvUrl,
      ktmUrl,
      portofolioUrl,
    } = body;

    if (!namaLengkap || !nimOrNra || !email || !phone || !divisiPilihan1) {
      return NextResponse.json(
        { error: "Mohon lengkapi nama, NIM/NRA, email, nomor HP, dan pilihan divisi utama" },
        { status: 400 }
      );
    }

    // Cek apakah sudah pernah mendaftar pada event oprec yang sama
    const existing = await prisma.oprecPendaftar.findFirst({
      where: {
        oprecId: oprec.id,
        OR: [
          { nimOrNra: nimOrNra.trim() },
          { email: email.trim().toLowerCase() },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "NIM atau Email Anda sudah terdaftar pada agenda pendaftaran ini",
          nomorRegistrasi: existing.nomorRegistrasi,
        },
        { status: 400 }
      );
    }

    // Generate unique nomor registrasi (e.g. REG-2026-8291)
    const year = new Date().getFullYear();
    let nomorRegistrasi = "";
    let isUnique = false;
    while (!isUnique) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      nomorRegistrasi = `REG-${year}-${rand}`;
      const duplicate = await prisma.oprecPendaftar.findUnique({
        where: { nomorRegistrasi },
      });
      if (!duplicate) isUnique = true;
    }

    const pendaftar = await prisma.oprecPendaftar.create({
      data: {
        oprecId: oprec.id,
        nomorRegistrasi,
        namaLengkap,
        nimOrNra: nimOrNra.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        fakultasProdi,
        angkatan: angkatan ? Number(angkatan) : null,
        divisiPilihan1,
        divisiPilihan2: divisiPilihan2 || null,
        alasanMemilih,
        pengalamanOrganisasi,
        cvUrl: cvUrl?.trim() || null,
        ktmUrl: ktmUrl?.trim() || null,
        portofolioUrl: portofolioUrl?.trim() || null,
        statusTahap: "BERKAS_PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pendaftaran berhasil dikirimkan",
      nomorRegistrasi: pendaftar.nomorRegistrasi,
      data: {
        namaLengkap: pendaftar.namaLengkap,
        divisiPilihan1: pendaftar.divisiPilihan1,
        divisiPilihan2: pendaftar.divisiPilihan2,
        createdAt: pendaftar.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error submitting oprec registration:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses pendaftaran" },
      { status: 500 }
    );
  }
}

