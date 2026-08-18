# Advanced SQL Analytics: Aggregations, Multi-Level JOINs & SQL Injection Prevention

**Kategori:** Database & Query Performance  
**Tanggal:** 2026-08-18  
**Referensi Resmi:**

- [Prisma Raw Database Access: $queryRaw & Prisma.sql](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)
- [PostgreSQL Aggregate Functions & Grouping](https://www.postgresql.org/docs/current/functions-aggregate.html)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

## 1. Ringkasan Konsep

Meskipun ORM (seperti Prisma) ideal untuk operasi CRUD harian dan _business logic_ standar, fitur pelaporan data dan analitik (_business intelligence, analytics dashboards, revenue calculation_) memerlukan eksekusi **Raw SQL terparameterisasi** untuk mencapai efisiensi memori dan kecepatan pemrosesan maksimal.

```
                    ANALITIK DATA BESAR (100.000+ Baris)
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
❌ AMBIL SEMUA KE NODE.JS (Anti-Pattern)              ✅ AGREGASI DI DATABASE (Raw SQL)
 - Tarik 100.000 baris via jaringan (150MB)             - Eksekusi SUM & GROUP BY di disk PostgreSQL
 - Hitung di JS: Array.reduce()                         - Hanya kembalikan 1 baris hasil ringkasan (100B)
 - Dampak: RAM server jebol, latency > 2s               - Dampak: Latensi < 5ms, RAM server tetap 0%
```

---

## 2. Multi-Level `LEFT JOIN` & Fungsi `COALESCE`

### Pola Query Analitik Pendapatan per Kategori:

```sql
SELECT
  c.id AS "categoryId",
  c.name AS "categoryName",
  COALESCE(SUM(oi.price * oi.quantity), 0) AS "totalRevenue"
FROM categories c
LEFT JOIN products p ON p."categoryId" = c.id
LEFT JOIN order_items oi ON oi."productId" = p.id
GROUP BY c.id, c.name
ORDER BY "totalRevenue" DESC;
```

### Mengapa `LEFT JOIN` dan `COALESCE` Wajib Dipakai?

| Komponen SQL           | Peran & Perilaku Sistem                                                                                                                                                                                         |
| :--------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`LEFT JOIN`**        | Memastikan kategori yang **belum memiliki transaksi penjualan** tetap tercantum dalam laporan. (Jika memakai `INNER JOIN`, kategori dengan 0 transaksi akan hilang).                                            |
| **`COALESCE(val, 0)`** | Jika hasil `SUM()` menghasilkan nilai `NULL` (karena tidak ada baris yang cocok pada tabel kanan), `COALESCE` otomatis mengubahnya menjadi angka **`0`**, mencegah bug `NaN` atau tampilan rusak pada frontend. |

---

## 3. Keamanan Tingkat Tinggi: Parameterized Queries via `Prisma.sql`

```typescript
// ❌ SANGAT BERBAHAYA: Rentan Serangan SQL Injection!
const maliciousInput = "'; DROP TABLE users; --";
await prisma.$queryRawUnsafe(`SELECT * FROM orders WHERE "userId" = '${maliciousInput}'`);

// ✅ AMAN: Menggunakan Parameterized Template Tag Prisma.sql
await prisma.$queryRaw<UserOrderSummary[]>(
  Prisma.sql`
    SELECT
      ${userId}::uuid AS "userId",
      COUNT(o.id)::int AS "totalOrders",
      COALESCE(SUM(o.total), 0) AS "totalSpend"
    FROM orders o
    WHERE o."userId" = ${userId}::uuid
  `,
);
```

### Bagaimana Mekanisme Proteksinya?

1. **Pemisahan Logika & Data:** PostgreSQL memisahkan _Query Execution Plan_ (struktur perintah) dari _Nilai Parameter_ (`$1, $2`).
2. **Karakter Literal Murni:** Karakter khusus seperti tanda kutip (`'`) atau titik koma (`;`) diperlakukan sebagai string data teks biasa, bukan kode SQL yang dapat dieksekusi oleh parser database.

---

## 4. Key Takeaways & Checklist

- [x] Lakukan kalkulasi agregasi (`SUM`, `COUNT`, `AVG`) di level database engine, bukan menarik seluruh data mentah ke memori JavaScript.
- [x] Gunakan `LEFT JOIN` pada laporan komprehensif agar entitas dengan nilai 0 tetap muncul.
- [x] Selalu bungkus kalkulasi agregasi `SUM()` dengan `COALESCE(..., 0)` untuk menangani nilai `NULL`.
- [x] Wajib gunakan `Prisma.sql` template literal pada `$queryRaw` untuk mencegah celah keamanan SQL Injection (OWASP Top 10).
