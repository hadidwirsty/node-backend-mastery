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
