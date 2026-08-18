export type ProductCreateInput = {
  name: string;
  price: number;
  categoryId: string;
  description?: string;
};

export type ProductUpdateInput = Partial<Omit<ProductCreateInput, 'categoryId'>>;

export type ProductEntity = {
  id: string;
  name: string;
  price: unknown;
  categoryId: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PaginatedResult<T> = {
  data: T[];
  nextCursor: string | null;
};

export type ListOptions = {
  limit?: number;
  cursor?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
};

export interface IProductRepository {
  create(data: ProductCreateInput): Promise<ProductEntity>;
  findById(id: string): Promise<ProductEntity | null>;
  update(id: string, data: ProductUpdateInput): Promise<ProductEntity>;
  delete(id: string): Promise<ProductEntity>;
  list(options?: ListOptions): Promise<PaginatedResult<ProductEntity>>;
}
