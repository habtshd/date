export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FAILED';
export type RelationshipGoal =
  | 'MARRIAGE'
  | 'SERIOUS_RELATIONSHIP'
  | 'DATING'
  | 'GETTING_TO_KNOW'
  | 'FRIENDSHIP';

export interface User {
  id: string;
  phoneNumber: string;
  verificationStatus: VerificationStatus;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isPhoneVerified: boolean;
  hasProfile: boolean;
  profile?: UserProfile;
}

export interface UserProfile {
  firstName: string;
  dateOfBirth: string;
  age: number;
  gender: Gender;
  city: string;
  bio?: string;
  relationshipGoal: RelationshipGoal;
  interests: string[];
  photos: ProfilePhoto[];
}

export interface ProfilePhoto {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface DiscoveryProfile {
  userId: string;
  firstName: string;
  age: number;
  city: string;
  relationshipGoal: string;
  bio?: string;
  interests: string[];
  photos: { id: string; url: string; isPrimary: boolean }[];
  isVerified: boolean;
}

export interface MatchItem {
  id: string;
  matchedUserId: string;
  firstName: string;
  age: number;
  city: string;
  photoUrl?: string;
  matchedAt: string;
  conversationId: string;
  isConversationActive: boolean;
}

export interface MessageItem {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isMe: boolean;
}
