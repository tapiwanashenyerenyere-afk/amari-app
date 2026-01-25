// AMARI API Client
// Connects to the backend API

// Use your local machine's IP for mobile device testing, localhost for web
const API_BASE_URL = 'http://localhost:3002/api/v1';

// For mobile device testing, replace with your computer's local IP:
// const API_BASE_URL = 'http://192.168.x.x:3002/api/v1';

export interface ValidateCodeResponse {
  valid: boolean;
  inviterName?: string;
  tierGranted?: string | null;
  error?: string;
}

export interface RegisterResponse {
  member: {
    id: string;
    email: string;
    name: string;
    tier: string | null;
    firstLogin: boolean;
  };
  session: {
    token: string;
    expiresAt: string;
  };
}

export interface MemberProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  tier: string | null;
  tierGrantedAt: string | null;
  building: string | null;
  interests: string[];
  openTo: string[];
  visibility: Record<string, string>;
  firstLogin: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  eventDate: string;
  minTier: string | null;
  isInviteOnly: boolean;
  imageUrl: string | null;
  isInvited: boolean;
}

export interface DiscoverContent {
  id: string;
  type: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  featuredMember: MemberProfile | null;
  isFeatured: boolean;
  publishedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  publishedAt: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth endpoints
  async validateCode(code: string): Promise<ValidateCodeResponse> {
    return this.request<ValidateCodeResponse>('/auth/validate-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async register(data: {
    code: string;
    email: string;
    name: string;
    building?: string;
  }): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.token = null;
  }

  // Member endpoints
  async getProfile(): Promise<MemberProfile> {
    return this.request<MemberProfile>('/members/me');
  }

  async updateProfile(data: Partial<{
    name: string;
    building: string;
    interests: string[];
    openTo: string[];
  }>): Promise<MemberProfile> {
    return this.request<MemberProfile>('/members/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Events endpoints
  async getEvents(): Promise<{ events: Event[] }> {
    return this.request<{ events: Event[] }>('/events');
  }

  // Discover endpoints
  async getDiscover(): Promise<{ content: DiscoverContent[] }> {
    return this.request<{ content: DiscoverContent[] }>('/discover');
  }

  // Announcements endpoints
  async getAnnouncements(): Promise<{ announcements: Announcement[] }> {
    return this.request<{ announcements: Announcement[] }>('/announcements');
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
