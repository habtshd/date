import assert from 'assert';
import jwt from 'jsonwebtoken';
import { buildApp } from '../src/app';
import { env } from '../src/config/env';
import { getCanonicalPair } from '../src/utils/crypto';
import { toDiscoveryProfile } from '../src/modules/discovery/discovery.service';

export async function runDatingTests() {
  console.log('  ▶ Testing Discovery, Likes, Passes, and Matching (Phase 3D)...');

  // 1. Canonical pair ordering (userAId < userBId)
  const uuid1 = '00000000-0000-0000-0000-000000000002';
  const uuid2 = '00000000-0000-0000-0000-000000000001';
  const pair = getCanonicalPair(uuid1, uuid2);
  assert.strictEqual(pair.userAId, uuid2);
  assert.strictEqual(pair.userBId, uuid1);
  console.log('    ✓ Canonical pair ordering verified: smaller UUID always assigned to userAId');

  // 2. toDiscoveryProfile DTO privacy & sanitization
  const mockProfile = {
    userId: '11111111-1111-1111-1111-111111111111',
    firstName: 'Sara',
    dateOfBirth: new Date('1999-04-12T00:00:00.000Z'),
    gender: 'FEMALE',
    city: 'Addis Ababa',
    bio: 'Love reading and travel',
    relationshipGoal: 'MARRIAGE',
    interests: [
      { interest: { name: 'Reading' } },
      { interest: { name: 'Travel' } },
    ],
    photos: [
      { id: 'photo-1', storageKey: 'profiles/user-1/photo-1.jpg' },
    ],
  };

  const discoveryDTO = toDiscoveryProfile(mockProfile);
  assert.strictEqual(discoveryDTO.id, mockProfile.userId);
  assert.strictEqual(discoveryDTO.firstName, 'Sara');
  assert.ok(discoveryDTO.age >= 18);
  assert.deepStrictEqual(discoveryDTO.interests, ['Reading', 'Travel']);
  assert.strictEqual(discoveryDTO.photo?.url, 'profiles/user-1/photo-1.jpg');
  // Confirm sensitive data is absent
  assert.strictEqual((discoveryDTO as any).phoneNumber, undefined);
  assert.strictEqual((discoveryDTO as any).nationalId, undefined);
  console.log('    ✓ Discovery response DTO prevents sensitive data leaks');

  // 3. Fastify HTTP Endpoints Security & Gating
  const app = await buildApp();
  await app.ready();

  const targetUserId = '22222222-2222-2222-2222-222222222222';

  // 4. Unauthenticated requests to discovery, likes, passes, matches rejected with 401
  const unauthDiscovery = await app.inject({
    method: 'GET',
    url: '/api/v1/discovery',
  });
  assert.strictEqual(unauthDiscovery.statusCode, 401);
  console.log('    ✓ Unauthenticated GET /api/v1/discovery rejected with 401');

  const unauthLike = await app.inject({
    method: 'POST',
    url: `/api/v1/likes/${targetUserId}`,
  });
  assert.strictEqual(unauthLike.statusCode, 401);
  console.log('    ✓ Unauthenticated POST /api/v1/likes/:userId rejected with 401');

  const unauthPass = await app.inject({
    method: 'POST',
    url: `/api/v1/passes/${targetUserId}`,
  });
  assert.strictEqual(unauthPass.statusCode, 401);
  console.log('    ✓ Unauthenticated POST /api/v1/passes/:userId rejected with 401');

  const unauthMatches = await app.inject({
    method: 'GET',
    url: '/api/v1/matches',
  });
  assert.strictEqual(unauthMatches.statusCode, 401);
  console.log('    ✓ Unauthenticated GET /api/v1/matches rejected with 401');

  const unauthUnmatch = await app.inject({
    method: 'DELETE',
    url: `/api/v1/matches/${targetUserId}`,
  });
  assert.strictEqual(unauthUnmatch.statusCode, 401);
  console.log('    ✓ Unauthenticated DELETE /api/v1/matches/:id rejected with 401');

  await app.close();
}
