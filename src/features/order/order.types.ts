import type { Prisma } from '@prisma/client';

export type CheckoutItem = {
  productId: string;
  quantity: number;
};

export type CheckoutInput = {
  userId: string;
  items: CheckoutItem[];
};

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { orderItems: { include: { product: true } } };
}>;
