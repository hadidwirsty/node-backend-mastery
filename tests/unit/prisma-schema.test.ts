import { OrderStatus, Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

describe('Prisma Schema Design', () => {
  it('should have all required OrderStatus enum values', () => {
    const expectedStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    expectedStatuses.forEach((status) => {
      expect(OrderStatus[status as keyof typeof OrderStatus]).toBeDefined();
    });
  });

  it('should export all Prisma model types without error', () => {
    expect(Prisma.ModelName.User).toBe('User');
    expect(Prisma.ModelName.Product).toBe('Product');
    expect(Prisma.ModelName.Category).toBe('Category');
    expect(Prisma.ModelName.Order).toBe('Order');
    expect(Prisma.ModelName.OrderItem).toBe('OrderItem');
    expect(Prisma.ModelName.Inventory).toBe('Inventory');
  });
});
