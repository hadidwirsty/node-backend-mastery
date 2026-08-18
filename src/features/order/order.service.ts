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
