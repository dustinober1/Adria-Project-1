import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
