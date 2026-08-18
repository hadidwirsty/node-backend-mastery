import { describe, expect, it } from 'vitest';

import { NotFoundError } from '@/core/errors/app-error';
import type {
  IProductRepository,
  ProductCreateInput,
  ProductEntity,
} from '@/features/product/product.repository.interface';

class MockProductRepository implements IProductRepository {
  private products: ProductEntity[] = [];

  async create(data: ProductCreateInput): Promise<ProductEntity> {
    const product: ProductEntity = {
      id: crypto.randomUUID(),
      name: data.name,
      price: data.price,
      categoryId: data.categoryId,
      description: data.description ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.push(product);
    return product;
  }

  async findById(id: string): Promise<ProductEntity | null> {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async update(id: string, data: Partial<ProductCreateInput>): Promise<ProductEntity> {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new NotFoundError(`Product ${id} not found`);
    this.products[idx] = { ...this.products[idx], ...data, updatedAt: new Date() };
    return this.products[idx];
  }

  async delete(id: string): Promise<ProductEntity> {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new NotFoundError(`Product ${id} not found`);
    const [deleted] = this.products.splice(idx, 1);
    return deleted;
  }

  async list(): Promise<{ data: ProductEntity[]; nextCursor: string | null }> {
    return { data: this.products, nextCursor: null };
  }
}

describe('Product Repository Interface (Unit — No DB)', () => {
  it('should create and retrieve a product using mock repository', async () => {
    const repo: IProductRepository = new MockProductRepository();
    const created = await repo.create({ name: 'Widget', price: 9.99, categoryId: 'cat-1' });
    expect(created.id).toBeDefined();

    const found = await repo.findById(created.id);
    expect(found?.name).toBe('Widget');
  });

  it('should throw NotFoundError when updating non-existent product', async () => {
    const repo: IProductRepository = new MockProductRepository();
    await expect(repo.update('non-existent-id', { name: 'X' })).rejects.toThrow(NotFoundError);
  });
});
