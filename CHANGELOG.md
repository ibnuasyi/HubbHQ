# Changelog

Semua perubahan signifikan dari project ini akan didokumentasikan di file ini.

Format ini berdasarkan [Keep a Changelog](https://keepachangelog.com/id-ID/1.0.0/).
Project ini mematuhi [Semantic Versioning](https://semver.org/lang/id/).

## [1.2.0] - 2026-10-25

### Added

#### Studio E-Sertifikat Terpadu & Sinkronisasi Proker
- **Studio E-Sertifikat Mandiri:** Editor visual dan generator e-sertifikat terintegrasi penuh tanpa dependensi eksternal, dilengkapi kustomisasi canvas, pemetaan tag dinamis (`{Nama}`, `{Sebagai}`, `{Nomor}`, `{Tanggal}`, `{QR}`), serta pratinjau instan.
- **Sinkronisasi E-Sertifikat Kepanitiaan Proker:** Integrasi otomatis penomoran dan penerbitan sertifikat kepanitiaan program kerja langsung ke modul verifikasi terpusat Studio E-Sertifikat (`SertifikatGenerated`).
- **Verifikasi Kredensial Publik:** Halaman verifikasi publik (`/sertifikat/verify/[...nomor]`) dengan perlindungan *rate limiting* dan kode QR validasi keaslian dokumen.
- **Pembaruan Aset & Dokumentasi:** Dokumentasi README diperbarui dengan fokus galeri visual modul dashboard dan petunjuk implementasi sistem.

### Changed
- **Peningkatan Efisiensi Database:** Standarisasi penggunaan instance tunggal Prisma Client (`@/lib/db`) di seluruh API handler CMS, Halaman, dan Tema untuk mencegah kebocoran pool koneksi.
- **Penyensoran Data Peminjaman:** Masking data pribadi kontak dan identitas peminjam pada modul inventaris untuk pengguna umum non-pengurus.
- **Standardisasi Skema Penomoran Sertifikat:** Dukungan pola format dinamis dan penyesuaian otomatis per divisi maupun jenis program kerja.

### Security

#### Pengerasan Perimeter & Kontrol Akses (Security Hardening)
- **Middleware & Header Keamanan:** Penutupan celah bypass header Authorization palsu, pembatasan ketat whitelist rute publik, serta penerapan HTTP Security Headers global (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- **Autentikasi & Reset Password:** Peningkatan keamanan token reset sandi menggunakan HMAC-SHA256 (`NEXTAUTH_SECRET:user.password`), eliminasi token dari respons JSON, dan penegakan batas laju (*rate limiting*) IP pada rute autentikasi.
- **Payment Gateway & QRIS Dinamis:** Verifikasi signature kriptografis Midtrans/Tripay, pencegahan bypass status pembayaran simulasi berbasis RBAC, dan masking kredensial rahasia gateway bagi non-admin.
- **Pencegahan Kebocoran Hash Password:** Proyeksi eksplisit Prisma (`select`) pada seluruh endpoint Anggota, Divisi, dan Alumni guna menjamin hash sandi bcrypt tidak pernah bocor ke klien.
- **Anti-Race Condition & Integritas Transaksi:** Penguncian transaksi atomik pada modul Voting/Quick Count untuk mencegah *double-voting*, serta pembaruan bersyarat atomik (`updateMany`) pada peminjaman inventaris guna mencegah stok bernilai negatif.
- **Tata Kelola Administrasi & Anti Self-Approval:** Pencegahan persetujuan mandiri (*self-approval prevention*) pada pengesahan surat dan proposal/LPJ keuangan kegiatan.
- **Penyimpanan Berkas Terpadu & Sanitasi Path:** Penghapusan pengunggahan file arbitrary; validasi magic bytes (PDF, DOCX, DOC, PNG, JPEG), whitelist ekstensi, pembatasan ukuran maksimal 15 MB, dan sanitasi nama folder guna mencegah *path traversal*.
- **Mitigasi BOLA / IDOR:** Pengamanan otorisasi bertingkat (`canManageProker`, `canReviewProkerFinance`) pada notula rapat, proposal, LPJ, berkas kepanitiaan, dan relasi section halaman CMS.
- **Privasi Pengaduan Whistleblower:** Otorisasi mutasi dan penghapusan aspirasi, proteksi privasi PIN pelacak dan nomor kontak pelapor, serta rate limiting pada tracking publik untuk mencegah serangan brute-force.
- **Mitigasi Denial of Service (DoS):** Pembatasan dimensi pembangkitan QR Code (50 - 1000 px), batas panjang karakter teks, rate limiting pada ekspor data (Surat & Proker) dan pengunggahan berkas, serta eliminasi instansiasi koneksi Prisma ganda.
- **Pencegahan XSS & Injeksi Skema:** Pemblokiran skema `javascript:` pada seluruh input URL berkas, galeri, foto kegiatan, dan template sertifikat.

## [1.1.0] - 2026-10-24

### Added

#### Tata Kelola Program Kerja (Proker) & Alur Organisasi
- **Halaman Mandiri Program Kerja** (`/dashboard/proker/[id]`) dengan navigasi terintegrasi, visualisasi progress dinamis, dan matriks organisasi lengkap (sasaran audiens, indikator KPI, anggaran RAB, sumber dana, lokasi, dan tanggal pelaksanaan).
- **Halaman Mandiri Proposal Dana** (`/dashboard/proposal/[id]`) untuk peninjauan dan evaluasi anggaran oleh BPH/Bendahara.
- **Sistem Checkpoint & Pelacakan Progres** dengan pewarnaan kontras tinggi yang nyaman dibaca pada Mode Terang maupun Mode Gelap (Dark Mode).
- **Manajemen Susunan Panitia Pelaksana (OC)** dengan penetapan peran jabatan teknis kegiatan dan informasi kontak.

#### Proposal Dana Terpadu & Audit Trail Versi (Git-Like)
- **Pengajuan Berbasis PIC:** Proposal dana hanya dapat dinaikkan langsung dari halaman proker setelah penanggung jawab (PIC) ditetapkan.
- **Persetujuan & Penolakan dengan Evaluasi:** BPH/Bendahara dapat menyetujui (ACC) atau menolak proposal dengan melampirkan catatan evaluasi perbaikan.
- **Riwayat Versi Terdistribusi (Git-Like Versioning):** Seluruh versi proposal yang pernah diajukan beserta catatan penolakan disimpan permanen dalam riwayat versi (`proposal_history`) sebagai sarana pembelajaran kepanitiaan.

#### Sistem LPJ Terpadu & 3 Kantong Dana (Fund Separation)
- **Master Template LPJ Organisasi:** Bendahara atau Sekretaris dapat mengunggah berkas template resmi organisasi (`.docx`, `.xlsx`, atau `.pdf` pedoman baku) yang dapat diunduh oleh panitia proker dengan 1-klik.
- **Pemisahan 3 Kantong Anggaran:** Membedakan sumber dana realisasi belanja ke dalam 3 kategori:
  - `DANA_AJUAN`: Dana subsidi dari kas umum organisasi berdasarkan proposal yang di-ACC.
  - `KAS_PROKER`: Kas mandiri panitia hasil iuran sukarela/wajib atau laba usaha mandiri (danus).
  - `DANA_LUAR`: Kemitraan sponsorship, donatur, hibah, serta penjualan tiket/HTM peserta.
- **Rekonsiliasi Surplus Kas Fleksibel:** Opsi resmi pembukuan sisa dana saat LPJ disahkan:
  - Setor kembali ke kas umum BPH (otomatis mencatat transaksi penerimaan di modul Keuangan).
  - Alokasi syukuran / apresiasi pembubaran panitia (otomatis mencatat pos pengeluaran penutup dengan saldo akhir balance Rp 0).
  - Simpan sebagai tabungan modal kas cadangan divisi untuk kegiatan berikutnya.
- **Checklist Kelaikan Berkas Fisik Pra-Sidang (Audit Compliance Gate):** Verifikasi berkas fisik (nota kuitansi asli, presensi & notula rapat, dokumentasi foto, dan berita acara) sebelum pengesahan resmi.
- **Unggah Dokumen Final LPJ:** Fasilitas melampirkan berkas buku LPJ utuh bertanda tangan scan lengkap.
- **Ekspor Otomatis LPJ:** Menghasilkan laporan pertanggungjawaban dalam format PDF dan Excel spreadsheet.

#### E-Sertifikat Kepanitiaan Proker
- **Template Desain Kustom per Proker:** Dukungan template desain blanko piagam dan konfigurasi penandatangan (Ketua Pelaksana & Ketua Umum) per kegiatan.
- **Penomoran Baku Otomatis:** Generator nomor sertifikat terstruktur per program kerja (contoh: `001/SERT-OC/INTI/LDKO/X/2026`).
- **Pratinjau & Cetak Piagam Digital:** Piagam penghargaan interaktif berbingkai resmi yang siap cetak langsung.

#### Modul Divisi & Bank Evaluasi Organisasi
- **Kumpulan LPJ per Divisi:** Tab arsip untuk melihat seluruh riwayat LPJ proker di bawah naungan divisi bersangkutan beserta dokumen finalnya.
- **Bank Evaluasi Organisasi (Knowledge Management):** Pengindeksan kendala, solusi sukses, dan rekomendasi mitigasi dari LPJ sebelumnya untuk pembelajaran pengurus periode berikutnya.

### Changed
- **Pembersihan Branding:** Menghapus seluruh nama instansi pihak ketiga (KPRI) dari antarmuka dan basis data, mengubah nama default menjadi **HubbHQ** yang dapat dikonfigurasi secara dinamis.
- **Migrasi Spreadsheet:** Migrasi penuh pustaka pengolah lembar sebar ke `exceljs` yang lebih aman dan terbebas dari kerentanan keamanan.
- **Peningkatan Kontras Dark Mode:** Optimalisasi styling Tailwind untuk memastikan keterbacaan teks yang sangat tajam pada komponen checkpoint, badge, dan modal.

### Security
- Patch dependensi terhadap potensi kerentanan CVE pada pustaka utilitas pemrosesan dokumen.
- Validasi hak akses RBAC (Role-Based Access Control) yang diperketat pada seluruh API endpoint program kerja, proposal, dan LPJ.

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
