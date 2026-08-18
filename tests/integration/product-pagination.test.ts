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
