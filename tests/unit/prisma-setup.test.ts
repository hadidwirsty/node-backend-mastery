import { describe, expect, it } from 'vitest';

import { prisma } from '@/lib/prisma';

describe('Prisma Client Setup', () => {
  it('should export a PrismaClient singleton', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.$disconnect).toBe('function');
  });

  it('should maintain a singleton instance across imports', async () => {
    const { prisma: reimportedPrisma } = await import('../../src/lib/prisma.js');
    expect(prisma).toBe(reimportedPrisma);
  });
});
