// ==========================================
// PRISMA CLIENT SERVICE
// ==========================================

import { PrismaClient } from '@prisma/client';

// Singleton Pattern für Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful Shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
