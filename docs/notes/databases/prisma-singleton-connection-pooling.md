# Prisma Singleton Pattern & Connection Pooling in Node.js

**Kategori:** Database & ORM  
**Tanggal:** 2026-08-18  
**Referensi Resmi:**

- [Prisma Best Practices: Instantiate PrismaClient](https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices)
- [node-postgres (pg) Pool Documentation](https://node-postgres.com/features/pooling)
- [PostgreSQL Connection Limits](https://www.postgresql.org/docs/current/runtime-config-connection.html)

---

## 1. Ringkasan Konsep

Saat membangun aplikasi backend berbasis Node.js dengan database relasional (seperti PostgreSQL) menggunakan Prisma ORM, efisiensi dan keamanan manajemen koneksi TCP adalah penentu stabilitas performa sistem di bawah beban tinggi (_high concurrency_).

### Arsitektur Aliran Query:

```
[ HTTP Controller / Service ]
             │ (Typed Queries)
             ▼
    [ Prisma Client ]
             │ (Generated SQL)
             ▼
 [ @prisma/adapter-pg ]
             │ (Driver Bridge)
             ▼
        [ pg.Pool ] (Connection Pool)
             │ (Keep-Alive TCP Sockets)
             ▼
[ PostgreSQL Server (Port 5432) ]
```

---

## 2. Mengapa Memerlukan Connection Pooling?

### Tanpa Connection Pool (Anti-Pattern):

Setiap query membuka koneksi jaringan TCP baru, melakukan handshake, TLS negosiasi, otentikasi password, lalu menutup koneksi.

- **Dampak:** Latensi tinggi (+30ms s/d 100ms per query) dan CPU database terbebani proses handshake.

### Dengan `pg.Pool` (Best Practice):

Aplikasi menyiapkan sejumlah koneksi TCP terbuka (_warm connections_, misal 10 koneksi).

- **Mekanisme Peminjaman:** Request meminjam 1 koneksi kosong dari pool, menjalankan query dalam hitungan milidetik, lalu **mengembalikannya kembali ke pool**.
- **Perlindungan Overload:** Jika ada 500 request masuk bersamaan sedangkan pool berukuran 10, request ke-11 s/d 500 akan **mengantre di memori aplikasi**, bukan menembak 500 koneksi ke PostgreSQL yang menyebabkan crash `FATAL: too many clients already`.

---

## 3. Masalah Connection Exhaustion & Trik `globalThis`

### Masalah di Environment `development`:

Tools development (seperti `tsx watch`, `ts-node-dev`, atau Next.js HMR) me-_reload_ modul file setiap kali file disimpan (Ctrl + S).

- Jika instansiasi dilakukan secara naif (`export const prisma = new PrismaClient()`), setiap _save_ akan membuat instance `PrismaClient` baru dan `Pool` baru di memori.
- Dalam hitungan menit, batas koneksi database (`max_connections`) akan habis.

### Solusi Singleton via `globalThis`:

```typescript
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:password@localhost:5432/node_backend_mastery_dev';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Gunakan instance yang sudah ada di globalThis jika tersedia, atau buat baru
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

// Simpan ke globalThis hanya saat development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

- **Kenapa di Production tidak perlu `globalThis`?**  
  Di production, server berjalan sebagai proses statis (_long-running process_) yang tidak mengalami _hot-reloading_ atau _file save_. Module cache Node.js sudah secara alami mempertahankan singleton.

---

## 4. Keamanan Konfigurasi: `.env` vs `.env.example`

| File               | Sifat                    | Fungsi                                                                                                       |           Masuk Git Repo?            |
| :----------------- | :----------------------- | :----------------------------------------------------------------------------------------------------------- | :----------------------------------: |
| **`.env`**         | Rahasia (_Confidential_) | Menyimpan nilai nyata rahasia (password DB, secret key, token).                                              | ❌ **TIDAK** (Wajib di `.gitignore`) |
| **`.env.example`** | Publik (_Blueprint_)     | Template/kontrak yang mendokumentasikan key apa saja yang dibutuhkan sistem tanpa membocorkan nilai aslinya. |     ✅ **YA** (Wajib di-commit)      |

---

## 5. Key Takeaways & Checklist

- [x] Selalu gunakan singleton `PrismaClient` yang terikat pada `globalThis` di development.
- [x] Manfaatkan driver adapter (`@prisma/adapter-pg`) untuk integrasi penuh dengan `pg.Pool`.
- [x] Pastikan `.env` terdaftar di `.gitignore` dan sediakan `.env.example` sebagai kontrak.
- [x] Pastikan test suite memiliki unit test untuk memverifikasi keutuhan singleton lintas impor.
