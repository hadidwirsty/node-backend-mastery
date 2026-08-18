export const SEED_PRODUCTS = [
  // Electronics
  {
    name: 'Wireless Headphones',
    price: 149.99,
    categorySlug: 'electronics',
    description: 'High-quality wireless audio',
  },
  {
    name: 'Mechanical Keyboard',
    price: 89.99,
    categorySlug: 'electronics',
    description: 'Tactile 60% layout',
  },
  {
    name: 'USB-C Hub',
    price: 39.99,
    categorySlug: 'electronics',
    description: '7-in-1 multiport adapter',
  },
  // Clothing
  {
    name: 'Cotton T-Shirt',
    price: 24.99,
    categorySlug: 'clothing',
    description: 'Premium 100% cotton',
  },
  {
    name: 'Denim Jeans',
    price: 59.99,
    categorySlug: 'clothing',
    description: 'Slim fit, stretch denim',
  },
  {
    name: 'Running Shoes',
    price: 119.99,
    categorySlug: 'clothing',
    description: 'Lightweight trail runner',
  },
  // Books
  { name: 'Clean Code', price: 34.99, categorySlug: 'books', description: 'Robert C. Martin' },
  {
    name: 'Designing Data-Intensive Applications',
    price: 49.99,
    categorySlug: 'books',
    description: 'Martin Kleppmann',
  },
  {
    name: 'The Pragmatic Programmer',
    price: 44.99,
    categorySlug: 'books',
    description: 'Hunt & Thomas',
  },
] as const;
