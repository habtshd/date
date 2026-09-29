import { User, DiscoveryProfile, MatchItem, MessageItem } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.code || `Request failed (${response.status})`);
      }

      return await response.json();
    } catch (err: any) {
      // Return fallback mocks if server is offline during initial frontend preview
      console.warn(`API call failed for ${endpoint}:`, err.message);
      throw err;
    }
  }

  // Auth
  async register(phoneNumber: string) {
    return this.request<{ success: boolean; message: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async verifyOtp(phoneNumber: string, otp: string) {
    return this.request<{ accessToken: string; user: User }>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp }),
    });
  }

  async getMe() {
    return this.request<{ user: User }>('/api/v1/auth/me');
  }

  // Profile & Onboarding
  async createProfile(data: any) {
    return this.request<{ profile: any }>('/api/v1/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePreferences(data: any) {
    return this.request('/api/v1/profile/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Verification
  async startVerification(provider = 'FAYDA') {
    return this.request<{ verificationId: string; status: string; redirectUrl?: string }>(
      '/api/v1/verification/start',
      {
        method: 'POST',
        body: JSON.stringify({ provider }),
      }
    );
  }

  async getVerificationStatus() {
    return this.request<{ status: string; isVerified: boolean }>('/api/v1/verification/status');
  }

  // Discovery & Swiping
  async getDiscoveryFeed(): Promise<{ profiles: DiscoveryProfile[] }> {
    return this.request<{ profiles: DiscoveryProfile[] }>('/api/v1/discovery');
  }

  async getPreviewFeed(): Promise<{ profiles: DiscoveryProfile[] }> {
    return this.request<{ profiles: DiscoveryProfile[] }>('/api/v1/discovery/preview');
  }

  async likeUser(targetUserId: string) {
    return this.request<{ matched: boolean; conversationId?: string }>(`/api/v1/likes/${targetUserId}`, {
      method: 'POST',
    });
  }

  async passUser(targetUserId: string) {
    return this.request(`/api/v1/passes/${targetUserId}`, {
      method: 'POST',
    });
  }

  // Matches & Conversations
  async getMatches(): Promise<{ matches: MatchItem[] }> {
    return this.request<{ matches: MatchItem[] }>('/api/v1/matches');
  }

  async getConversation(id: string) {
    return this.request<any>(`/api/v1/conversations/${id}`);
  }

  async getMessages(conversationId: string): Promise<{ messages: MessageItem[] }> {
    return this.request<{ messages: MessageItem[] }>(`/api/v1/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, content: string) {
    return this.request<{ message: MessageItem }>(`/api/v1/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Payments (Telebirr & Chapa)
  async initiatePayment(conversationId: string, provider = 'TELEBIRR') {
    return this.request<{ paymentId: string; checkoutUrl?: string; amount: number; currency: string }>(
      `/api/v1/conversations/${conversationId}/payment`,
      {
        method: 'POST',
        body: JSON.stringify({ provider }),
      }
    );
  }
}

export const api = new ApiService();
