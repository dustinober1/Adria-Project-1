import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean up test users from the database
 * Deletes all users whose email contains 'test' or 'example.com'
 */
export async function cleanupTestUsers(): Promise<void> {
  await prisma.blogPost.deleteMany({
    where: {
      OR: [
        { slug: { contains: 'test', mode: 'insensitive' } },
        { title: { contains: 'test', mode: 'insensitive' } },
        { author: { email: { contains: 'example.com' } } },
      ],
    },
  });

  await prisma.service.deleteMany({
    where: {
      OR: [
        { slug: { contains: 'test', mode: 'insensitive' } },
        { name: { contains: 'test', mode: 'insensitive' } },
        { name: { contains: 'Draft', mode: 'insensitive' } },
      ],
    },
  });

  await prisma.refreshToken.deleteMany({
    where: {
      user: {
        email: {
          contains: 'test',
        },
      },
    },
  });

  await prisma.contactInquiry.deleteMany({
    where: {
      OR: [
        { email: { contains: 'test', mode: 'insensitive' } },
        { email: { contains: 'example.com', mode: 'insensitive' } },
        { fullName: { contains: 'test', mode: 'insensitive' } },
      ],
    },
  });

  await prisma.formSubmission.deleteMany({
    where: {
      OR: [
        { email: { contains: 'test', mode: 'insensitive' } },
        { email: { contains: 'example.com', mode: 'insensitive' } },
        { id: { contains: 'test', mode: 'insensitive' } },
      ],
    },
  });

  await prisma.formTemplate.deleteMany({
    where: {
      OR: [
        { name: { contains: 'test', mode: 'insensitive' } },
        { id: { contains: 'test', mode: 'insensitive' } },
      ],
    },
  });

  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { contains: 'test' } },
        { email: { contains: 'example.com' } },
      ],
    },
  });
}

/**
 * Delete a specific user by email
 */
export async function deleteUserByEmail(email: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      user: {
        email,
      },
    },
  });

  await prisma.user.deleteMany({
    where: { email },
  });
}

/**
 * Delete all refresh tokens for a user
 */
export async function deleteRefreshTokensByUserId(
  userId: string
): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

/**
 * Count users in the database
 */
export async function countUsers(): Promise<number> {
  return prisma.user.count();
}

/**
 * Get user by email (for verification)
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { refreshTokens: true },
  });
}

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
