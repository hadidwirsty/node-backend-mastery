import type { Prisma } from '@prisma/client';

export type CreateProductInput = {
  name: string;
  price: number;
  categoryId: string;
  description?: string;
};

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'categoryId'>>;

export type ProductEntity = Prisma.ProductGetPayload<{
  include: { category: true; inventory: true };
}>;
