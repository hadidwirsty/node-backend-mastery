# Relational Data Modeling (3NF), Referential Integrity & Repository Pattern

**Kategori:** Database Architecture & Testing  
**Tanggal:** 2026-08-18  
**Referensi Resmi:**

- [Prisma Relations & Referential Actions](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-actions)
- [PostgreSQL Constraints & Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Martin Fowler: Repository Pattern & Inversion of Control](https://martinfowler.com/eaaCatalog/repository.html)

---

## 1. Ringkasan Konsep

Dalam perancangan database backend profesional (_production-grade_), integritas data, imutabilitas histori transaksi keuangan, dan kemudahan pengujian (_testability_) adalah pilar utama.

Struktur data e-commerce dibangun dalam **Third Normal Form (3NF)** dengan 6 entitas yang saling terhubung:

1. `User` — Akun pengguna/pelanggan terdaftar.
2. `Category` — Klasifikasi kategori produk.
3. `Product` — Katalog produk dengan harga jual saat ini.
4. `Inventory` — Pelacak stok produk (relasi 1:1 terhadap `Product`).
5. `Order` — Header pesanan transaksi (total harga, status, user ID).
6. `OrderItem` — Rincian item pesanan (snapshot harga & kuantitas).

```
┌──────────┐                     ┌──────────────┐
│ Category │ 1                 N │   Product    │
└────┬─────┘─────────────────────└───┬──────────┘
     │                               │
     │ (onDelete: Restrict)          │ (onDelete: Cascade)
     │                               ▼
     │                         ┌───────────┐
     │                         │ Inventory │ (1:1 Stock Tracker)
     │                         └───────────┘
     │                               ▲
     │                               │ (onDelete: Restrict)
     │                               │
┌────┴─────┐ 1                 N ┌───┴──────────┐
│   User   │────────────────────►│    Order     │ (Status & Total)
└──────────┘                     └───┬──────────┘
                                     │
                                     │ (onDelete: Cascade)
                                     ▼
                                 ┌───────────┐
                                 │ OrderItem │ (Snapshot Qty & Price)
                                 └───────────┘
```

---

## 2. Pola Imutabilitas: Price Snapshot Pattern

| Entitas & Kolom   | Karakteristik Data                                | Peran Bisnis                                         |
| :---------------- | :------------------------------------------------ | :--------------------------------------------------- |
| `Product.price`   | **Mutable** (Dapat berubah sewaktu-waktu)         | Harga katalog aktif produk saat ini.                 |
| `OrderItem.price` | **Immutable** (Tetap selamanya setelah transaksi) | Bukti nilai transaksi yang disepakati saat checkout. |

### Mengapa Sangat Kritis?

Jika tabel `OrderItem` tidak menyimpan `price` sendiri dan hanya me-relasikannya ke `Product.price`, maka setiap kali admin toko mengubah harga produk, **seluruh riwayat belanja masa lalu dan pembukuan keuangan (_accounting_) perusahaan akan berubah secara retroaktif**, merusak audit finansial.

---

## 3. Referential Actions: `Cascade` vs `Restrict`

### 1. `onDelete: Cascade` (Hapus Mengalir):

- **Kapan Digunakan:** Pada data turunan yang keberadaannya tidak bermakna tanpa entitas induknya (_strong ownership_).
- **Contoh:** `Order -> OrderItem` atau `Product -> Inventory`.
- **Perilaku:** Saat `Order` dihapus, seluruh baris `OrderItem` di dalamnya otomatis ikut terhapus untuk mencegah data sampah tak bertuan (_orphan records_).

### 2. `onDelete: Restrict` (Tolak Penghapusan):

- **Kapan Digunakan:** Pada data master yang menjadi referensi entitas operasional lain.
- **Contoh:** `Category -> Product` atau `Product -> OrderItem`.
- **Perilaku:** Database secara aktif **menolak dan melempar error** jika ada upaya menghapus Kategori yang masih digunakan oleh minimal satu Produk.

---

## 4. Repository Pattern & Dependency Injection (IoC)

Fungsi manipulasi data tidak mengimpor instance singleton database secara statis, melainkan menerimanya melalui parameter:

```typescript
export async function createProduct(prisma: PrismaClient, data: CreateProductInput) {
  logger.info({ categoryId: data.categoryId, name: data.name }, 'Creating product');
  return prisma.product.create({
    data: {
      name: data.name,
      price: data.price,
      description: data.description,
      categoryId: data.categoryId,
    },
    include: { category: true, inventory: true },
  });
}
```

### Keuntungan Arsitektural:

1. **Loose Coupling:** Logika query tidak terikat mati (_tightly coupled_) ke satu koneksi database tertentu.
2. **Lightning-Fast Integration Tests:** Di lingkungan pengujian (`vitest`), kita dapat menyuntikkan instance **PGlite** (`@electric-sql/pglite` + `@prisma/adapter-pglite`) yang berjalan murni di memori RAM WebAssembly:
   - Tes berjalan dalam hitungan milidetik.
   - Isolasi total per-test suite (tidak ada data bocor antar test).
   - Zero-dependency: CI/CD dan komputer developer tidak wajib menyalakan Docker daemon.

---

## 5. Key Takeaways & Checklist

- [x] Terapkan normalisasi 3NF untuk mencegah redundansi dan anomali update data.
- [x] Selalu gunakan _Price Snapshot Pattern_ untuk entitas pesanan dan transaksi finansial.
- [x] Tentukan aksi referensial foreign key (`Cascade` vs `Restrict`) secara sengaja berdasarkan logika bisnis.
- [x] Terapkan _Dependency Injection_ pada lapisan repository untuk memudahkan pengujian in-memory via PGlite.
