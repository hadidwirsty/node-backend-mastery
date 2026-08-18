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
