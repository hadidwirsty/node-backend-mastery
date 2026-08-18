# High-Performance Cursor-Based Pagination & Indexing Strategy

**Kategori:** Database & Query Optimization  
**Tanggal:** 2026-08-18  
**Referensi Resmi:**

- [Prisma Pagination Guide: Cursor-based vs Offset-based](https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination)
- [Use The Index, Luke: Paging Through Results](https://use-the-index-luke.com/no-offset)
- [PostgreSQL B-Tree Index Performance](https://www.postgresql.org/docs/current/indexes-types.html)

---

## 1. Ringkasan Konsep

Dalam perancangan API backend modern, pengambilan data dalam jumlah besar (_large dataset collections_) harus dirancang agar efisien, tidak membebani memori database, dan kebal terhadap anomali data bergeser (_pagination drift_).

### Perbandingan Arsitektur Paginasi:

```
OFFSET PAGINATION:
[Record 1 .... Record 10,000] ──> [DB Scan & Discard 10,000 Rows] ──> [Return 10 Rows] (O(N) - Lambat)

CURSOR PAGINATION:
[B-Tree Index Pointer: 'ID_C'] ──> [Direct B-Tree Seek O(log N)] ──> [Return 10 Rows] (O(log N) - Kilat)
```

---

## 2. Tabel Komparasi Teknis

| Parameter            | Offset-Based Pagination                                                              | Cursor-Based Pagination                                                                  |
| :------------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **Bentuk Query**     | `SELECT ... LIMIT 10 OFFSET 10000;`                                                  | `SELECT ... WHERE (createdAt, id) < (val, val) LIMIT 10;`                                |
| **Kompleksitas**     | $O(N)$ — Waktu eksekusi memburuk seiring bertambahnya halaman.                       | $O(\log N)$ — Waktu eksekusi konstan terlepas dari kedalaman halaman.                    |
| **Skalabilitas**     | Buruk untuk data besar (>100.000 records).                                           | Sangat Baik (bisa menangani jutaan records tanpa degradasi).                             |
| **Pagination Drift** | ❌ **Rentan Duplikasi/Hilang Baris** jika ada insert/delete data baru saat navigasi. | ✅ **Kebal Duplikasi** karena pembacaan terikat pada penanda pointer unik data terakhir. |
| **Navigasi Halaman** | Mendukung lompat ke sembarang halaman (misal: Halaman 50).                           | Hanya mendukung maju/mundur berurutan (_Infinite Scroll_ / _Next-Prev_).                 |

---

## 3. Trik Implementasi: Fetch-One-Extra (`take: take + 1`)

Alih-alih menjalankan query `COUNT(*)` terpisah yang memicu _full table scan_, backend meminta $N + 1$ data dalam satu query:

```typescript
export async function listProducts(
  prisma: PrismaClient,
  options: ListProductsOptions = {},
): Promise<PaginatedProducts> {
  const { limit = 10, cursor, categoryId, minPrice, maxPrice } = options;
  const take = Math.min(limit, 100);

  const items = await prisma.product.findMany({
    take: take + 1, // 👈 Ambil 1 data ekstra untuk deteksi halaman berikutnya
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), // 👈 Lewati kursor itu sendiri
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], // 👈 Deterministic Tie-Breaker
    include: { category: true, inventory: true },
  });

  const hasNextPage = items.length > take;
  const data = hasNextPage ? items.slice(0, take) : items;
  const nextCursor = hasNextPage ? data[data.length - 1].id : null;

  return { data, nextCursor };
}
```

---

## 4. Mengapa Butuh `skip: 1` dan _Tie-Breaker_?

### 1. Peran Kritis `skip: 1`:

Secara default, saat Prisma mengeksekusi `cursor: { id: 'ID_X' }`, Prisma menyertakan baris dengan `'ID_X'` tersebut ke dalam hasil query (`WHERE id >= cursor`).

- **Jika tanpa `skip: 1`:** Data `'ID_X'` (yang merupakan item terakhir di Halaman 1) akan muncul kembali sebagai item pertama di Halaman 2 (terjadi data duplikat di perbatasan halaman).
- **Dengan `skip: 1`:** Prisma melompati 1 baris kursor tersebut dan langsung mengambil data baru setelahnya.

### 2. Peran _Deterministic Tie-Breaker_ (`id: 'asc'`):

Jika dua baris data memiliki nilai timestamp `createdAt` yang persis sama, urutan hasil query database bisa berubah-ubah (_non-deterministic_).
Menambahkan kolom unik `id: 'asc'` memastikan urutan selalu stabil dan konsisten.

---

## 5. Key Takeaways & Checklist

- [x] Gunakan Cursor-Based Pagination untuk endpoint daftar data publik berskala besar atau infinite scroll.
- [x] Terapkan teknik `take: limit + 1` untuk menghindari query `SELECT COUNT(*)` yang lambat.
- [x] Selalu sertakan `skip: 1` saat kursor aktif agar item kursor tidak muncul ganda di halaman berikutnya.
- [x] Sertakan kolom unik (seperti `id`) sebagai _tie-breaker_ pada `orderBy` untuk menjamin kestabilan urutan data.
- [x] Pastikan kolom yang digunakan pada `orderBy` dan `where` memiliki indeks database B-Tree yang sesuai.
