import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('exports all required API modules', async () => {
    const apiModule = await import('../../services/api.js');
    expect(apiModule.authAPI).toBeDefined();
    expect(apiModule.hotelsAPI).toBeDefined();
    expect(apiModule.roomsAPI).toBeDefined();
    expect(apiModule.bookingsAPI).toBeDefined();
    expect(apiModule.reviewsAPI).toBeDefined();
    expect(apiModule.aiAPI).toBeDefined();
    expect(apiModule.chatbotAPI).toBeDefined();
    expect(apiModule.analyticsAPI).toBeDefined();
  });

  it('authAPI has all required methods', async () => {
    const { authAPI } = await import('../../services/api.js');
    expect(authAPI.register).toBeInstanceOf(Function);
    expect(authAPI.login).toBeInstanceOf(Function);
    expect(authAPI.logout).toBeInstanceOf(Function);
    expect(authAPI.getMe).toBeInstanceOf(Function);
    expect(authAPI.updateMe).toBeInstanceOf(Function);
  });
});
