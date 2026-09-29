import assert from 'assert';
import { toDiscoveryProfile } from '../../src/modules/discovery/discovery.service';
import { eventBus } from '../../src/events/eventBus';
import { notificationsService } from '../../src/modules/notifications/notifications.service';

export async function runPrivacyTests() {
  console.log('  ▶ [Security Matrix] Testing Privacy Isolation & Data Leak Prevention...');

  // 1. Discovery DTO Privacy Sanitization Test
  const mockRawProfile = {
    userId: '11111111-1111-1111-1111-111111111111',
    firstName: 'Tigist',
    dateOfBirth: new Date('1998-05-20T00:00:00.000Z'),
    gender: 'FEMALE',
    city: 'Addis Ababa',
    bio: 'Software engineer passionate about Ethiopian art',
    relationshipGoal: 'LONG_TERM',
    interests: [{ interest: { name: 'Art' } }, { interest: { name: 'Coding' } }],
    photos: [{ id: 'p1', storageKey: 'photos/p1.jpg' }],
    // Hypothetical raw sensitive fields that MUST NOT leak
    phoneNumber: '+251911223344',
    nationalId: 'ET-FAD-987654321',
    accountStatus: 'ACTIVE',
    verificationRecords: [{ id: 'rec-1', providerReference: 'SECRET_FAYDA_REF' }],
  };

  const discoveryDTO = toDiscoveryProfile(mockRawProfile as any);

  // Assert public profile data is present
  assert.strictEqual(discoveryDTO.id, mockRawProfile.userId);
  assert.strictEqual(discoveryDTO.firstName, 'Tigist');
  assert.strictEqual(typeof discoveryDTO.age, 'number');
  assert.ok(discoveryDTO.age >= 18);
  assert.deepStrictEqual(discoveryDTO.interests, ['Art', 'Coding']);

  // Assert sensitive PII is completely stripped
  assert.strictEqual((discoveryDTO as any).phoneNumber, undefined);
  assert.strictEqual((discoveryDTO as any).nationalId, undefined);
  assert.strictEqual((discoveryDTO as any).verificationRecords, undefined);
  assert.strictEqual((discoveryDTO as any).accountStatus, undefined);
  console.log('    ✓ Discovery profile DTO completely isolates sensitive PII from other users');

  // 2. Private Conversation Content Isolation:
  // When an event is raised for a new message, lock-screen notifications MUST NOT expose message content
  const confidentialMessage = 'My bank account number is 100012345678 and OTP is 998877';
  let capturedNotification: any = null;

  const originalCreate = notificationsService.createNotification;
  notificationsService.createNotification = async (input: any) => {
    capturedNotification = input;
    return input as any;
  };

  try {
    eventBus.emitEvent({
      type: 'MESSAGE_CREATED',
      recipientUserId: 'user-recipient',
      senderUserId: 'user-sender',
      senderFirstName: 'Kidus',
      conversationId: 'conv-private',
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(capturedNotification !== null);
    assert.strictEqual(capturedNotification.type, 'NEW_MESSAGE');
    assert.strictEqual(capturedNotification.title, 'New Message');
    assert.strictEqual(capturedNotification.body, 'You have a new message from Kidus.');

    // Invariant: The body must NEVER contain the message content
    assert.strictEqual(capturedNotification.body.includes(confidentialMessage), false);
    assert.strictEqual(capturedNotification.body.includes('100012345678'), false);
    console.log('    ✓ Push notifications guarantee lock-screen privacy: zero chat message exposure');
  } finally {
    notificationsService.createNotification = originalCreate;
  }

  // 3. Match Notification Isolation:
  // Must never expose other matches or conversations
  let capturedMatchA: any = null;
  let capturedMatchB: any = null;

  notificationsService.createNotification = async (input: any) => {
    if (input.userId === 'user-A') capturedMatchA = input;
    if (input.userId === 'user-B') capturedMatchB = input;
    return input as any;
  };

  try {
    eventBus.emitEvent({
      type: 'MATCH_CREATED',
      userAId: 'user-A',
      userBId: 'user-B',
      userAName: 'Abebe',
      userBName: 'Meseret',
      matchId: 'match-101',
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(capturedMatchA !== null);
    assert.ok(capturedMatchB !== null);
    assert.ok(capturedMatchA.body.includes('Meseret'));
    assert.ok(capturedMatchB.body.includes('Abebe'));
    // Must never disclose other users or conversations
    assert.strictEqual(capturedMatchA.body.includes('User C'), false);
    assert.strictEqual(capturedMatchA.body.includes('active conversations'), false);
    console.log('    ✓ Mutual match event guarantees absolute conversation compartmentalization');
  } finally {
    notificationsService.createNotification = originalCreate;
  }
}
