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
