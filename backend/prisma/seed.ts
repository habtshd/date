import { PrismaClient, Gender, RelationshipGoal } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database according to Phase 2 specification...');

  // 1. Seed Interests
  const interestNames = [
    'Music',
    'Football',
    'Travel',
    'Reading',
    'Fitness',
    'Cooking',
    'Movies',
    'Business',
    'Technology',
    'Art',
    'Bunna & Coffee',
    'Ethio-Jazz',
  ];

  for (const name of interestNames) {
    await prisma.interest.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  console.log(`✅ Seeded ${interestNames.length} interests`);

  // 2. Seed Verified Test User A (Selam)
  const userA = await prisma.user.upsert({
    where: { phoneNumber: '+251911000001' },
    create: {
      phoneNumber: '+251911000001',
      phoneVerified: true,
      accountStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      profile: {
        create: {
          firstName: 'Selamawit',
          dateOfBirth: new Date('1998-04-12'),
          gender: Gender.FEMALE,
          city: 'Addis Ababa',
          bio: 'Architect based in Bole. Love weekend coffee ceremonies, jazz at Fendika, and exploring Ethiopian architecture.',
          relationshipGoal: RelationshipGoal.SERIOUS_RELATIONSHIP,
        },
      },
      photos: {
        create: [
          {
            storageKey: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
            blurredStorageKey: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&blur=50',
            isPrimary: true,
            status: 'APPROVED',
          },
        ],
      },
      preference: {
        create: {
          minAge: 24,
          maxAge: 36,
          preferredGender: Gender.MALE,
          preferredCity: 'Addis Ababa',
          relationshipGoal: RelationshipGoal.SERIOUS_RELATIONSHIP,
          maxDistanceKm: 50,
        },
      },
      verificationRecords: {
        create: {
          provider: 'FAYDA',
          status: 'VERIFIED',
          providerReference: 'FAYDA_REF_001',
          verifiedAt: new Date(),
        },
      },
    },
    update: {},
  });

  // 3. Seed Verified Test User B (Dawit)
  const userB = await prisma.user.upsert({
    where: { phoneNumber: '+251911000002' },
    create: {
      phoneNumber: '+251911000002',
      phoneVerified: true,
      accountStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      profile: {
        create: {
          firstName: 'Dawit',
          dateOfBirth: new Date('1995-09-20'),
          gender: Gender.MALE,
          city: 'Addis Ababa',
          bio: 'Software engineer & amateur photographer. Looking for meaningful conversations and someone who appreciates a good macchiato.',
          relationshipGoal: RelationshipGoal.MARRIAGE,
        },
      },
      photos: {
        create: [
          {
            storageKey: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
            blurredStorageKey: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&blur=50',
            isPrimary: true,
            status: 'APPROVED',
          },
        ],
      },
      preference: {
        create: {
          minAge: 21,
          maxAge: 32,
          preferredGender: Gender.FEMALE,
          preferredCity: 'Addis Ababa',
          relationshipGoal: RelationshipGoal.MARRIAGE,
          maxDistanceKm: 50,
        },
      },
      verificationRecords: {
        create: {
          provider: 'FAYDA',
          status: 'VERIFIED',
          providerReference: 'FAYDA_REF_002',
          verifiedAt: new Date(),
        },
      },
    },
    update: {},
  });

  console.log(`✅ Seeded sample test profiles: ${userA.phoneNumber} and ${userB.phoneNumber}`);
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
