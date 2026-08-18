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
