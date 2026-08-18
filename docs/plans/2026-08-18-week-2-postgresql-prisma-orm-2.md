# Week 2 Implementation Plan: Relational Databases (PostgreSQL), Advanced SQL & Prisma ORM

**Tanggal:** 2026-08-18
**Urutan Plan:** 2
**Target Milestone:** _E-Commerce Engine Data Layer_
**Status:** READY FOR EXECUTION
**Referensi Spec:** `docs/specs/2026-08-14-backend-engineer-roadmap-design.md` §4.2

---

## Gambaran Umum

Minggu ini membangun **data layer** untuk skenario e-commerce menggunakan PostgreSQL dan Prisma ORM. Fondasi dari Week 1 (Express app factory, middleware pipeline, error hierarchy) tetap digunakan dan tidak dimodifikasi.

**Deliverable Akhir:** Skema database PostgreSQL 3NF lengkap (6 entitas: User, Category, Product, Order, OrderItem, Inventory) dengan migration Prisma, CRUD & query lanjutan, cursor-based pagination, atomic checkout transaction, dan database seed script deterministik.

**Stack Baru yang Ditambahkan:**

- `prisma` + `@prisma/client` — Schema, migrations, dan typed client
- `@electric-sql/pglite` + `@prisma/adapter-pglite` — In-memory PostgreSQL untuk testing (tanpa Docker)
- `dotenv` — Environment variable loading untuk Prisma CLI

---

## Task List

| #      | Task                                               | Status |
| ------ | -------------------------------------------------- | ------ |
| Task 1 | Prisma Installation, Setup & Environment Config    | [x]    |
| Task 2 | Schema Design 3NF + Prisma Migrate                 | [x]    |
| Task 3 | Prisma Client Setup & Basic CRUD Operations        | [x]    |
| Task 4 | Cursor-Based Pagination & Multi-criteria Filtering | [x]    |
| Task 5 | Atomic Checkout Transaction (Race-Condition Safe)  | [x]    |
| Task 6 | Advanced SQL: JOINs, Aggregation & Raw Queries     | [x]    |
| Task 7 | Database Seed Script (Deterministic Upsert)        | [x]    |
| Task 8 | Repository Abstraction Layer                       | [x]    |

---

## Task 1: Prisma Installation, Setup & Environment Config

**Files:**

- Create: `prisma/schema.prisma` (stub awal)
- Create: `.env.example`
- Create: `src/lib/prisma.ts`
- Modify: `package.json` — tambah scripts `db:migrate`, `db:seed`, `db:studio`
- Test: `tests/unit/prisma-setup.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `npx prisma generate` berhasil tanpa error setelah schema stub dibuat.
  2. `src/lib/prisma.ts` mengekspor singleton `PrismaClient` yang reusable di seluruh aplikasi.
  3. File `.env.example` tersedia dengan semua key database yang diperlukan.
  4. Test dapat menginstantiasi `PrismaClient` tanpa error compile.

- **Functional Requirements**
  1. Install Prisma CLI dan `@prisma/client` sebagai dependencies.
  2. Install `@electric-sql/pglite` dan `@prisma/adapter-pglite` sebagai devDependencies untuk testing.
  3. Inisialisasi Prisma dengan `provider = "postgresql"`.
  4. Singleton `PrismaClient` dibuat sekali dan di-reuse (hindari connection pool exhaustion).
  5. Env var `DATABASE_URL` wajib tersedia — aplikasi fail-fast jika tidak ada.

- **Non-Functional Requirements**
  - Singleton pattern wajib agar tidak terjadi multiple connection pool di development hot-reload.
  - File `.env` tidak boleh di-commit — sudah ada di `.gitignore`.

- **Test Coverage**
  - [Unit] `PrismaClient` dapat diinstansiasi tanpa exception
  - [Unit] Singleton `prisma` dari `src/lib/prisma.ts` adalah instance yang sama jika dipanggil dua kali

**Step 1: Write failing test**

```typescript
// tests/unit/prisma-setup.test.ts
import { describe, expect, it } from 'vitest';

describe('Prisma Client Setup', () => {
  it('should export a PrismaClient singleton', async () => {
    const { prisma } = await import('@/lib/prisma');
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.$disconnect).toBe('function');
  });

  it('should return the same singleton instance on multiple imports', async () => {
    const { prisma: instance1 } = await import('@/lib/prisma');
    const { prisma: instance2 } = await import('@/lib/prisma');
    expect(instance1).toBe(instance2);
  });
});
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/unit/prisma-setup.test.ts`
Expected: FAIL — `Cannot find module '@/lib/prisma'`

**Step 3: Write minimal implementation**

Install dependencies:

```bash
npm install prisma @prisma/client
npm install --save-dev @electric-sql/pglite @prisma/adapter-pglite
npx prisma init --datasource-provider postgresql
```

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

Create `.env.example`:

```bash
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/node_backend_mastery_dev"
TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/node_backend_mastery_test"
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/unit/prisma-setup.test.ts`
Expected: PASS — 2 tests passed

---

## Task 2: Schema Design 3NF + Prisma Migrate

**Files:**

- Modify: `prisma/schema.prisma` — definisi 6 model lengkap
- Create: `prisma/migrations/` — generated oleh `prisma migrate dev`
- Test: `tests/unit/prisma-schema.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `npx prisma validate` lulus tanpa error untuk schema yang ditulis.
  2. `npx prisma migrate dev --name init` berhasil menghasilkan file migrasi SQL.
  3. SQL migration yang dihasilkan mengandung definisi 6 tabel: `users`, `categories`, `products`, `orders`, `order_items`, `inventories`.
  4. Semua foreign key memiliki `ON DELETE` behavior yang eksplisit.
  5. Kolom `price` pada `OrderItem` menggunakan tipe `Decimal` untuk snapshot harga saat pembelian.

- **Functional Requirements**
  1. Semua model menggunakan `String @id @default(uuid()) @db.Uuid` sebagai primary key (UUID untuk mencegah ID enumeration).
  2. Semua model memiliki `createdAt DateTime @default(now())` dan `updatedAt DateTime @updatedAt`.
  3. `OrderItem.price` menyimpan harga pada saat transaksi (price snapshot) — bukan relasi ke `Product.price`.
  4. `Inventory.stock` adalah `Int` dengan constraint `@default(0)`.
  5. `Order.status` menggunakan Prisma Enum: `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
  6. Semua foreign key column di-index (`@@index([foreignKeyCol])`).

- **Non-Functional Requirements**
  - Schema harus dalam 3NF — tidak ada ketergantungan transitif.
  - Setiap index harus memiliki alasan eksplisit (via komentar Prisma `///`).

- **Test Coverage**
  - [Unit] Field `OrderItem.price` adalah tipe `Decimal`, bukan `Float`
  - [Unit] Enum `OrderStatus` mengandung semua nilai yang diharapkan

**Step 1: Write failing test**

```typescript
// tests/unit/prisma-schema.test.ts
import { OrderStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';

describe('Prisma Schema Design', () => {
  it('should have all required OrderStatus enum values', () => {
    const expectedStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    expectedStatuses.forEach((status) => {
      expect(OrderStatus[status as keyof typeof OrderStatus]).toBeDefined();
    });
  });

  it('should export all Prisma model types without error', async () => {
    const { Prisma } = await import('@prisma/client');
    expect(Prisma.ModelName.User).toBe('User');
    expect(Prisma.ModelName.Product).toBe('Product');
    expect(Prisma.ModelName.Category).toBe('Category');
    expect(Prisma.ModelName.Order).toBe('Order');
    expect(Prisma.ModelName.OrderItem).toBe('OrderItem');
    expect(Prisma.ModelName.Inventory).toBe('Inventory');
  });
});
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/unit/prisma-schema.test.ts`
Expected: FAIL — `Module '@prisma/client' has no exported member 'OrderStatus'`

**Step 3: Write minimal implementation**

Update `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

/// Registered user accounts
model User {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orders Order[]

  @@map("users")
}

/// Product classification — normalized (3NF)
model Category {
  id        String   @id @default(uuid()) @db.Uuid
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  products Product[]

  @@map("categories")
}

/// Sellable products (price is the current listing price)
model Product {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  description String?
  price       Decimal  @db.Decimal(12, 2)
  categoryId  String   @db.Uuid
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category   Category    @relation(fields: [categoryId], references: [id], onDelete: RESTRICT)
  orderItems OrderItem[]
  inventory  Inventory?

  /// Index on categoryId for fast JOIN/filter on category
  @@index([categoryId])
  @@map("products")
}

/// Stock level tracker — 1:1 with Product
model Inventory {
  id        String   @id @default(uuid()) @db.Uuid
  productId String   @unique @db.Uuid
  stock     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  product Product @relation(fields: [productId], references: [id], onDelete: CASCADE)

  @@map("inventories")
}

/// Customer order header — status tracks fulfillment lifecycle
model Order {
  id        String      @id @default(uuid()) @db.Uuid
  userId    String      @db.Uuid
  status    OrderStatus @default(PENDING)
  total     Decimal     @db.Decimal(12, 2)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  user       User        @relation(fields: [userId], references: [id], onDelete: RESTRICT)
  orderItems OrderItem[]

  /// Index on userId for fast order history lookup per user
  @@index([userId])
  /// Index on createdAt for cursor-based pagination ordered by time
  @@index([createdAt])
  @@map("orders")
}

/// Line items — price is snapshotted at purchase time (immutable)
model OrderItem {
  id        String  @id @default(uuid()) @db.Uuid
  orderId   String  @db.Uuid
  productId String  @db.Uuid
  quantity  Int
  price     Decimal @db.Decimal(12, 2)

  order   Order   @relation(fields: [orderId], references: [id], onDelete: CASCADE)
  product Product @relation(fields: [productId], references: [id], onDelete: RESTRICT)

  /// Index on orderId for fast line item lookup per order
  @@index([orderId])
  /// Index on productId for product sales analytics
  @@index([productId])
  @@map("order_items")
}
```

Jalankan:

```bash
npx prisma generate
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/unit/prisma-schema.test.ts`
Expected: PASS — 2 tests passed

---

## Task 3: Prisma Client Setup & Basic CRUD Operations

**Files:**

- Create: `src/features/product/product.repository.ts`
- Create: `src/features/product/product.types.ts`
- Create: `tests/helpers/test-db.ts` — PGLite in-memory database helper
- Create: `tests/integration/product-crud.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `createProduct()` berhasil membuat produk baru dan mengembalikan entitas dengan `id` (UUID).
  2. `findProductById()` mengembalikan `null` jika produk tidak ditemukan.
  3. `updateProduct()` mengupdate hanya field yang diberikan dan `updatedAt` berubah.
  4. `deleteProduct()` menghapus produk dan mengembalikan entitas yang dihapus.
  5. Operasi integration test berjalan pada test database terisolasi via PGLite in-memory.

- **Functional Requirements**
  1. Repository menerima instance `PrismaClient` sebagai parameter (inversion of control / DI).
  2. Return type semua fungsi terdefinisi kuat (`Prisma.ProductGetPayload`).
  3. Error jika record tidak ditemukan melempar `NotFoundError` (dari `@/core/errors/app-error`).

- **Non-Functional Requirements**
  - Integration test menggunakan `@electric-sql/pglite` — test dapat dijalankan instan tanpa dependensi docker runtime.

- **Test Coverage**
  - [Integration] `createProduct` — create & verify persisted data
  - [Integration] `findProductById` — existing dan non-existing id
  - [Integration] `updateProduct` — partial update
  - [Integration] `deleteProduct` — record deleted and lookup returns null

**Step 1: Write failing test**

```typescript
// tests/helpers/test-db.ts
import { PGlite } from '@electric-sql/pglite';
import { PrismaPGlite } from '@prisma/adapter-pglite';
import { PrismaClient } from '@prisma/client';

export async function createTestDatabase(): Promise<PrismaClient> {
  const client = new PGlite();
  const adapter = new PrismaPGlite(client);
  const prisma = new PrismaClient({ adapter } as any);

  // Inisialisasi DDL schema di in-memory PGlite
  await prisma.$executeRawUnsafe(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

    CREATE TABLE "users" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "email" TEXT UNIQUE NOT NULL,
      "name" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE "categories" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" TEXT UNIQUE NOT NULL,
      "slug" TEXT UNIQUE NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE "products" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" TEXT NOT NULL,
      "description" TEXT,
      "price" DECIMAL(12,2) NOT NULL,
      "categoryId" UUID NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE "inventories" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "productId" UUID UNIQUE NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
      "stock" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE "orders" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
      "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
      "total" DECIMAL(12,2) NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE "order_items" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "orderId" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
      "productId" UUID NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
      "quantity" INTEGER NOT NULL,
      "price" DECIMAL(12,2) NOT NULL
    );
  `);

  return prisma;
}
```

```typescript
// tests/integration/product-crud.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createProduct,
  deleteProduct,
  findProductById,
  updateProduct,
} from '@/features/product/product.repository';

import { createTestDatabase } from '../helpers/test-db';

describe('Product Repository CRUD', () => {
  let prisma: Awaited<ReturnType<typeof createTestDatabase>>;
  let categoryId: string;

  beforeEach(async () => {
    prisma = await createTestDatabase();
    const category = await prisma.category.create({
      data: { name: 'Electronics', slug: 'electronics' },
    });
    categoryId = category.id;
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should create a product and return it with a UUID id', async () => {
    const product = await createProduct(prisma, {
      name: 'Laptop Pro',
      price: 1500.0,
      categoryId,
    });

    expect(product.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(product.name).toBe('Laptop Pro');
    expect(Number(product.price)).toBe(1500);
  });

  it('should return null when product not found', async () => {
    const result = await findProductById(prisma, '00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });

  it('should update only the provided fields', async () => {
    const product = await createProduct(prisma, {
      name: 'Old Name',
      price: 100.0,
      categoryId,
    });
    const updated = await updateProduct(prisma, product.id, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
    expect(Number(updated.price)).toBe(100);
  });

  it('should delete a product and return the deleted entity', async () => {
    const product = await createProduct(prisma, {
      name: 'To Delete',
      price: 50.0,
      categoryId,
    });
    const deleted = await deleteProduct(prisma, product.id);
    expect(deleted.id).toBe(product.id);

    const notFound = await findProductById(prisma, product.id);
    expect(notFound).toBeNull();
  });
});
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/integration/product-crud.test.ts`
Expected: FAIL — `Cannot find module '@/features/product/product.repository'`

**Step 3: Write minimal implementation**

Buat `src/features/product/product.types.ts`:

```typescript
import type { Prisma } from '@prisma/client';

export type CreateProductInput = {
  name: string;
  price: number;
  categoryId: string;
  description?: string;
};

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'categoryId'>>;

export type ProductEntity = Prisma.ProductGetPayload<{
  include: { category: true; inventory: true };
}>;
```

Buat `src/features/product/product.repository.ts`:

```typescript
import type { PrismaClient } from '@prisma/client';

import { NotFoundError } from '@/core/errors/app-error';
import { logger } from '@/core/logging/logger';

import type { CreateProductInput, UpdateProductInput } from './product.types';

export async function createProduct(prisma: PrismaClient, data: CreateProductInput) {
  logger.info({ categoryId: data.categoryId }, 'Creating product');
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

export async function findProductById(prisma: PrismaClient, id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true, inventory: true },
  });
}

export async function updateProduct(prisma: PrismaClient, id: string, data: UpdateProductInput) {
  const existing = await findProductById(prisma, id);
  if (!existing) throw new NotFoundError(`Product ${id} not found`);

  logger.info({ productId: id }, 'Updating product');
  return prisma.product.update({
    where: { id },
    data,
    include: { category: true, inventory: true },
  });
}

export async function deleteProduct(prisma: PrismaClient, id: string) {
  const existing = await findProductById(prisma, id);
  if (!existing) throw new NotFoundError(`Product ${id} not found`);

  logger.info({ productId: id }, 'Deleting product');
  return prisma.product.delete({
    where: { id },
    include: { category: true, inventory: true },
  });
}
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/integration/product-crud.test.ts`
Expected: PASS — 4 tests passed

---

## Task 4: Cursor-Based Pagination & Multi-criteria Filtering

**Files:**

- Create: `src/features/product/product.query.ts`
- Create: `tests/integration/product-pagination.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `listProducts()` mengembalikan hasil dengan struktur `{ data: Product[], nextCursor: string | null }`.
  2. Memanggil `listProducts()` dengan `cursor` dari response sebelumnya mengembalikan page berikutnya tanpa duplikasi.
  3. `nextCursor` bernilai `null` ketika tidak ada lagi data berikutnya.
  4. Filter `categoryId` mengembalikan hanya produk dari kategori yang ditentukan.
  5. Filter `minPrice` dan `maxPrice` bekerja secara kombinasi.

- **Functional Requirements**
  1. Cursor menggunakan `id` (UUID) sebagai field pembatas — stabil bahkan jika record dihapus.
  2. Default `limit` adalah 10, maksimum 100.
  3. `orderBy` default adalah `createdAt DESC` dengan `id ASC` sebagai tie-breaker deterministik.
  4. Filter diterapkan sebelum cursor untuk mencegah cross-page pollution.

- **Non-Functional Requirements**
  - Menggunakan index pada `createdAt` dan `id` untuk mencegah full-table scan pada skala besar.

- **Test Coverage**
  - [Integration] Paginasi 3 halaman dari 7 total produk dengan limit 3
  - [Integration] Filter `categoryId` hanya mengembalikan produk kategori tersebut
  - [Integration] `nextCursor` null pada halaman terakhir

**Step 1: Write failing test**

```typescript
// tests/integration/product-pagination.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { listProducts } from '@/features/product/product.query';
import { createProduct } from '@/features/product/product.repository';

import { createTestDatabase } from '../helpers/test-db';

describe('Product Cursor Pagination', () => {
  let prisma: Awaited<ReturnType<typeof createTestDatabase>>;
  let categoryId: string;

  beforeEach(async () => {
    prisma = await createTestDatabase();
    const cat = await prisma.category.create({ data: { name: 'Tech', slug: 'tech' } });
    categoryId = cat.id;
    // Seed 7 products
    for (let i = 1; i <= 7; i++) {
      await createProduct(prisma, { name: `Product ${i}`, price: i * 10, categoryId });
    }
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should paginate through all products using cursor', async () => {
    const page1 = await listProducts(prisma, { limit: 3 });
    expect(page1.data).toHaveLength(3);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await listProducts(prisma, { limit: 3, cursor: page1.nextCursor! });
    expect(page2.data).toHaveLength(3);
    expect(page2.nextCursor).not.toBeNull();

    const page3 = await listProducts(prisma, { limit: 3, cursor: page2.nextCursor! });
    expect(page3.data).toHaveLength(1);
    expect(page3.nextCursor).toBeNull();

    // No duplicates across pages
    const allIds = [...page1.data, ...page2.data, ...page3.data].map((p) => p.id);
    expect(new Set(allIds).size).toBe(7);
  });

  it('should filter by categoryId', async () => {
    const otherCat = await prisma.category.create({ data: { name: 'Fashion', slug: 'fashion' } });
    await createProduct(prisma, { name: 'Shirt', price: 20, categoryId: otherCat.id });

    const result = await listProducts(prisma, { limit: 10, categoryId });
    expect(result.data.every((p) => p.categoryId === categoryId)).toBe(true);
    expect(result.data).toHaveLength(7);
  });
});
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/integration/product-pagination.test.ts`
Expected: FAIL — `Cannot find module '@/features/product/product.query'`

**Step 3: Write minimal implementation**

Buat `src/features/product/product.query.ts`:

```typescript
import type { PrismaClient } from '@prisma/client';

export type ListProductsOptions = {
  limit?: number;
  cursor?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type PaginatedProducts = {
  data: Awaited<ReturnType<PrismaClient['product']['findMany']>>;
  nextCursor: string | null;
};

export async function listProducts(
  prisma: PrismaClient,
  options: ListProductsOptions = {},
): Promise<PaginatedProducts> {
  const { limit = 10, cursor, categoryId, minPrice, maxPrice } = options;
  const take = Math.min(limit, 100);

  const where = {
    ...(categoryId ? { categoryId } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const items = await prisma.product.findMany({
    take: take + 1, // ambil 1 ekstra untuk mengecek ketersediaan halaman berikutnya
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    include: { category: true, inventory: true },
  });

  const hasNextPage = items.length > take;
  const data = hasNextPage ? items.slice(0, take) : items;
  const nextCursor = hasNextPage ? data[data.length - 1].id : null;

  return { data, nextCursor };
}
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/integration/product-pagination.test.ts`
Expected: PASS — 2 tests passed

---

## Task 5: Atomic Checkout Transaction (Race-Condition Safe)

**Files:**

- Create: `src/features/order/order.service.ts`
- Create: `src/features/order/order.types.ts`
- Create: `tests/integration/checkout.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. Checkout berhasil membuat `Order` dan `OrderItem` dalam satu transaksi atomik.
  2. `Inventory.stock` berkurang secara atomik sesuai `quantity` yang dipesan.
  3. Jika stok tidak mencukupi untuk salah satu item, seluruh transaksi di-rollback dan tidak ada perubahan yang tersimpan.
  4. `OrderItem.price` menyimpan harga saat checkout (immutable snapshot).
  5. `Order.total` adalah kalkulasi dari `sum(price * quantity)` seluruh items.

- **Functional Requirements**
  1. Menggunakan `prisma.$transaction(async (tx) => { ... })` untuk ACID guarantee.
  2. Pengurangan stok dilakukan pada level DB menggunakan `WHERE stock >= quantity`.
  3. Jika pengurangan stok mengembalikan `count === 0`, lemparkan `ConflictError` ("Insufficient stock").
  4. Snapshot harga diambil dari `Product.price` saat transaksi berlangsung.
  5. Transaksi harus singkat tanpa ada external I/O (network/email) di dalam blok transaksi.

- **Non-Functional Requirements**
  - Race-condition safe: mencegah _overselling_ saat beberapa order terjadi bersamaan.

- **Test Coverage**
  - [Integration] Checkout berhasil — stok berkurang, order dibuat
  - [Integration] Checkout gagal karena stok tidak cukup — rollback penuh (stok tidak berubah, order tidak ada)

**Step 1: Write failing test**

```typescript
// tests/integration/checkout.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { checkout } from '@/features/order/order.service';

import { createTestDatabase } from '../helpers/test-db';

describe('Checkout Atomic Transaction', () => {
  let prisma: Awaited<ReturnType<typeof createTestDatabase>>;
  let userId: string;
  let productId: string;

  beforeEach(async () => {
    prisma = await createTestDatabase();

    const user = await prisma.user.create({
      data: { email: 'buyer@test.com', name: 'Test Buyer' },
    });
    userId = user.id;

    const category = await prisma.category.create({
      data: { name: 'Gadgets', slug: 'gadgets' },
    });

    const product = await prisma.product.create({
      data: { name: 'Widget', price: 99.99, categoryId: category.id },
    });
    productId = product.id;

    await prisma.inventory.create({ data: { productId, stock: 5 } });
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should create order, decrement stock, and snapshot price atomically', async () => {
    const order = await checkout(prisma, {
      userId,
      items: [{ productId, quantity: 2 }],
    });

    expect(order.status).toBe('PENDING');
    expect(order.orderItems).toHaveLength(1);
    expect(Number(order.orderItems[0].price)).toBe(99.99); // price snapshot
    expect(Number(order.total)).toBe(199.98); // 99.99 * 2

    const inventory = await prisma.inventory.findUnique({ where: { productId } });
    expect(inventory?.stock).toBe(3); // 5 - 2
  });

  it('should rollback the entire transaction when stock is insufficient', async () => {
    await expect(
      checkout(prisma, { userId, items: [{ productId, quantity: 10 }] }),
    ).rejects.toThrow('Insufficient stock');

    // Verify rollback
    const inventory = await prisma.inventory.findUnique({ where: { productId } });
    expect(inventory?.stock).toBe(5); // unchanged

    const orders = await prisma.order.findMany({ where: { userId } });
    expect(orders).toHaveLength(0); // no order created
  });
});
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/integration/checkout.test.ts`
Expected: FAIL — `Cannot find module '@/features/order/order.service'`

**Step 3: Write minimal implementation**

Buat `src/features/order/order.types.ts`:

```typescript
import type { Prisma } from '@prisma/client';

export type CheckoutItem = {
  productId: string;
  quantity: number;
};

export type CheckoutInput = {
  userId: string;
  items: CheckoutItem[];
};

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { orderItems: { include: { product: true } } };
}>;
```

Buat `src/features/order/order.service.ts`:

```typescript
import type { PrismaClient } from '@prisma/client';

import { ConflictError } from '@/core/errors/app-error';
import { logger } from '@/core/logging/logger';

import type { CheckoutInput, OrderWithItems } from './order.types';

export async function checkout(
  prisma: PrismaClient,
  input: CheckoutInput,
): Promise<OrderWithItems> {
  logger.info({ userId: input.userId, itemCount: input.items.length }, 'Starting checkout');

  return prisma.$transaction(async (tx) => {
    // 1. Fetch current product prices and validate existence
    const productIds = input.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new ConflictError('One or more products not found');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Atomically decrement stock for each item (race-condition safe)
    for (const item of input.items) {
      const updated = await tx.inventory.updateMany({
        where: {
          productId: item.productId,
          stock: { gte: item.quantity }, // DB-level stock check
        },
        data: {
          stock: { decrement: item.quantity },
        },
      });

      if (updated.count === 0) {
        throw new ConflictError(`Insufficient stock for product ${item.productId}`);
      }
    }

    // 3. Calculate total using price snapshot
    const total = input.items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    // 4. Create order and order items
    const order = await tx.order.create({
      data: {
        userId: input.userId,
        total,
        orderItems: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: productMap.get(item.productId)!.price, // price snapshot
          })),
        },
      },
      include: {
        orderItems: { include: { product: true } },
      },
    });

    logger.info({ orderId: order.id, total }, 'Checkout completed successfully');
    return order;
  });
}
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/integration/checkout.test.ts`
Expected: PASS — 2 tests passed

---

## Task 6: Advanced SQL: JOINs, Aggregation & Raw Queries

**Files:**

- Create: `src/features/analytics/analytics.query.ts`
- Create: `tests/integration/analytics.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `getTopSellingProducts()` mengembalikan produk diurutkan berdasarkan total `quantity` terjual (descending).
  2. `getOrderSummaryByUser()` mengembalikan jumlah total order dan total spend per user.
  3. `getCategoryRevenue()` mengembalikan revenue total per kategori menggunakan JOIN multi-level.
  4. Query menggunakan `prisma.$queryRaw` dengan `Prisma.sql` template literal untuk mencegah SQL injection.

- **Functional Requirements**
  1. Semua raw query menggunakan `Prisma.sql` parameterized template tag.
  2. Return type didefinisikan secara eksplisit menggunakan TypeScript types.
  3. Menggunakan fungsi SQL aggregasi `SUM`, `COUNT`, `GROUP BY`, `COALESCE`.

- **Non-Functional Requirements**
  - Mencegah N+1 query: seluruh kalkulasi agregasi diselesaikan dalam satu eksekusi SQL di database engine.

- **Test Coverage**
  - [Integration] `getTopSellingProducts` mengembalikan urutan yang tepat berdasarkan qty
  - [Integration] `getOrderSummaryByUser` menghitung total order dan spend secara akurat
  - [Integration] `getCategoryRevenue` menghitung revenue dari relasi JOIN 3 level

**Step 1: Write failing test**

```typescript
// tests/integration/analytics.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  getCategoryRevenue,
  getOrderSummaryByUser,
  getTopSellingProducts,
} from '@/features/analytics/analytics.query';
import { checkout } from '@/features/order/order.service';

import { createTestDatabase } from '../helpers/test-db';

describe('Analytics Queries (Advanced SQL)', () => {
  let prisma: Awaited<ReturnType<typeof createTestDatabase>>;
  let userId: string;
  let product1Id: string;
  let product2Id: string;
  let categoryId: string;

  beforeEach(async () => {
    prisma = await createTestDatabase();

    const user = await prisma.user.create({
      data: { email: 'analyst@test.com', name: 'Test Analyst' },
    });
    userId = user.id;

    const category = await prisma.category.create({
      data: { name: 'Electronics', slug: 'electronics' },
    });
    categoryId = category.id;

    const p1 = await prisma.product.create({
      data: { name: 'Headphones', price: 150.0, categoryId },
    });
    product1Id = p1.id;
    await prisma.inventory.create({ data: { productId: product1Id, stock: 50 } });

    const p2 = await prisma.product.create({
      data: { name: 'Keyboard', price: 80.0, categoryId },
    });
    product2Id = p2.id;
    await prisma.inventory.create({ data: { productId: product2Id, stock: 50 } });

    // Create 2 orders: p1 qty=3, p2 qty=5 → p2 sells more
    await checkout(prisma, { userId, items: [{ productId: product1Id, quantity: 3 }] });
    await checkout(prisma, { userId, items: [{ productId: product2Id, quantity: 5 }] });
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should return top selling products ordered by quantity sold', async () => {
    const result = await getTopSellingProducts(prisma, { limit: 5 });
    expect(result[0].productId).toBe(product2Id); // Keyboard sold 5
    expect(Number(result[0].totalQuantity)).toBe(5);
    expect(result[1].productId).toBe(product1Id); // Headphones sold 3
  });

  it('should return correct order summary per user', async () => {
    const result = await getOrderSummaryByUser(prisma, userId);
    expect(result.totalOrders).toBe(2);
    expect(Number(result.totalSpend)).toBeCloseTo(150 * 3 + 80 * 5, 2);
  });

  it('should return revenue per category', async () => {
    const result = await getCategoryRevenue(prisma);
    const electronics = result.find((r) => r.categoryId === categoryId);
    expect(electronics).toBeDefined();
    expect(Number(electronics!.totalRevenue)).toBeCloseTo(150 * 3 + 80 * 5, 2);
  });
});
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/integration/analytics.test.ts`
Expected: FAIL — `Cannot find module '@/features/analytics/analytics.query'`

**Step 3: Write minimal implementation**

Buat `src/features/analytics/analytics.query.ts`:

```typescript
import { Prisma, type PrismaClient } from '@prisma/client';

export type TopSellingProduct = {
  productId: string;
  productName: string;
  totalQuantity: bigint | number;
};

export type UserOrderSummary = {
  userId: string;
  totalOrders: number;
  totalSpend: Prisma.Decimal | number;
};

export type CategoryRevenue = {
  categoryId: string;
  categoryName: string;
  totalRevenue: Prisma.Decimal | number;
};

export async function getTopSellingProducts(
  prisma: PrismaClient,
  options: { limit?: number } = {},
): Promise<TopSellingProduct[]> {
  const limit = options.limit ?? 10;
  return prisma.$queryRaw<TopSellingProduct[]>(
    Prisma.sql`
      SELECT
        p.id AS "productId",
        p.name AS "productName",
        COALESCE(SUM(oi.quantity), 0) AS "totalQuantity"
      FROM products p
      LEFT JOIN order_items oi ON oi."productId" = p.id
      GROUP BY p.id, p.name
      ORDER BY "totalQuantity" DESC
      LIMIT ${limit}
    `,
  );
}

export async function getOrderSummaryByUser(
  prisma: PrismaClient,
  userId: string,
): Promise<UserOrderSummary> {
  const [result] = await prisma.$queryRaw<UserOrderSummary[]>(
    Prisma.sql`
      SELECT
        ${userId}::uuid AS "userId",
        COUNT(o.id)::int AS "totalOrders",
        COALESCE(SUM(o.total), 0) AS "totalSpend"
      FROM orders o
      WHERE o."userId" = ${userId}::uuid
    `,
  );
  return result;
}

export async function getCategoryRevenue(prisma: PrismaClient): Promise<CategoryRevenue[]> {
  return prisma.$queryRaw<CategoryRevenue[]>(
    Prisma.sql`
      SELECT
        c.id AS "categoryId",
        c.name AS "categoryName",
        COALESCE(SUM(oi.price * oi.quantity), 0) AS "totalRevenue"
      FROM categories c
      LEFT JOIN products p ON p."categoryId" = c.id
      LEFT JOIN order_items oi ON oi."productId" = p.id
      GROUP BY c.id, c.name
      ORDER BY "totalRevenue" DESC
    `,
  );
}
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/integration/analytics.test.ts`
Expected: PASS — 3 tests passed

---

## Task 7: Database Seed Script (Deterministic Upsert)

**Files:**

- Create: `prisma/seed.ts`
- Create: `prisma/seed-data/categories.ts`
- Create: `prisma/seed-data/products.ts`
- Create: `prisma/seed-data/users.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `npx prisma db seed` berhasil dijalankan tanpa error.
  2. Menjalankan seed kedua kali tidak menghasilkan data duplikat (idempotent dengan `upsert`).
  3. Seed memuat minimal: 3 categories, 9 products (3 per category), 2 users, dan inventory untuk setiap product.

- **Functional Requirements**
  1. Script seed memblokir eksekusi saat `NODE_ENV === 'production'`.
  2. Operasi `upsert` menggunakan field unik (`email`, `slug`).
  3. Setiap produk diberikan stock default 100 di tabel `Inventory`.

- **Non-Functional Requirements**
  - Data fixture dipisahkan ke dalam folder `prisma/seed-data/` agar modular.

- **Test Coverage**
  - [Manual/Integration] Script seed dijalankan dan status exit code 0

**Step 1: Write failing test**
_(Seed script dieksekusi via CLI runner Prisma)_

**Step 2: Verify seed script tidak ada**
Run: `npx prisma db seed`
Expected: FAIL — Script `prisma/seed.ts` not found

**Step 3: Write minimal implementation**

Buat `prisma/seed-data/categories.ts`:

```typescript
export const SEED_CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Clothing', slug: 'clothing' },
  { name: 'Books', slug: 'books' },
] as const;
```

Buat `prisma/seed-data/products.ts`:

```typescript
export const SEED_PRODUCTS = [
  // Electronics
  {
    name: 'Wireless Headphones',
    price: 149.99,
    categorySlug: 'electronics',
    description: 'High-quality wireless audio',
  },
  {
    name: 'Mechanical Keyboard',
    price: 89.99,
    categorySlug: 'electronics',
    description: 'Tactile 60% layout',
  },
  {
    name: 'USB-C Hub',
    price: 39.99,
    categorySlug: 'electronics',
    description: '7-in-1 multiport adapter',
  },
  // Clothing
  {
    name: 'Cotton T-Shirt',
    price: 24.99,
    categorySlug: 'clothing',
    description: 'Premium 100% cotton',
  },
  {
    name: 'Denim Jeans',
    price: 59.99,
    categorySlug: 'clothing',
    description: 'Slim fit, stretch denim',
  },
  {
    name: 'Running Shoes',
    price: 119.99,
    categorySlug: 'clothing',
    description: 'Lightweight trail runner',
  },
  // Books
  { name: 'Clean Code', price: 34.99, categorySlug: 'books', description: 'Robert C. Martin' },
  {
    name: 'Designing Data-Intensive Applications',
    price: 49.99,
    categorySlug: 'books',
    description: 'Martin Kleppmann',
  },
  {
    name: 'The Pragmatic Programmer',
    price: 44.99,
    categorySlug: 'books',
    description: 'Hunt & Thomas',
  },
] as const;
```

Buat `prisma/seed-data/users.ts`:

```typescript
export const SEED_USERS = [
  {
    email: 'admin@example.com',
    name: 'Admin User',
  },
  {
    email: 'buyer@example.com',
    name: 'Sample Buyer',
  },
] as const;
```

Buat `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

import { SEED_CATEGORIES } from './seed-data/categories';
import { SEED_PRODUCTS } from './seed-data/products';
import { SEED_USERS } from './seed-data/users';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seed cannot run in production environment');
    process.exit(1);
  }

  console.log('🌱 Starting database seed...');

  // 1. Upsert categories
  const categoryUpserts = await Promise.all(
    SEED_CATEGORIES.map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name },
        create: cat,
      }),
    ),
  );
  const categoryMap = new Map(categoryUpserts.map((c) => [c.slug, c]));

  // 2. Upsert users
  await Promise.all(
    SEED_USERS.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: { name: user.name },
        create: { email: user.email, name: user.name },
      }),
    ),
  );

  // 3. Upsert products + inventory
  let productCount = 0;
  for (const product of SEED_PRODUCTS) {
    const category = categoryMap.get(product.categorySlug);
    if (!category) continue;

    const existing = await prisma.product.findFirst({
      where: { name: product.name, categoryId: category.id },
    });

    const productRecord = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: { price: product.price },
        })
      : await prisma.product.create({
          data: {
            name: product.name,
            price: product.price,
            description: product.description,
            categoryId: category.id,
          },
        });

    await prisma.inventory.upsert({
      where: { productId: productRecord.id },
      update: {},
      create: { productId: productRecord.id, stock: 100 },
    });

    productCount++;
  }

  console.log(
    `✅ Seed complete: ${categoryUpserts.length} categories, ${SEED_USERS.length} users, ${productCount} products`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

**Step 4: Verify seed script runs**
Run: `npx tsx prisma/seed.ts`
Expected: Output `✅ Seed complete: 3 categories, 2 users, 9 products`

---

## Task 8: Repository Abstraction Layer

**Files:**

- Create: `src/features/product/product.repository.interface.ts`
- Create: `tests/unit/product-repository.unit.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `IProductRepository` interface mendefinisikan seluruh operasi CRUD tanpa mengimpor tipe dari runtime database/Prisma.
  2. Unit test dapat berjalan menggunakan `MockProductRepository` murni in-memory tanpa I/O.
  3. Repository pattern menjadi jembatan interface murni yang mendukung Clean Architecture pada Week 3.

- **Functional Requirements**
  1. Interface mendefinisikan method: `create`, `findById`, `update`, `delete`, dan `list`.
  2. Domain type `ProductEntity` memisahkan schema DB dari layer presentasi.

- **Non-Functional Requirements**
  - Dependency Inversion Principle (DIP): domain logic bergantung pada abstraksi, bukan konkrit database.

- **Test Coverage**
  - [Unit] Mock repository dapat membuat dan membaca data di memori
  - [Unit] `NotFoundError` dilempar jika update record tidak ditemukan

**Step 1: Write failing test**

```typescript
// tests/unit/product-repository.unit.test.ts
import { describe, expect, it } from 'vitest';

import { NotFoundError } from '@/core/errors/app-error';
import type {
  IProductRepository,
  ProductCreateInput,
  ProductEntity,
} from '@/features/product/product.repository.interface';

class MockProductRepository implements IProductRepository {
  private products: ProductEntity[] = [];

  async create(data: ProductCreateInput): Promise<ProductEntity> {
    const product: ProductEntity = {
      id: crypto.randomUUID(),
      name: data.name,
      price: data.price,
      categoryId: data.categoryId,
      description: data.description ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.push(product);
    return product;
  }

  async findById(id: string): Promise<ProductEntity | null> {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async update(id: string, data: Partial<ProductCreateInput>): Promise<ProductEntity> {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new NotFoundError(`Product ${id} not found`);
    this.products[idx] = { ...this.products[idx], ...data, updatedAt: new Date() };
    return this.products[idx];
  }

  async delete(id: string): Promise<ProductEntity> {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new NotFoundError(`Product ${id} not found`);
    const [deleted] = this.products.splice(idx, 1);
    return deleted;
  }

  async list(): Promise<{ data: ProductEntity[]; nextCursor: string | null }> {
    return { data: this.products, nextCursor: null };
  }
}

describe('Product Repository Interface (Unit — No DB)', () => {
  it('should create and retrieve a product using mock repository', async () => {
    const repo: IProductRepository = new MockProductRepository();
    const created = await repo.create({ name: 'Widget', price: 9.99, categoryId: 'cat-1' });
    expect(created.id).toBeDefined();

    const found = await repo.findById(created.id);
    expect(found?.name).toBe('Widget');
  });

  it('should throw NotFoundError when updating non-existent product', async () => {
    const repo: IProductRepository = new MockProductRepository();
    await expect(repo.update('non-existent-id', { name: 'X' })).rejects.toThrow(NotFoundError);
  });
});
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/unit/product-repository.unit.test.ts`
Expected: FAIL — `Cannot find module '@/features/product/product.repository.interface'`

**Step 3: Write minimal implementation**

Buat `src/features/product/product.repository.interface.ts`:

```typescript
export type ProductCreateInput = {
  name: string;
  price: number;
  categoryId: string;
  description?: string;
};

export type ProductUpdateInput = Partial<Omit<ProductCreateInput, 'categoryId'>>;

export type ProductEntity = {
  id: string;
  name: string;
  price: unknown;
  categoryId: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PaginatedResult<T> = {
  data: T[];
  nextCursor: string | null;
};

export type ListOptions = {
  limit?: number;
  cursor?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
};

export interface IProductRepository {
  create(data: ProductCreateInput): Promise<ProductEntity>;
  findById(id: string): Promise<ProductEntity | null>;
  update(id: string, data: ProductUpdateInput): Promise<ProductEntity>;
  delete(id: string): Promise<ProductEntity>;
  list(options?: ListOptions): Promise<PaginatedResult<ProductEntity>>;
}
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/unit/product-repository.unit.test.ts`
Expected: PASS — 2 tests passed

---

## Verifikasi Akhir Seluruh Suite

Setelah seluruh 8 task diimplementasikan, jalankan verifikasi kepatuhan menyeluruh:

```bash
# 1. Format check
npm run format:check

# 2. TypeScript typecheck
npx tsc --noEmit

# 3. Full test suite (Week 1 + Week 2)
npm test
```

Expected output:

```
✓ tests/unit/prisma-setup.test.ts (2 tests)
✓ tests/unit/prisma-schema.test.ts (2 tests)
✓ tests/unit/product-repository.unit.test.ts (2 tests)
✓ tests/integration/product-crud.test.ts (4 tests)
✓ tests/integration/product-pagination.test.ts (2 tests)
✓ tests/integration/checkout.test.ts (2 tests)
✓ tests/integration/analytics.test.ts (3 tests)
... (9 test files dari Week 1)

Test Files  16 passed (16)
Tests       36 passed (36)
```

---

## Struktur Direktori Setelah Week 2 Selesai

```
node-js/
├── prisma/
│   ├── schema.prisma             # 6 model 3NF + Enums
│   ├── migrations/               # SQL migration history
│   ├── seed.ts                   # Deterministic seed script
│   └── seed-data/
│       ├── categories.ts
│       ├── products.ts
│       └── users.ts
│
├── src/
│   ├── features/                 # Modular feature-sliced domain
│   │   ├── product/
│   │   │   ├── product.repository.interface.ts
│   │   │   ├── product.repository.ts
│   │   │   ├── product.query.ts
│   │   │   └── product.types.ts
│   │   ├── order/
│   │   │   ├── order.service.ts
│   │   │   └── order.types.ts
│   │   └── analytics/
│   │       └── analytics.query.ts
│   ├── lib/
│   │   └── prisma.ts             # PrismaClient singleton
│   └── ... (existing Week 1 modules: core/, internals/, streams/, routes/)
│
└── tests/
    ├── helpers/
    │   └── test-db.ts            # PGLite in-memory DB helper
    ├── unit/
    │   ├── prisma-setup.test.ts
    │   ├── prisma-schema.test.ts
    │   ├── product-repository.unit.test.ts
    │   └── ... (existing Week 1 unit tests)
    └── integration/
        ├── product-crud.test.ts
        ├── product-pagination.test.ts
        ├── checkout.test.ts
        ├── analytics.test.ts
        └── api.test.ts           # (existing Week 1 integration test)
```
