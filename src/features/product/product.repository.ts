import type { PrismaClient } from '@prisma/client';

import { NotFoundError } from '@/core/errors/app-error';
import { logger } from '@/core/logging/logger';

import type { CreateProductInput, UpdateProductInput } from './product.types';

export async function createProduct(prisma: PrismaClient, data: CreateProductInput) {
  logger.info({ categoryId: data.categoryId, name: data.name }, 'Creating product');
  return prisma.product.create({
    data: {
      name: data.name,
      price: data.price,
      description: data.description,
      categoryId: data.categoryId,
    },
    include: { category: true, inventory: true },
  });
}

export async function findProductById(prisma: PrismaClient, id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true, inventory: true },
  });
}

export async function updateProduct(prisma: PrismaClient, id: string, data: UpdateProductInput) {
  const existing = await findProductById(prisma, id);
  if (!existing) throw new NotFoundError(`Product ${id} not found`);

  logger.info({ productId: id }, 'Updating product');
  return prisma.product.update({
    where: { id },
    data,
    include: { category: true, inventory: true },
  });
}

export async function deleteProduct(prisma: PrismaClient, id: string) {
  const existing = await findProductById(prisma, id);
  if (!existing) throw new NotFoundError(`Product ${id} not found`);

  logger.info({ productId: id }, 'Deleting product');
  return prisma.product.delete({
    where: { id },
    include: { category: true, inventory: true },
  });
}
