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
