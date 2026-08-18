import { PGlite } from '@electric-sql/pglite';
import { PrismaClient } from '@prisma/client';
import { PrismaPGlite } from 'pglite-prisma-adapter';

export async function createTestDatabase(): Promise<PrismaClient> {
  const client = new PGlite();

  // Inisialisasi DDL schema di in-memory PGlite via client.exec (built-in gen_random_uuid)
  await client.exec(`
    DO $$ BEGIN
      CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "users" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "email" TEXT UNIQUE NOT NULL,
      "name" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "categories" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" TEXT UNIQUE NOT NULL,
      "slug" TEXT UNIQUE NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "products" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" TEXT NOT NULL,
      "description" TEXT,
      "price" DECIMAL(12,2) NOT NULL,
      "categoryId" UUID NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "inventories" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "productId" UUID UNIQUE NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
      "stock" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "orders" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
      "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
      "total" DECIMAL(12,2) NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "order_items" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "orderId" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
      "productId" UUID NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
      "quantity" INTEGER NOT NULL,
      "price" DECIMAL(12,2) NOT NULL
    );
  `);

  const adapter = new PrismaPGlite(client);
  const prisma = new PrismaClient({ adapter } as any);

  return prisma;
}
