import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { seedDatabase } from '../../prisma/seed';
import { createTestDatabase } from '../helpers/test-db';

describe('Database Seed Script (Idempotency & Upsert)', () => {
  let prisma: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    prisma = await createTestDatabase();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should seed database and remain idempotent on second run', async () => {
    // 1st run
    const result1 = await seedDatabase(prisma);
    expect(result1.categoriesCount).toBe(3);
    expect(result1.usersCount).toBe(2);
    expect(result1.productsCount).toBe(9);

    const categoriesCount1 = await prisma.category.count();
    const usersCount1 = await prisma.user.count();
    const productsCount1 = await prisma.product.count();
    const inventoryCount1 = await prisma.inventory.count();

    expect(categoriesCount1).toBe(3);
    expect(usersCount1).toBe(2);
    expect(productsCount1).toBe(9);
    expect(inventoryCount1).toBe(9);

    // 2nd run (idempotency check)
    const result2 = await seedDatabase(prisma);
    expect(result2.categoriesCount).toBe(3);
    expect(result2.usersCount).toBe(2);
    expect(result2.productsCount).toBe(9);

    const categoriesCount2 = await prisma.category.count();
    const usersCount2 = await prisma.user.count();
    const productsCount2 = await prisma.product.count();
    const inventoryCount2 = await prisma.inventory.count();

    expect(categoriesCount2).toBe(3);
    expect(usersCount2).toBe(2);
    expect(productsCount2).toBe(9);
    expect(inventoryCount2).toBe(9);
  });
});
