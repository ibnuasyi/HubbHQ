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

## 📸 Screenshot

<details>
<summary>Klik untuk melihat screenshot</summary>

| Dashboard | Login | Halaman Depan |
|:---------:|:-----:|:-------------:|
| ![Dashboard](.github/screenshots/dashboard.png) | ![Login](.github/screenshots/login.png) | ![Homepage](.github/screenshots/homepage.png) |

| Manajemen Anggota | Keuangan | Kalender |
|:-----------------:|:--------:|:--------:|
| ![Members](.github/screenshots/members.png) | ![Keuangan](.github/screenshots/keuangan.png) | ![Kalender](.github/screenshots/kalender.png) |

*Screenshot akan ditambahkan nanti*

</details>

## ✨ Fitur

### 🔐 Autentikasi & Keamanan
- Login dengan email dan password
- Role-based Access Control (RBAC) dinamis
- Permission system yang fleksibel
- Two-factor authentication (via NextAuth)
- Password hashing dengan bcrypt
- Rate limiting untuk brute-force protection

### 👥 Manajemen Anggota
- CRUD anggota lengkap
- Upload foto profil dan TTD digital
- Data diri lengkap (tempat/tanggal lahir, alamat, kontak)
- Filter dan pencarian cepat
- Export data anggota

### 📁 Divisi & Struktur
- CRUD divisi dengan warna kustom
- Manajemen anggota divisi
- Position/jabatan di divisi
- Hierarki wilayah (Pusat, Korwil, dll)

### 📋 Program Kerja
- CRUD program kerja per divisi
- Checkpoint system (progress tracking)
- PIC (Person In Charge) assignment
- Timeline dan deadline
- Export laporan proker

### 💰 Keuangan
- Manajemen kas anggota (iuran bulanan)
- Kategori: kas, sumbangan, bisnis
- Approval system oleh bendahara
- Upload bukti transfer
- Rekap dan export laporan keuangan

### 📅 Kalender
- Agenda dan acara organisasi
- FullCalendar integration
- Integrasi dengan program kerja
- Multiple views (Month, Week, Day)
- Drag & drop untuk reschedule

### 📨 Surat Masuk/Keluar
- Template surat yang bisa dikustomisasi
- Form dinamis per jenis surat
- Generate surat otomatis
- Penomoran otomatis (format: {prefix}/{kode}/{tahun}/{nomor})
- QR code autentikasi surat
- Approval flow sekretaris
- Halaman verifikasi publik

### 📚 Mini Library
- Upload buku (PDF/EPUB)
- Kategori dan tags
- PDF reader built-in
- View count & download count

### 🌐 Website Builder
- Multiple themes (organ2-style, default)
- Drag & drop page builder
- WYSIWYG editor (Tiptap)
- Section-based design
- Customizable colors

### 📊 Lainnya
- Proposal Dana dengan approval workflow
- Notifikasi real-time
- Audit log system
- Soft deletes untuk keamanan data
- Responsive design (mobile-friendly)

## 🚀 Quick Start

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

## ☁️ Free Hosting - cicem.net

Jika Anda ingin mendeploy aplikasi secara gratis untuk organisasi Anda, gunakan **[cicem.net](https://cicem.net)** - Platform hosting gratis untuk organisasi Indonesia.

Keuntungan menggunakan cicem.net:
- ✅ Gratis untuk organisasi nirlaba
- ✅ Easy deployment dengan GitHub integration
- ✅ SSL certificate otomatis
- ✅ Support database MySQL
- ✅ CDN global untuk performa terbaik

### Deploy ke cicem.net

```bash
# 1. Push kode ke GitHub
git push origin main

# 2. Buka https://cicem.net
# 3. Connect dengan GitHub repo Anda
# 4. Deploy otomatis!
```

## 🐳 Docker Deployment

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

## 📁 Struktur Project

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

## 🔧 Konfigurasi

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

## 🛠️ Development

### Available Scripts

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

### Code Style

Project menggunakan:
- ESLint untuk linting
- Prettier untuk formatting
- Husky + lint-staged untuk pre-commit hooks

## 📝 License

Project ini dilisensikan di bawah **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Lihat file [LICENSE](LICENSE) untuk detail lengkap.

### Implikasi Lisensi AGPL-3.0

- ✅ Anda bebas menggunakan, memodifikasi, dan mendistribusikan project ini
- ✅ Anda harus membuka source code modifikasi Anda
- ✅ Anda harus mencantumkan attribution ke author asli
- ✅ Modifikasi harus juga dilisensikan di bawah AGPL-3.0
- ❌ Anda **tidak boleh** menggunakan project ini untuk proprietary software

### Kontributor

Dikembangkan oleh **Ibnu Batuthah** - All Rights Reserved

## 🤝 Contributing

Kontribusi sangat diterima! Silakan baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan berkontribusi.

## 📖 Dokumentasi

- [CONTRIBUTING.md](CONTRIBUTING.md) - Panduan berkontribusi
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Kode etik
- [CHANGELOG.md](CHANGELOG.md) - Riwayat perubahan

## 🆘 Dukungan

Jika Anda menemukan bug atau memiliki pertanyaan:
1. Buat Issue baru di GitHub
2. Email ke developer

---

<p align="center">
  Dibuat dengan ❤️ oleh <strong>Ibnu Batuthah</strong>
</p>
