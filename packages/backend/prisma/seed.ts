import { InquiryStatus, PrismaClient, UserRole } from '@prisma/client';
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
    {
      name: 'Virtual Styling',
      description:
        'Remote styling with curated digital lookbooks and shoppable links tailored to your goals.',
      durationMinutes: 180,
      priceCents: 42000,
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

  // Seed example contact inquiries
  const inquiries = [
    {
      id: 'seed-inquiry-jordan',
      fullName: 'Jordan Parker',
      email: 'jordan.parker@example.com',
      phone: '555-0101',
      serviceInterest: 'Wardrobe Overhaul',
      message:
        'I am looking for a full wardrobe refresh before my new job starts next month.',
      status: InquiryStatus.NEW,
      metadata: { seeded: true, recaptchaScore: 0.9 },
    },
    {
      id: 'seed-inquiry-taylor',
      fullName: 'Taylor Smith',
      email: 'taylor.smith@example.com',
      phone: '555-0202',
      serviceInterest: 'Closet Edit',
      message:
        'Need help decluttering and organizing my closet for spring.',
      status: InquiryStatus.IN_PROGRESS,
      metadata: { seeded: true, recaptchaScore: 0.86 },
      adminNotes: 'Initial email sent; awaiting scheduling.',
      respondedAt: new Date(),
    },
    {
      id: 'seed-inquiry-alex',
      fullName: 'Alex Lee',
      email: 'alex.lee@example.com',
      phone: '555-0303',
      serviceInterest: 'Event Styling',
      message:
        'Styling for an upcoming wedding in three weeks. Need two looks.',
      status: InquiryStatus.RESPONDED,
      metadata: { seeded: true, recaptchaScore: 0.92 },
      adminNotes: 'Consult scheduled; sent lookbook samples.',
      respondedAt: new Date(),
    },
  ];

  for (const inquiry of inquiries) {
    await prisma.contactInquiry.upsert({
      where: { id: inquiry.id },
      update: {},
      create: inquiry,
    });
  }

  const serviceLookup = await prisma.service.findMany();
  const serviceBySlug = Object.fromEntries(
    serviceLookup.map((service) => [service.slug, service.id])
  );

  const formTemplates = [
    {
      id: 'form-template-virtual-styling',
      name: 'Virtual Styling Intake',
      description:
        'Collects preferences, timelines, and inspiration for remote styling engagements.',
      serviceSlug: slugify('Virtual Styling'),
      fields: [
        {
          id: 'style_goals',
          label: 'What are your style goals?',
          type: 'textarea',
          helperText: 'Share occasions, lifestyle needs, and what you want to feel.',
          validation: { required: true, minLength: 20, maxLength: 2000 },
        },
        {
          id: 'timeline',
          label: 'Timeline',
          type: 'select',
          options: [
            { label: '1-2 weeks', value: '1-2 weeks' },
            { label: '3-4 weeks', value: '3-4 weeks' },
            { label: '5-8 weeks', value: '5-8 weeks' },
          ],
          validation: { required: true },
        },
        {
          id: 'budget',
          label: 'Budget range',
          type: 'radio',
          options: [
            { label: '$1,000 - $2,000', value: '1000-2000' },
            { label: '$2,000 - $4,000', value: '2000-4000' },
            { label: '$4,000+', value: '4000+' },
          ],
          validation: { required: true },
        },
        {
          id: 'sizes',
          label: 'Sizes & fit notes',
          type: 'text',
          placeholder: 'Top: M, Bottom: 29, Shoes: 9.5',
          validation: { required: true, minLength: 2, maxLength: 200 },
        },
        {
          id: 'style_links',
          label: 'Links to inspiration (optional)',
          type: 'textarea',
          placeholder: 'Paste Pinterest, Instagram, or lookbook links',
          validation: { required: false, maxLength: 1200 },
        },
      ],
    },
    {
      id: 'form-template-event-styling',
      name: 'Event Styling Intake',
      description:
        'Details for one-time event styling including dress code, venue, and inspiration.',
      serviceSlug: slugify('Event Styling'),
      fields: [
        {
          id: 'event_type',
          label: 'Event type',
          type: 'select',
          options: [
            { label: 'Wedding', value: 'wedding' },
            { label: 'Gala', value: 'gala' },
            { label: 'Work event', value: 'work' },
            { label: 'Other', value: 'other' },
          ],
          validation: { required: true },
        },
        {
          id: 'event_date',
          label: 'Event date',
          type: 'text',
          placeholder: 'MM/DD/YYYY',
          validation: { required: true, minLength: 5, maxLength: 20 },
        },
        {
          id: 'venue',
          label: 'Venue + location',
          type: 'text',
          validation: { required: true, minLength: 3, maxLength: 200 },
        },
        {
          id: 'dress_code',
          label: 'Dress code / vibe',
          type: 'textarea',
          validation: { required: true, minLength: 10, maxLength: 800 },
        },
        {
          id: 'color_palette',
          label: 'Preferred colors (optional)',
          type: 'text',
          validation: { required: false, maxLength: 120 },
        },
        {
          id: 'past_looks',
          label: 'Looks you liked before',
          type: 'textarea',
          validation: { required: false, maxLength: 800 },
        },
      ],
    },
  ];

  for (const template of formTemplates) {
    const createdTemplate = await prisma.formTemplate.upsert({
      where: { id: template.id },
      update: {},
      create: {
        id: template.id,
        name: template.name,
        description: template.description,
        serviceId: template.serviceSlug
          ? serviceBySlug[template.serviceSlug]
          : undefined,
        fields: template.fields,
        active: true,
      },
    });

    console.log('✅ Seeded form template', {
      id: createdTemplate.id,
      name: createdTemplate.name,
      version: createdTemplate.version,
    });

    await prisma.formSubmission.upsert({
      where: { id: `${template.id}-submission-1` },
      update: {},
      create: {
        id: `${template.id}-submission-1`,
        formTemplateId: createdTemplate.id,
        templateVersion: createdTemplate.version,
        email:
          template.id === 'form-template-virtual-styling'
            ? 'casey@example.com'
            : 'devon@example.com',
        responses:
          template.id === 'form-template-virtual-styling'
            ? {
                style_goals:
                  'Refresh weekday and weekend outfits for a remote job with occasional travel.',
                timeline: '3-4 weeks',
                budget: '2000-4000',
                sizes: 'Top M, Bottom 29, Shoes 9.5',
                style_links:
                  'https://www.pinterest.com/search/pins/?q=minimal%20workwear',
              }
            : {
                event_type: 'gala',
                event_date: '04/18/2026',
                venue: 'Modern art museum in downtown Chicago',
                dress_code:
                  'Black tie with room for modern silhouettes; open to bold jewelry.',
                color_palette: 'Emerald, black, metallics',
                past_looks: 'Loved last year’s emerald jumpsuit.',
              },
        metadata: { seeded: true, recaptchaScore: 0.99 },
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
