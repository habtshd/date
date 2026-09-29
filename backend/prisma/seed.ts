import { PrismaClient, AdminRole, UserRole, GenderType, RelationIntent } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Ethiopian Cultural & Lifestyle Interests
  const interests = [
    { name: 'Bunna & Coffee Ceremony', category: 'Culture', iconName: 'coffee' },
    { name: 'Ethio-Jazz & Music', category: 'Arts', iconName: 'music' },
    { name: 'Eskista & Traditional Dance', category: 'Culture', iconName: 'activity' },
    { name: 'Tsom & Fasting Cuisine', category: 'Food', iconName: 'utensils' },
    { name: 'Tech & Startups', category: 'Professional', iconName: 'cpu' },
    { name: 'Hiking in Simien / Bale', category: 'Outdoors', iconName: 'mountain' },
    { name: 'Premier League Football', category: 'Sports', iconName: 'award' },
    { name: 'Books & Ethiopian History', category: 'Education', iconName: 'book-open' },
    { name: 'Weekend Road Trips', category: 'Travel', iconName: 'compass' },
    { name: 'Photography', category: 'Creativity', iconName: 'camera' },
  ];

  for (const item of interests) {
    await prisma.interest.upsert({
      where: { name: item.name },
      create: item,
      update: {},
    });
  }
  console.log(`✅ Seeded ${interests.length} cultural interests`);

  // 2. Seed Super Admin User
  const adminPasswordHash = await bcrypt.hash('Admin@Pass123!', 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@habeshadate.et' },
    create: {
      email: 'admin@habeshadate.et',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
    update: {},
  });
  console.log(`✅ Seeded Super Admin: ${admin.email}`);

  // 3. Seed Verified Test User A (e.g. Selam)
  const userA = await prisma.user.upsert({
    where: { phone: '+251911000001' },
    create: {
      phone: '+251911000001',
      role: UserRole.VERIFIED_USER,
      status: 'ACTIVE',
      verification: {
        create: {
          status: 'VERIFIED',
          provider: 'INTERNAL_LIVENESS',
          referenceToken: 'VERIF_SEED_USER_A',
          verifiedAt: new Date(),
        },
      },
      profile: {
        create: {
          displayName: 'Selamawit',
          birthDate: new Date('1998-04-12'),
          gender: GenderType.FEMALE,
          city: 'Addis Ababa',
          region: 'Addis Ababa',
          heightCm: 168,
          bio: 'Architect based in Bole. Love weekend coffee ceremonies, jazz at Fendika, and exploring Ethiopian architecture.',
          relationshipIntention: RelationIntent.LONG_TERM,
          religion: 'Orthodox',
          occupation: 'Architect',
          education: 'Addis Ababa University',
          languages: ['Amharic', 'English'],
        },
      },
      photos: {
        create: [
          {
            originalUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
            blurredUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&blur=50',
            isPrimary: true,
            displayOrder: 0,
            status: 'APPROVED',
          },
        ],
      },
      preferences: {
        create: {
          minAge: 24,
          maxAge: 36,
          interestedInGenders: [GenderType.MALE],
          preferredCities: ['Addis Ababa'],
          preferredIntentions: [RelationIntent.LONG_TERM, RelationIntent.MARRIAGE],
          onlyVerified: true,
        },
      },
    },
    update: {},
  });

  // 4. Seed Verified Test User B (e.g. Dawit)
  const userB = await prisma.user.upsert({
    where: { phone: '+251911000002' },
    create: {
      phone: '+251911000002',
      role: UserRole.VERIFIED_USER,
      status: 'ACTIVE',
      verification: {
        create: {
          status: 'VERIFIED',
          provider: 'INTERNAL_LIVENESS',
          referenceToken: 'VERIF_SEED_USER_B',
          verifiedAt: new Date(),
        },
      },
      profile: {
        create: {
          displayName: 'Dawit',
          birthDate: new Date('1995-09-20'),
          gender: GenderType.MALE,
          city: 'Addis Ababa',
          region: 'Addis Ababa',
          heightCm: 182,
          bio: 'Software engineer & amateur photographer. Looking for meaningful conversations and someone who appreciates a good macchiato.',
          relationshipIntention: RelationIntent.MARRIAGE,
          religion: 'Orthodox',
          occupation: 'Software Engineer',
          education: 'BSc Computer Science',
          languages: ['Amharic', 'Oromo', 'English'],
        },
      },
      photos: {
        create: [
          {
            originalUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
            blurredUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&blur=50',
            isPrimary: true,
            displayOrder: 0,
            status: 'APPROVED',
          },
        ],
      },
      preferences: {
        create: {
          minAge: 21,
          maxAge: 32,
          interestedInGenders: [GenderType.FEMALE],
          preferredCities: ['Addis Ababa'],
          preferredIntentions: [RelationIntent.MARRIAGE, RelationIntent.LONG_TERM],
          onlyVerified: true,
        },
      },
    },
    update: {},
  });

  console.log(`✅ Seeded sample test profiles: ${userA.phone} and ${userB.phone}`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
