# HubbHQ

![HubbHQ Banner](.github/banner.png)

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat&logo=prisma)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=flat&logo=mysql)](https://mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![NextAuth](https://img.shields.io/badge/NextAuth-v5-382554?style=flat&logo=nodedotjs)](https://authjs.dev/)

> **HubbHQ** - Sistem Informasi Organisasi Modern yang powerful dan mudah digunakan untuk mengelola organisasi Anda.

## Screenshot Aplikasi

Berikut adalah dokumentasi tampilan antarmuka sistem yang telah terpasang dan siap digunakan:

| Halaman Depan Publik | Halaman Login Autentikasi | Dashboard Utama |
|:--------------------:|:-------------------------:|:---------------:|
| ![Landing Page](public/screenshots/01-landing-page.png) | ![Login](public/screenshots/02-login-page.png) | ![Dashboard](public/screenshots/03-dashboard.png) |

| Manajemen Anggota | Keuangan & Kas Organisasi | Kalender & Agenda Kegiatan |
|:-----------------:|:-------------------------:|:--------------------------:|
| ![Anggota](public/screenshots/04-anggota.png) | ![Keuangan](public/screenshots/05-keuangan.png) | ![Kalender](public/screenshots/06-kalender.png) |

| Persuratan & QR Code | Pengaturan Website CMS | Pusat Pengaturan Sistem |
|:--------------------:|:----------------------:|:-----------------------:|
| ![Surat](public/screenshots/07-surat.png) | ![Website Builder](public/screenshots/08-website-builder.png) | ![Pengaturan](public/screenshots/09-pengaturan.png) |

> Seluruh 37 tangkapan layar halaman aplikasi (8 halaman publik dan 29 modul dashboard terproteksi) tersedia di folder [`public/screenshots/pages/`](public/screenshots/pages/) dan hasil audit fungsional otomatis dapat dilihat pada [`public/screenshots/audit-report.json`](public/screenshots/audit-report.json).

## Akun Bawaan (Default Credentials)

Setelah menjalankan `npm run db:seed`, Anda dapat langsung masuk menggunakan akun default berikut:

| Peran (Role) | Email | Password | Hak Akses |
|--------------|-------|----------|-----------|
| **Administrator** | `admin@siop.local` | `admin123` | Akses penuh ke seluruh fitur, pengaturan sistem, dan modul |
| **Anggota** | `ahmad@siop.local` | `password123` | Akses dashboard anggota, profil, dan agenda kegiatan |

## Fitur Utama

### Autentikasi & Keamanan
- Login dengan email dan password
- Role-based Access Control (RBAC) dinamis
- Permission system yang fleksibel
- Two-factor authentication (via NextAuth)
- Password hashing dengan bcrypt
- Rate limiting untuk brute-force protection

### Manajemen Anggota
- CRUD anggota lengkap
- Upload foto profil dan TTD digital
- Data diri lengkap (tempat/tanggal lahir, alamat, kontak)
- Filter dan pencarian cepat
- Export data anggota

### Divisi & Struktur
- CRUD divisi dengan warna kustom
- Manajemen anggota divisi
- Position/jabatan di divisi
- Hierarki wilayah (Pusat, Korwil, dll)

### Program Kerja
- CRUD program kerja per divisi
- Checkpoint system (progress tracking)
- PIC (Person In Charge) assignment
- Timeline dan deadline
- Export laporan proker

### Keuangan
- Manajemen kas anggota (iuran bulanan)
- Kategori: kas, sumbangan, bisnis
- Approval system oleh bendahara
- Upload bukti transfer
- Rekap dan export laporan keuangan

### Kalender
- Agenda dan acara organisasi
- FullCalendar integration
- Integrasi dengan program kerja
- Multiple views (Month, Week, Day)
- Drag & drop untuk reschedule

### Surat Masuk/Keluar
- Template surat yang bisa dikustomisasi
- Form dinamis per jenis surat
- Generate surat otomatis
- Penomoran otomatis (format: {prefix}/{kode}/{tahun}/{nomor})
- QR code autentikasi surat
- Approval flow sekretaris
- Halaman verifikasi publik

### Mini Library
- Upload buku (PDF/EPUB)
- Kategori dan tags
- PDF reader built-in
- View count & download count

### Website Builder
- Multiple themes (organ2-style, default)
- Drag & drop page builder
- WYSIWYG editor (Tiptap)
- Section-based design
- Customizable colors

### Fitur Tambahan
- Proposal Dana dengan approval workflow
- Notifikasi real-time
- Audit log system
- Soft deletes untuk keamanan data
- Responsive design (mobile-friendly)

## Cara Kerja & Arsitektur Sistem

HubbHQ dibangun dengan arsitektur modern berbasis Next.js App Router, Prisma ORM, dan NextAuth v5. Sistem memisahkan antara portal publik yang ramah mesin pencari (SEO-friendly) dan dashboard internal terproteksi yang dilengkapi Role-Based Access Control (RBAC).

### 1. Diagram Arsitektur Tingkat Tinggi

```mermaid
flowchart TD
    subgraph Klien["1. Lapisan Pengguna & Klien"]
        PublicUser["Pengunjung Publik (Web/Mobile)"]
        MemberUser["Anggota & Pengurus Organisasi"]
        AdminUser["Administrator Sistem"]
    end

    subgraph Gerbang["2. Gerbang & Keamanan Edge"]
        Middleware["Next.js Middleware (Route Guard)"]
        RateLimiter["Rate Limiting & Anti Brute-Force"]
        AuthCheck["NextAuth v5 Session & Token Validator"]
    end

    subgraph Inti["3. Logika Aplikasi & App Router"]
        PublicRoutes["Portal Publik (/berita, /galeri, /tentang, /verify)"]
        DashboardApp["Dashboard Organisasi (/dashboard)"]
        CMSBuilder["Website & Theme Builder Engine"]
        APILayer["REST API Endpoints (/api/*)"]
    end

    subgraph Modul["4. Modul Fungsional"]
        ModSurat["Persuratan & QR HMAC Verification"]
        ModKeuangan["Keuangan, Kas Anggota & Approval"]
        ModProker["Program Kerja & Checkpoints"]
        ModAnggota["Direktori Anggota & Struktur Organisasi"]
        ModKalender["Kalender Agenda & FullCalendar Sync"]
    end

    subgraph DataStore["5. Lapisan Data & Penyimpanan"]
        PrismaORM["Prisma ORM 5.x"]
        Database[("MySQL 8.x Database")]
        StorageSystem["Storage Provider (Local / S3 / R2)"]
    end

    PublicUser -->|Akses Halaman Terbuka| Middleware
    MemberUser -->|Login & Autentikasi| Middleware
    AdminUser -->|Kelola Konfigurasi| Middleware

    Middleware --> RateLimiter
    RateLimiter --> AuthCheck

    AuthCheck -->|Publik / Terverifikasi| PublicRoutes
    AuthCheck -->|Sesi Login Valid| DashboardApp
    AuthCheck -->|Akses API Terproteksi| APILayer

    DashboardApp --> Modul
    CMSBuilder --> PublicRoutes
    APILayer --> Modul

    Modul --> PrismaORM
    Modul --> StorageSystem
    PrismaORM --> Database
```

### 2. Diagram Alur Autentikasi & Otorisasi Berjenjang (RBAC)

```mermaid
flowchart TD
    A["Pengguna Masuk ke /login"] --> B["Kirim Email & Password"]
    B --> C{"Pemeriksaan Rate Limit"}
    C -->|"Percobaan > 5 Kali"| D["Kunci Sementara 15 Menit"]
    C -->|"Aman"| E["Verifikasi Kredensial via Prisma & Bcrypt"]
    E -->|"Kredensial Salah"| F["Tampilkan Pesan Error"]
    E -->|"Kredensial Valid"| G["Generate Sesi NextAuth"]
    G --> H["Pengalihan ke /dashboard"]
    H --> I{"Pemeriksaan Hak Akses (RBAC)"}
    I -->|"Role: Administrator"| J["Akses Penuh: Master Data, CMS, Persetujuan & Log"]
    I -->|"Role: Pengurus / BPH"| K["Akses Terbatas: Persuratan, Keuangan, & Program Kerja"]
    I -->|"Role: Anggota"| L["Akses Personal: Profil, Iuran Kas, & Agenda Kegiatan"]
```

### 3. Diagram Alur Persuratan & Verifikasi QR Code

```mermaid
flowchart LR
    A["Pemohon / Anggota"] -->|"1. Isi Form Dinamis"| B["Sistem Persuratan"]
    B -->|"2. Antrean Masuk"| C["Sekretaris Organisasi"]
    C -->|"3. Review & Setujui"| D["Penomoran Otomatis"]
    D -->|"4. Beri Tanda Tangan"| E["Generate QR HMAC Signature"]
    E -->|"5. Render PDF Resmi"| F["Dokumen Terbit"]
    F -->|"6. Scan QR Code"| G["Halaman Verifikasi Publik"]
    G -->|"7. Cek Hash Kriptografi"| H["Status: Dokumen Asli & Valid"]
```

### 4. Diagram Alur Manajemen Keuangan & Kas Anggota

```mermaid
flowchart TD
    M["Anggota Organisasi"] -->|"1. Bayar Iuran Bulanan / Donasi"| U["Unggah Bukti Transfer"]
    U -->|"2. Simpan Catatan (Status: PENDING)"| T["Buku Kas & Transaksi"]
    T -->|"3. Notifikasi Antrean Transaksi"| B["Bendahara Organisasi"]
    B -->|"4. Verifikasi Bukti Transfer"| Decision{"Pemeriksaan Bendahara"}
    Decision -->|"Sesuai"| App["Status: APPROVED"]
    Decision -->|"Tidak Sesuai"| Rej["Status: REJECTED (Beri Catatan)"]
    App -->|"5. Perbarui Saldo Otomatis"| Saldo["Rekapitulasi Saldo Kas"]
    Saldo -->|"6. Cetak Laporan"| Rep["Laporan Keuangan (Excel / PDF)"]
```

## Panduan Cepat (Quick Start)

### Prerequisites

- Node.js 20.x atau lebih tinggi
- npm atau yarn
- MySQL 8.x atau MariaDB
- Docker (opsional)

### 1. Clone Repository

```bash
git clone https://github.com/ibnuasyi/HubbHQ.git
cd HubbHQ
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` sesuai konfigurasi database Anda:

```env
DATABASE_URL="mysql://user:password@localhost:3306/hubbhq"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema ke database
npm run db:push

# Setup awal (membuat admin, role, permission)
# Buka browser dan akses http://localhost:3000/setup
npm run dev
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Deployment Cloud - cicem.net

Jika Anda ingin mendeploy aplikasi secara gratis untuk organisasi Anda, gunakan **[cicem.net](https://cicem.net)** - Platform hosting gratis untuk organisasi Indonesia.

Keuntungan menggunakan cicem.net:
- Gratis untuk organisasi nirlaba
- Easy deployment dengan integrasi GitHub
- Sertifikat SSL otomatis
- Dukungan database MySQL
- CDN global untuk performa optimal

### Deploy ke cicem.net

```bash
# 1. Push kode ke GitHub
git push origin main

# 2. Buka https://cicem.net
# 3. Connect dengan GitHub repo Anda
# 4. Deploy otomatis!
```

## Deployment Docker

### Menggunakan Docker Compose

```bash
# Build dan jalankan
docker-compose up -d

# Lihat logs
docker-compose logs -f

# Stop
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t hubbhq .

# Jalankan container
docker run -d \
  --name hubbhq \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://host:3306/hubbhq" \
  -e NEXTAUTH_SECRET="your-secret" \
  hubbhq
```

## Struktur Project

```
hubbhq/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts               # Basic seed data
│   └── seed-full.ts          # Full seed data
├── src/
│   ├── app/
│   │   ├── (public)/        # Public pages (website)
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Admin dashboard
│   │   ├── login/            # Login page
│   │   ├── setup/            # First-time setup
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── ui/               # Shadcn/UI components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utilities & helpers
│   ├── themes/               # Website themes
│   └── hooks/                # Custom React hooks
├── scripts/                  # Utility scripts
├── docker-compose.yml        # Docker Compose config
├── Dockerfile                # Docker build
└── package.json
```

## Konfigurasi

### Environment Variables

| Variable | Deskripsi | Default |
|----------|----------|---------|
| `DATABASE_URL` | MySQL connection string | - |
| `NEXTAUTH_SECRET` | Secret untuk NextAuth | - |
| `NEXTAUTH_URL` | URL aplikasi | `http://localhost:3000` |
| `UPLOAD_DIR` | Direktori upload | `./uploads` |

### Roles & Permissions

Sistem menggunakan RBAC dengan roles berikut:

| Role | Akses |
|------|-------|
| `admin` | Akses penuh ke semua fitur |
| `ketua` | Kepengurusan organisasi |
| `sekretaris` | Manajemen surat & dokumen |
| `bendahara` | Keuangan & kas |
| `anggota` | Akses dasar |

## Pengembangan (Development)

### Perintah yang Tersedia

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate   # Generate Prisma Client
npm run db:push      # Push schema ke database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Run basic seed
```

### Standar Kode

Project menggunakan:
- ESLint untuk linting
- Prettier untuk formatting
- Husky + lint-staged untuk pre-commit hooks

## Lisensi

Project ini dilisensikan di bawah **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Lihat file [LICENSE](LICENSE) untuk detail lengkap.

### Implikasi Lisensi AGPL-3.0

- Anda bebas menggunakan, memodifikasi, dan mendistribusikan project ini
- Anda harus membuka source code modifikasi Anda
- Anda harus mencantumkan atribusi ke pembuat asli
- Modifikasi harus juga dilisensikan di bawah AGPL-3.0
- Anda **tidak boleh** menggunakan project ini untuk software proprietary tertutup

### Pembuat

Dikembangkan oleh **Ibnu Batuthah** - All Rights Reserved

## Kontribusi

Kontribusi sangat diterima! Silakan baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan berkontribusi.

## Dokumentasi

- [CONTRIBUTING.md](CONTRIBUTING.md) - Panduan berkontribusi
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Kode etik
- [CHANGELOG.md](CHANGELOG.md) - Riwayat perubahan

## Dukungan

Jika Anda menemukan bug atau memiliki pertanyaan:
1. Buat Issue baru di GitHub
2. Hubungi tim pengembang

---

<p align="center">
  HubbHQ - Dikembangkan oleh <strong>Ibnu Batuthah</strong>
</p>
