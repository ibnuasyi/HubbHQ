# Changelog

Semua perubahan signifikan dari project ini akan didokumentasikan di file ini.

Format ini berdasarkan [Keep a Changelog](https://keepachangelog.com/id-ID/1.0.0/).
Project ini mematuhi [Semantic Versioning](https://semver.org/lang/id/).

## [1.0.0] - 2026-07-12

### Added

#### Sistem Inti
- **First Time Setup** - Halaman `/setup` untuk inisialisasi database
  - Input nama organisasi, deskripsi, logo
  - Akun admin dengan email dan password
  - Pilihan warna branding
  - Auto-create roles, permissions, dan themes
- **Dashboard Layout** dengan redirect otomatis ke `/setup` jika database kosong

#### Authentication & Security
- NextAuth v5 dengan Credentials provider
- Password hashing dengan bcryptjs
- Role-based Access Control (RBAC) dinamis
- 28 predefined permissions
- 5 roles: Admin, Ketua, Sekretaris, Bendahara, Anggota
- Brute-force protection dengan rate limiting
- Session management dengan JWT

#### Manajemen Anggota
- CRUD anggota lengkap
- Upload avatar dan TTD digital
- Filter dan pencarian
- Export data

#### Divisi & Struktur
- CRUD divisi dengan warna kustom
- Manajemen anggota divisi
- Hierarki wilayah (Pusat, Korwil, dll)
- Jabatan organisasi

#### Program Kerja
- CRUD program kerja per divisi
- Checkpoint system (progress tracking)
- PIC assignment
- Timeline dan deadline

#### Keuangan
- Manajemen kas anggota (iuran bulanan)
- Kategori: kas, sumbangan, bisnis
- Approval system oleh bendahara
- Upload bukti transfer
- Rekap dan export laporan keuangan

#### Kalender
- FullCalendar integration
- Multiple views (Month, Week, Day)
- Drag & drop untuk reschedule
- Integrasi dengan program kerja

#### Surat Masuk/Keluar
- Template surat dengan form schema
- FormBuilder component
- Penomoran otomatis
- QR code autentikasi surat
- Halaman verifikasi publik
- Approval flow sekretaris

#### Mini Library
- Upload buku (PDF/EPUB)
- PDF reader built-in
- Kategori dan tags

#### Website Builder
- **Tema kpri-style** - Tema formal untuk organisasi pergerakan
  - Hero section dengan 3 variants
  - About section dengan 4 variants
  - Stats section dengan animasi counter
  - Programs section dengan cards
  - VisiMisi section
  - Team section
  - CTA section
  - Header dan Footer dengan branding
- **Tema default** - Tema modern dan fleksibel
- Page builder dengan drag & drop
- Section-based design
- WYSIWYG editor (Tiptap)
- Customizable colors

#### Proposal Dana
- CRUD proposal
- Approval workflow multi-level
- Revision workflow

#### UI/UX
- Dark/Light mode dengan next-themes
- Sidebar navigation dengan collapsible
- Responsive design (mobile-friendly)
- Shadcn/UI components
- Toast notifications
- Loading states

#### Lainnya
- Soft deletes untuk keamanan data
- Audit log system
- Optimistic Concurrency Control untuk transaksi
- QR code generation
- Export PDF/Excel laporan
- Docker deployment ready
- Git hooks dengan Husky + lint-staged

### Security Features

- XSS Protection dengan DOMPurify
- CSRF Protection dengan Origin validation
- IDOR Protection
- Mass Assignment Protection
- Path Traversal prevention
- File upload validation (magic bytes, EXIF stripping)
- HMAC-signed URLs untuk QR verification
- Cache poisoning prevention
- Disaster recovery backup scripts

### Dependencies

- Next.js 16.2.10
- React 19.2.7
- TypeScript 5.x
- Prisma 5.22.0 (MySQL adapter)
- Tailwind CSS 3.4
- NextAuth v5 (beta)
- FullCalendar 6.1
- Tiptap 3.27
- Recharts 2.12
- jsPDF & xlsx untuk export
- ESLint 9.x

---

## [Unreleased] - 2026-07-11

### Added
- **THEME_GUIDE.md** - Panduan lengkap untuk membuat tema baru

### Changed
- **Major Upgrade**: Next.js 14.2.0 → 16.2.10
- **Major Upgrade**: React 18.2 → 19.2.7
- **Major Upgrade**: next-auth v4 → v5 (beta)
- **Upgrade**: ESLint 8 → 9.x
- **Upgrade**: lucide-react ke versi terbaru
- **Upgrade**: next-themes ke versi terbaru
- **Rename Theme**: kpri-style → organ2-style

### Security
- Perbaikan multiple vulnerabilities dari Next.js security advisory
- Semua dependencies sudah diupgrade ke versi aman

### Added
- Dokumentasi GitHub lengkap (SECURITY.md, ISSUE_TEMPLATE, PR_TEMPLATE, FUNDING.yml)

---

## Template

```markdown
## [Version] - YYYY-MM-DD

### Added
- Fitur baru

### Changed
- Perubahan pada fitur yang ada

### Deprecated
- Fitur yang akan dihapus nanti

### Removed
- Fitur yang dihapus

### Fixed
- Bug yang diperbaiki

### Security
- Perbaikan keamanan
```

## Catatan Tambahan

### Major Updates Checklist
- [ ] Update version di package.json
- [ ] Buat entry di CHANGELOG.md
- [ ] Update README.md jika perlu
- [ ] Buat GitHub Release
- [ ] Update dokumentasi

### Before Creating Release
- [ ] Semua tests passed
- [ ] Linting passed
- [ ] Build success
- [ ] No console.errors
- [ ] Dokumentasi lengkap
- [ ] Changelog updated

---

Dikembangkan oleh **Ibnu Batuthah** - All Rights Reserved
