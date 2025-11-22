/**
 * Prisma Client Singleton
 *
 * This file provides a singleton instance of PrismaClient to prevent
 * multiple instances in development (hot reload) and ensure proper
 * connection pooling.
 *
 * Connection Pool Configuration:
 * - Development: 5 connections per instance
 * - Staging: 10 connections per instance
 * - Production: 10 connections per instance
 *
 * For production deployments on Cloud Run, adjust pool size based on:
 * Total Connections = Cloud Run Instances * Connections per Instance
 *
 * Ensure Cloud SQL max_connections > Total Connections
 */

import { PrismaClient } from '@prisma/client';

import { env } from '../config/env';

// Extend PrismaClient with custom methods if needed
// const prismaClientSingleton = () => {
//   return new PrismaClient().$extends({
//     // Custom extensions here
//   });
// };

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    datasources: {
      db: {
        url: env.databaseUrl,
      },
    },
  });
};

// TypeScript global augmentation to prevent multiple instances
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Use existing instance if available (prevents hot reload issues in dev)
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Store instance globally in development to prevent reconnection on hot reload
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;

/**
 * Graceful shutdown helper
 * Call this when the application is shutting down to properly close DB connections
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
