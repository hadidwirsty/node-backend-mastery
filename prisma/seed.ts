import type { PrismaClient } from '@prisma/client';

import { prisma } from '../src/lib/prisma';
import { SEED_CATEGORIES } from './seed-data/categories';
import { SEED_PRODUCTS } from './seed-data/products';
import { SEED_USERS } from './seed-data/users';

export async function seedDatabase(client: PrismaClient = prisma) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed cannot run in production environment');
  }

  // 1. Upsert categories
  const categoryUpserts = await Promise.all(
    SEED_CATEGORIES.map((cat) =>
      client.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name },
        create: cat,
      }),
    ),
  );
  const categoryMap = new Map(categoryUpserts.map((c) => [c.slug, c]));

  // 2. Upsert users
  const userUpserts = await Promise.all(
    SEED_USERS.map((user) =>
      client.user.upsert({
        where: { email: user.email },
        update: { name: user.name },
        create: { email: user.email, name: user.name },
      }),
    ),
  );

  // 3. Upsert products + inventory
  let productCount = 0;
  for (const product of SEED_PRODUCTS) {
    const category = categoryMap.get(product.categorySlug);
    if (!category) continue;

    const existing = await client.product.findFirst({
      where: { name: product.name, categoryId: category.id },
    });

    const productRecord = existing
      ? await client.product.update({
          where: { id: existing.id },
          data: { price: product.price },
        })
      : await client.product.create({
          data: {
            name: product.name,
            price: product.price,
            description: product.description,
            categoryId: category.id,
          },
        });

    await client.inventory.upsert({
      where: { productId: productRecord.id },
      update: {},
      create: { productId: productRecord.id, stock: 100 },
    });

    productCount++;
  }

  return {
    categoriesCount: categoryUpserts.length,
    usersCount: userUpserts.length,
    productsCount: productCount,
  };
}

async function main() {
  console.log('🌱 Starting database seed...');
  const result = await seedDatabase(prisma);
  console.log(
    `✅ Seed complete: ${result.categoriesCount} categories, ${result.usersCount} users, ${result.productsCount} products`,
  );
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
