# Contributing to HubbHQ

Terima kasih atas minat Anda untuk berkontribusi pada **HubbHQ**! Project ini berkembang berkat kontribusi dari developer seperti Anda.

## 📋 Daftar Isi

- [Kode Etik](#kode-etik)
- [Cara Berontribusi](#cara-berkontribusi)
- [Menyiapkan Environment](#menyiapkan-environment)
- [Workflow Development](#workflow-development)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Coding Standards](#coding-standards)
- [Commits](#commits)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

---

## Kode Etik

Dengan berpartisipasi dalam project ini, Anda setuju untuk mematuhi [Code of Conduct](CODE_OF_CONDUCT.md) kami.

## Cara Berontribusi

### 🐛 Melaporkan Bug

1. **Cari terlebih dahulu** - Pastikan bug belum dilaporkan
2. **Gunakan template** - Gunakan Issue template yang tersedia
3. **Detail yang jelas** - Sertakan:
   - Steps to reproduce
   - Expected vs Actual behavior
   - Screenshots jika relevan
   - Environment info (OS, Node version, dll)

### 💡 Feature Requests

1. **Diskusikan dulu** - Buka discussion sebelum membuat PR besar
2. **Jelaskan use case** - Mengapa fitur ini penting?
3. **Pertimbangkan scope** - Apakah sesuai dengan roadmap project?

---

## Menyiapkan Environment

### Prerequisites

- Node.js 20.x atau lebih tinggi
- npm atau yarn
- Git
- Docker (opsional)

### Langkah Setup

```bash
# 1. Fork repository
# Klik tombol "Fork" di GitHub

# 2. Clone fork Anda
git clone https://github.com/YOUR-USERNAME/HubbHQ.git
cd HubbHQ

# 3. Tambahkan upstream remote
git remote add upstream https://github.com/ibnuasyi/HubbHQ.git

# 4. Install dependencies
npm install

# 5. Copy environment file
cp .env.example .env

# 6. Setup database (pastikan MySQL berjalan)
npm run db:generate
npm run db:push

# 7. Jalankan development server
npm run dev
```

---

## Workflow Development

### 1. Buat Branch Baru

```bash
# Sinkronkan dengan upstream
git fetch upstream
git checkout main
git merge upstream/main

# Buat branch baru dengan naming convention
git checkout -b feature/nama-fitur
# atau
git checkout -b fix/nama-bug
# atau
git checkout -b refactor/nama-refactor
```

### Branch Naming Convention

| Prefix | Penggunaan |
|--------|-----------|
| `feature/` | Fitur baru |
| `fix/` | Perbaikan bug |
| `hotfix/` | Perbaikan urgent |
| `refactor/` | Refactoring kode |
| `docs/` | Dokumentasi |
| `test/` | Test case |

### 2. Lakukan Perubahan

```bash
# Buat perubahan kode Anda
# ...

# Cek perubahan
git status
git diff

# Add dan commit
git add .
git commit -m "feat: tambah fitur baru"
```

### 3. Sinkronkan dengan Upstream

```bash
# Fetch perubahan terbaru
git fetch upstream

# Rebase ke main terbaru
git rebase upstream/main

# Solve conflicts jika ada
```

### 4. Push dan Buat PR

```bash
# Push ke fork Anda
git push origin feature/nama-fitur

# Buka GitHub dan buat Pull Request
```

---

## Pull Request Guidelines

### PR Template

Gunakan template berikut untuk PR:

```markdown
## Deskripsi
<!-- Jelaskan perubahan yang Anda buat -->

## Type of Change
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 💅 Enhancement
- [ ] 📝 Documentation
- [ ] 🔧 Refactoring
- [ ] ✅ Tests
- [ ] 🔒 Security

## Screenshots (jika ada UI changes)
<!-- Tambahkan screenshot di sini -->

## Testing
<!-- Jelaskan bagaimana Anda menguji perubahan -->

## Checklist
- [ ] Kode sudah di-test
- [ ] Linting passed
- [ ] Tidak ada console.error/debug
- [ ] Dokumentasi sudah diupdate
- [ ] Commit message sesuai convention
```

### Checklist Sebelum Submit PR

- [ ] Branch sudah di-rebase ke latest main
- [ ] Tidak ada conflict
- [ ] Linting passed (`npm run lint`)
- [ ] Build success (`npm run build`)
- [ ] Test passed (jika applicable)
- [ ] Commit message jelas dan sesuai convention
- [ ] PR description lengkap

---

## Coding Standards

### Bahasa & Framework

- **TypeScript** - Wajib digunakan
- **React 19** dengan App Router
- **Next.js 16** App Router
- **NextAuth v5** untuk autentikasi
- **Prisma** untuk database ORM
- **Tailwind CSS** untuk styling

### Code Style

Project menggunakan ESLint dan Prettier. Pastikan:

```bash
# Run linting
npm run lint

# Format kode
npm run format
```

### TypeScript Guidelines

```typescript
// ✅ Good: Gunakan interface untuk object shapes
interface User {
  id: string
  name: string
  email: string
}

// ✅ Good: Gunakan type untuk unions
type Status = 'pending' | 'approved' | 'rejected'

// ❌ Bad: Jangan gunakan any
function process(data: any) { ... }
```

### Component Guidelines

```typescript
// ✅ Good: Pisahkan props interface
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button className={cn('btn', variant)} onClick={onClick}>
      {children}
    </button>
  )
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `isActive` |
| Functions | camelCase | `getUser()`, `handleSubmit()` |
| Classes | PascalCase | `UserService`, `ApiClient` |
| Components | PascalCase | `UserCard`, `DashboardPage` |
| Interfaces | PascalCase | `UserProps`, `ApiResponse` |
| Constants | UPPER_SNAKE | `MAX_RETRIES`, `API_URL` |
| Files | kebab-case | `user-service.ts`, `login-page.tsx` |

---

## Commits

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

| Type | Deskripsi |
|------|----------|
| `feat` | Feature baru |
| `fix` | Bug fix |
| `docs` | Dokumentasi |
| `style` | Formatting, white-space |
| `refactor` | Refactoring kode |
| `perf` | Performance improvement |
| `test` | Menambah test |
| `chore` | Build process, dependencies |
| `revert` | Revert commit |

### Contoh

```bash
# Feature
git commit -m "feat(anggota): tambah filter wilayah pada list anggota"

# Bug fix
git commit -m "fix(auth): perbaiki validasi email yang salah

# Refactor
git commit -m "refactor(api): extract user validation ke helper"

# Docs
git commit -m "docs(readme): update installation steps"
```

---

## Reporting Bugs

### Template Bug Report

```markdown
**Description**
<!-- Jelaskan bug secara singkat -->

**To Reproduce**
<!-- Langkah untuk mereproduksi -->
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
<!-- Apa yang seharusnya terjadi -->

**Actual Behavior**
<!-- Apa yang terjadi sekarang -->

**Screenshots**
<!-- Tambahkan screenshot jika ada -->

**Environment:**
- OS: [e.g. macOS 14.0]
- Node: [e.g. 18.17.0]
- Browser: [e.g. Chrome 120]

**Additional Context**
<!-- Info tambahan yang relevan -->
```

---

## Feature Requests

### Template Feature Request

```markdown
**Is your feature request related to a problem? Please describe.**
<!-- Jelaskan masalah yang ingin solved -->

**Describe the solution you'd like**
<!-- Jelaskan solusi yang Anda inginkan -->

**Describe alternatives you've considered**
<!-- Alternative yang sudah dipertimbangkan -->

**Additional context**
<!-- Screenshot, mockup, atau info tambahan -->
```

---

## 🎯 Area yang Membutuhkan Kontribusi

- [ ] Dokumentasi yang lebih lengkap
- [ ] Unit test untuk API routes
- [ ] Integration test
- [ ] E2E test dengan Playwright
- [ ] Performance optimization
- [ ] Mobile responsive improvements
- [ ] Accessibility (a11y) improvements

---

## 📞 Kontak

Jika ada pertanyaan, jangan ragu untuk:

- Buka Discussion di GitHub
- Website: https://ibnuasyi.github.io/HubbHQ

---

Terima kasih atas kontribusi Anda! 🙏
