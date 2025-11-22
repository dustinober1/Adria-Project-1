import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { slugify } from '@adria/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash passwords with bcrypt (10 rounds)
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const clientPassword = await bcrypt.hash('Test123!', 10);

  // Create super admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@adriacross.com' },
    update: {},
    create: {
      email: 'admin@adriacross.com',
      password: adminPassword,
      firstName: 'Adria',
      lastName: 'Cross',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Created super admin user:', {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  });

  // Create test client user
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: {},
    create: {
      email: 'client@test.com',
      password: clientPassword,
      firstName: 'Test',
      lastName: 'Client',
      role: UserRole.CLIENT,
      isActive: true,
    },
  });

  console.log('✅ Created test client user:', {
    id: clientUser.id,
    email: clientUser.email,
    role: clientUser.role,
  });

  // Create a regular admin user for testing
  const regularAdminPassword = await bcrypt.hash('Admin123!', 10);
  const regularAdmin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: regularAdminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Created regular admin user:', {
    id: regularAdmin.id,
    email: regularAdmin.email,
    role: regularAdmin.role,
  });

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\nTest Credentials:');
  console.log('─────────────────────────────────────────────');
  console.log('Super Admin:');
  console.log('  Email:    admin@adriacross.com');
  console.log('  Password: Admin123!');
  console.log('  Role:     SUPER_ADMIN');
  console.log('─────────────────────────────────────────────');
  console.log('Regular Admin:');
  console.log('  Email:    admin@test.com');
  console.log('  Password: Admin123!');
  console.log('  Role:     ADMIN');
  console.log('─────────────────────────────────────────────');
  console.log('Test Client:');
  console.log('  Email:    client@test.com');
  console.log('  Password: Test123!');
  console.log('  Role:     CLIENT');
  console.log('─────────────────────────────────────────────\n');

  // Seed example services
  const services = [
    {
      name: 'Closet Edit',
      description:
        'A focused session to audit your closet, identify gaps, and create outfits with what you already own.',
      durationMinutes: 120,
      priceCents: 35000,
    },
    {
      name: 'Wardrobe Overhaul',
      description:
        'A full wardrobe refresh with curated looks for work, weekends, and special occasions.',
      durationMinutes: 240,
      priceCents: 75000,
    },
    {
      name: 'Event Styling',
      description:
        'Head-to-toe styling for your upcoming event, including accessories and tailoring recommendations.',
      durationMinutes: 90,
      priceCents: 25000,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: slugify(service.name) },
      update: {},
      create: {
        name: service.name,
        slug: slugify(service.name),
        description: service.description,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
        active: true,
      },
    });
  }

  // Seed example blog posts
  const posts = [
    {
      title: 'How to Build a Capsule Wardrobe',
      excerpt:
        'Simplify your closet with versatile pieces you can mix and match all season long.',
      content:
        'A capsule wardrobe focuses on timeless pieces that can be paired effortlessly. Start with neutrals, add a few statement items, and make sure everything fits your lifestyle...',
      status: 'PUBLISHED' as const,
    },
    {
      title: 'Mixing Patterns Like a Pro',
      excerpt:
        'Polka dots with stripes? Yes! Learn the rules (and how to break them) for mixing patterns.',
      content:
        'Pattern mixing works best when you vary scale and keep a common color thread. Anchor with a solid, and layer in prints that share hues...',
      status: 'PUBLISHED' as const,
    },
    {
      title: 'Seasonal Color Trends to Watch',
      excerpt:
        'From jewel tones to earthy neutrals, here are the colors dominating the upcoming season.',
      content:
        'This season leans into rich jewel tones balanced by grounded neutrals. Think emerald, garnet, and sapphire paired with camel and charcoal...',
      status: 'DRAFT' as const,
    },
  ];

  for (const post of posts) {
    await prisma.blogPost.upsert({
      where: { slug: slugify(post.title) },
      update: {},
      create: {
        title: post.title,
        slug: slugify(post.title),
        excerpt: post.excerpt,
        content: post.content,
        status: post.status,
        publishedAt: post.status === 'PUBLISHED' ? new Date() : null,
        authorId: adminUser.id,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
