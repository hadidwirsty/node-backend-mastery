# ACID Transactions & Race-Condition Safe E-Commerce Checkout

**Kategori:** Database Concurrency & Reliability  
**Tanggal:** 2026-08-18  
**Referensi Resmi:**

- [Prisma Interactive Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions#interactive-transactions)
- [PostgreSQL Transaction Isolation & Concurrency Control](https://www.postgresql.org/docs/current/transaction-iso.html)
- [Martin Kleppmann: Designing Data-Intensive Applications (Transactions Chapter)](https://dataintensive.net/)

---

## 1. Ringkasan Konsep

Dalam perancangan sistem e-commerce berskala tinggi (_high-concurrency / flash-sale_), menjamin integritas transaksi checkout dan mencegah fenomena **overselling** (stok terjual melebihi stok fisik) adalah tanggung jawab paling kritis bagi seorang Backend Engineer.

### Alur Eksekusi Transaksi Atomik:

```
                  Client Request: POST /checkout
                                │
                                ▼
         [ prisma.$transaction(async (tx) => { ... }) ]
                                │
  ┌─────────────────────────────┼─────────────────────────────┐
  ▼                             ▼                             ▼
[ 1. Validate Products ]   [ 2. Atomic Stock Decrement ]  [ 3. Create Order & Items ]
(Fetch & Snapshot Price)   (WHERE stock >= qty)           (Status: PENDING)
  │                             │                             │
  └─────────────────────────────┼─────────────────────────────┘
                                │
             ┌──────────────────┴──────────────────┐
          [SUKSES]                              [GAGAL]
             │                                     │
             ▼                                     ▼
     COMMIT TRANSAKSI                      ROLLBACK TRANSAKSI
(Perubahan tersimpan permanen)         (Seluruh perubahan dibatalkan,
                                       stok & order kembali ke semula)
```

---

## 2. Prinsip ACID

| Sifat                            | Makna                                                                            | Penerapan Nyata di Checkout                                                                                                      |
| :------------------------------- | :------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **Atomicity** (_All or Nothing_) | Seluruh operasi dalam transaksi harus berhasil 100%, atau tidak ada sama sekali. | Jika pemotongan stok pada produk ke-3 gagal karena habis, pemotongan stok produk ke-1 dan ke-2 otomatis dibatalkan (_Rollback_). |
| **Consistency**                  | Database beralih dari satu status valid ke status valid lainnya.                 | Tidak akan pernah ada record `Order` yang terbuat tanpa pengurangan data pada `Inventory`.                                       |
| **Isolation**                    | Transaksi konkuren tidak saling melihat data setengah jadi.                      | Pembeli lain tidak bisa melihat perubahan stok sebelum checkout pembeli pertama berstatus _Commit_.                              |
| **Durability**                   | Data yang sudah di-commit dijamin tersimpan di disk.                             | Sekali order sukses, data tidak akan hilang meski server mati mendadak.                                                          |

---

## 3. Anatomi Bug _Race Condition_ vs _Atomic DB-Level Decrement_

### ❌ Anti-Pattern: Read-Then-Write (TOCTOU: Time-of-Check to Time-of-Use)

```typescript
// ❌ SANGAT BERBAHAYA: Rentan Overselling!
const inventory = await tx.inventory.findUnique({ where: { productId } });

if (inventory.stock >= quantity) {
  // Jika 2 user mengecek bersamaan saat stok = 1, keduanya lolos if!
  await tx.inventory.update({
    where: { productId },
    data: { stock: inventory.stock - quantity },
  });
}
```

---

### ✅ Best Practice: Atomic Conditional Update di Level Database

```typescript
export async function checkout(
  prisma: PrismaClient,
  input: CheckoutInput,
): Promise<OrderWithItems> {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch data & snapshot harga
    const products = await tx.product.findMany({
      where: { id: { in: input.items.map((i) => i.productId) } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Potong stok secara atomik langsung dengan klausul WHERE DB
    for (const item of input.items) {
      const updated = await tx.inventory.updateMany({
        where: {
          productId: item.productId,
          stock: { gte: item.quantity }, // 👈 Syarat langsung di level database!
        },
        data: {
          stock: { decrement: item.quantity }, // 👈 Operasi atomik SQL
        },
      });

      if (updated.count === 0) {
        throw new ConflictError(`Insufficient stock for product ${item.productId}`);
      }
    }

    // 3. Kalkulasi total menggunakan price snapshot
    const total = input.items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    // 4. Buat Order & OrderItem
    return tx.order.create({
      data: {
        userId: input.userId,
        total,
        orderItems: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: productMap.get(item.productId)!.price, // 👈 Price snapshot
          })),
        },
      },
      include: {
        orderItems: { include: { product: true } },
      },
    });
  });
}
```

---

## 4. Larangan Emas: Hindari External I/O di dalam Transaksi

```
❌ SALAH:
prisma.$transaction(async (tx) => {
  await tx.inventory.update(...);
  await sendEmailWithNodemailer(...); // 🚨 Menahan koneksi DB selama 2 detik!
  await stripe.charges.create(...);    // 🚨 Menahan row-lock jika gateway lambat!
  await tx.order.create(...);
});

✅ BENAR:
// 1. Jalankan transaksi DB secepat mungkin (<10ms)
const order = await checkout(prisma, input);

// 2. Jalankan I/O eksternal SETELAH transaksi sukses di-commit
await emailQueue.add('send-invoice', { orderId: order.id });
```

---

## 5. Key Takeaways & Checklist

- [x] Gunakan `prisma.$transaction(async (tx) => { ... })` untuk alur transaksi multi-tabel yang bergantung satu sama lain.
- [x] Terapkan _Conditional Update_ (`stock: { gte: qty }`) dan `decrement` di level database untuk mencegah _race condition_ dan _overselling_.
- [x] Pastikan seluruh error di dalam transaksi memicu pelemparan exception (`throw`) agar Prisma otomatis mengirim sinyal `ROLLBACK` ke PostgreSQL.
- [x] Jangan pernah memanggil API pihak ketiga (email, payment gateway) di dalam blok transaksi; alihkan ke antrean asinkron (_message queue_) setelah _commit_.
