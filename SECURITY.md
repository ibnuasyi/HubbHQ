# Security Policy

## Supported Versions

Kami sedang dalam pengembangan aktif. Gunakan versi terbaru yang tersedia untuk keamanan terbaik.

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < older | :x:                |

## Melaporkan Vulnerability

Kami sangat menghargai kontribusi komunitas dalam menemukan vulnerability. Ikuti langkah-langkah berikut untuk melaporkan masalah keamanan:

### Cara Melaporkan

1. **Jangan** membuat issue publik untuk vulnerability keamanan
2. Kirimkan laporan melalui email ke maintainer project
3. Sertakan detail berikut:
   - Deskripsi vulnerability
   - Langkah mereproduksi
   - Potensi dampak
   - Saran perbaikan (jika ada)

### Apa yang Kami Harapkan

- Laporan yang jelas dan detail
- Respons dalam 48 jam pertama
- Tidak mengeksploitasi vulnerability yang ditemukan
- Memberikan waktu yang cukup untuk perbaikan sebelum diumumkan publik

### Apa yang Kami Janji

- **Acksnowledge**: Kami akan mengkonfirmasi penerimaan laporan dalam 48 jam
- **Updates**: Kami akan memberikan status update setiap 7 hari
- **Credit**: Kami akan menyebutkan reporter dalam release notes (jika diinginkan)
- **Disclosure**: Kami akan mengumumkan vulnerability setelah perbaikan tersedia

## Praktik Keamanan yang Direkomendasikan

Jika Anda deploy SiopBaru di infrastruktur sendiri, berikut beberapa praktik keamanan:

### Environment Variables

- Jangan pernah commit file `.env` ke repository
- Gunakan secret manager untuk menyimpan kredensial
- Rotate password dan API keys secara berkala

### Database

- Gunakan koneksi terenkripsi
- Batasi akses database hanya ke aplikasi
- Enable audit logging

### Container Security

- Jangan jalankan container sebagai root
- Update image secara berkala
- Gunakan image resmi dan verified

### Production Deployment

- Enable HTTPS/WSS saja
- Konfigurasi rate limiting
- Monitoring logs untuk aktivitas mencurigakan
- Disable debug mode di production

## Incident Response

Jika terjadi insiden keamanan:

1. isolation immediately
2. Assessment dan containment
3. Notification ke user yang terdampak
4. Perbaikan dan deployment
5. Post-mortem dan pembelajaran

---

Terima kasih telah membantu menjaga keamanan SiopBaru!
