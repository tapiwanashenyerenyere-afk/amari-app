/**
 * AMARI API Client
 *
 * Connects to the backend API with secure token handling.
 */

import { config, DEMO_MODE } from './config';

// Mock data for demo mode
const MOCK_MEMBER: MemberProfile = {
  id: '1',
  email: 'demo@amari.club',
  name: 'Demo User',
  avatarUrl: null,
  tier: 'gold',
  tierGrantedAt: '2024-01-01',
  building: 'Building an amazing startup that connects communities',
  interests: ['Tech', 'Design', 'Music', 'Art'],
  openTo: ['Mentorship', 'Collaboration', 'Networking'],
  visibility: { building: 'all', interests: 'all', openTo: 'connections' },
  firstLogin: false,
  createdAt: '2024-01-01',
};

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'AMARI Gala 2026',
    description: 'The premier celebration of Black excellence in Australia',
    location: 'Melbourne Convention Centre',
    eventDate: '2026-03-14T18:00:00Z',
    minTier: null,
    isInviteOnly: false,
    imageUrl: null,
    isInvited: true,
  },
  {
    id: '2',
    title: 'Networking Brunch',
    description: 'Connect with fellow members over brunch',
    location: 'Sydney Harbour',
    eventDate: '2026-02-20T10:00:00Z',
    minTier: 'silver',
    isInviteOnly: false,
    imageUrl: null,
    isInvited: true,
  },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Welcome to AMARI! Explore your new community.',
    body: 'We are excited to have you join our exclusive network.',
    linkUrl: null,
    publishedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Gala tickets now available for members',
    body: null,
    linkUrl: null,
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const MOCK_DISCOVER: DiscoverContent[] = [
  {
    id: '1',
    type: 'spotlight',
    title: 'Member Spotlight',
    body: 'Building bridges across communities and creating opportunities for the next generation.',
    imageUrl: null,
    featuredMember: { ...MOCK_MEMBER, name: 'Sarah Johnson', tier: 'laureate' } as any,
    isFeatured: true,
    publishedAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'news',
    title: 'AMARI expands to Brisbane',
    body: 'Exciting news for our Queensland members!',
    imageUrl: null,
    featuredMember: null,
    isFeatured: false,
    publishedAt: new Date().toISOString(),
  },
];

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

export interface Connection {
  id: string;
  member: {
    id: string;
    name: string;
    tier: string | null;
    avatarUrl: string | null;
    building?: string | null;
    interests?: string[];
  };
  connectedAt: string;
}

export interface ConnectionRequest {
  id: string;
  requester: {
    id: string;
    name: string;
    tier: string | null;
    avatarUrl: string | null;
  };
  message: string | null;
  requestedAt: string;
}

export interface Ticket {
  id: string;
  ticketCode: string;
  tableNumber: string | null;
  seatNumber: string | null;
  purchasedAt: string;
  event: {
    id: string;
    title: string;
    eventDate: string;
    location: string | null;
  };
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
    };

    // Safely merge custom headers if provided
    if (options.headers) {
      const customHeaders = options.headers as Record<string, string>;
      Object.assign(headers, customHeaders);
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Check response status BEFORE parsing JSON
      if (!response.ok) {
        // Try to parse error response as JSON, fallback to status text
        let errorMessage = `Request failed (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Response wasn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      const data = await response.json();
      return data;
    } catch (error: any) {
      clearTimeout(timeout);

      // Handle abort/timeout
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }

      // Re-throw other errors
      throw error;
    }
  }

  // Auth endpoints
  async validateCode(code: string): Promise<ValidateCodeResponse> {
    // DEMO MODE: Accept any code
    if (DEMO_MODE) {
      return {
        valid: true,
        inviterName: 'AMARI Team',
        tierGranted: 'gold',
      };
    }
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
    // DEMO MODE: Return mock registration
    if (DEMO_MODE) {
      return {
        member: {
          id: '1',
          email: data.email,
          name: data.name,
          tier: 'gold',
          firstLogin: true,
        },
        session: {
          token: 'demo-token-12345',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    }
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    if (DEMO_MODE) {
      this.token = null;
      return;
    }
    await this.request('/auth/logout', { method: 'POST' });
    this.token = null;
  }

  // Member endpoints
  async getProfile(): Promise<MemberProfile> {
    if (DEMO_MODE) {
      return MOCK_MEMBER;
    }
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
    if (DEMO_MODE) {
      return { events: MOCK_EVENTS };
    }
    return this.request<{ events: Event[] }>('/events');
  }

  // Discover endpoints
  async getDiscover(): Promise<{ content: DiscoverContent[] }> {
    if (DEMO_MODE) {
      return { content: MOCK_DISCOVER };
    }
    return this.request<{ content: DiscoverContent[] }>('/discover');
  }

  // Announcements endpoints
  async getAnnouncements(): Promise<{ announcements: Announcement[] }> {
    if (DEMO_MODE) {
      return { announcements: MOCK_ANNOUNCEMENTS };
    }
    return this.request<{ announcements: Announcement[] }>('/announcements');
  }

  // Connections endpoints
  async getConnections(): Promise<{ connections: Connection[]; count: number }> {
    if (DEMO_MODE) {
      return { connections: [], count: 12 };
    }
    return this.request<{ connections: Connection[]; count: number }>('/connections');
  }

  async getPendingRequests(): Promise<{ requests: ConnectionRequest[] }> {
    return this.request<{ requests: ConnectionRequest[] }>('/connections/pending');
  }

  async acceptConnection(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/connections/${id}/accept`, {
      method: 'POST',
    });
  }

  async declineConnection(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/connections/${id}/decline`, {
      method: 'POST',
    });
  }

  // Tickets endpoints
  async getTickets(): Promise<{ tickets: Ticket[] }> {
    return this.request<{ tickets: Ticket[] }>('/tickets');
  }
}

// Export singleton instance using configured API URL
export const api = new ApiClient(config.apiBaseUrl);
