import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

vi.mock('../server/config/database.js', () => ({
  default: {
    hotel: { findMany: vi.fn(), findFirst: vi.fn() },
    booking: { findMany: vi.fn() },
  },
}));

describe('ChatbotService', () => {
  let chatbot;
  let prisma;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Clear require cache so we get a fresh instance each test
    vi.resetModules();
    const mod = await import('../server/services/chatbotService.js');
    chatbot = mod.default;
    prisma = (await import('../server/config/database.js')).default;
  });

  afterEach(() => {
    chatbot.clearContext('__test_all__');
  });

  describe('detectIntent', () => {
    it('detects GREETING intent', () => {
      const intents = ['hi', 'hello', 'hey', 'good morning', 'good evening'];
      intents.forEach(msg => {
        expect(chatbot.detectIntent(msg)).toBe('GREETING');
      });
    });

    it('detects HELP intent', () => {
      expect(chatbot.detectIntent('help')).toBe('HELP');
      expect(chatbot.detectIntent('what can you do')).toBe('HELP');
    });

    it('detects SEARCH_HOTELS intent', () => {
      expect(chatbot.detectIntent('find hotels in New York')).toBe('SEARCH_HOTELS');
      expect(chatbot.detectIntent('search hotels')).toBe('SEARCH_HOTELS');
      expect(chatbot.detectIntent('hotels in Miami')).toBe('SEARCH_HOTELS');
    });

    it('detects CHECK_AVAILABILITY intent', () => {
      expect(chatbot.detectIntent('is Grand Plaza available')).toBe('CHECK_AVAILABILITY');
      expect(chatbot.detectIntent('check availability')).toBe('CHECK_AVAILABILITY');
    });

    it('detects BOOKING_STATUS intent', () => {
      expect(chatbot.detectIntent('my bookings')).toBe('BOOKING_STATUS');
      expect(chatbot.detectIntent('my reservation')).toBe('BOOKING_STATUS');
    });

    it('detects PRICE_INQUIRY intent', () => {
      expect(chatbot.detectIntent('how much is Grand Plaza')).toBe('PRICE_INQUIRY');
      expect(chatbot.detectIntent('room price')).toBe('PRICE_INQUIRY');
    });

    it('detects AMENITIES_QUERY intent', () => {
      expect(chatbot.detectIntent('what amenities does Grand Plaza have')).toBe('AMENITIES_QUERY');
      expect(chatbot.detectIntent('pool')).toBe('AMENITIES_QUERY');
      expect(chatbot.detectIntent('wifi')).toBe('AMENITIES_QUERY');
    });

    it('detects CANCEL_BOOKING intent', () => {
      expect(chatbot.detectIntent('I want to cancel')).toBe('CANCEL_BOOKING');
      expect(chatbot.detectIntent('refund')).toBe('CANCEL_BOOKING');
    });

    it('detects GET_RECOMMENDATIONS intent', () => {
      expect(chatbot.detectIntent('recommend a hotel')).toBe('GET_RECOMMENDATIONS');
      expect(chatbot.detectIntent('best hotel')).toBe('GET_RECOMMENDATIONS');
    });

    it('returns UNKNOWN for unrecognized input', () => {
      expect(chatbot.detectIntent('xyzzy')).toBe('UNKNOWN');
      expect(chatbot.detectIntent('42')).toBe('UNKNOWN');
    });
  });

  describe('processMessage', () => {
    it('returns greeting message for GREETING intent', async () => {
      const response = await chatbot.processMessage(null, 'hello', 'session-g1');
      expect(response.type).toBe('text');
      expect(response.message).toContain('Hello');
    });

    it('returns help message for HELP intent', async () => {
      const response = await chatbot.processMessage(null, 'help', 'session-h1');
      expect(response.message).toContain('Search Hotels');
    });

    it('asks for location when searching hotels without location', async () => {
      prisma.hotel.findMany.mockResolvedValue([]);
      const response = await chatbot.processMessage(null, 'search hotels', 'session-s1');
      expect(response.message).toContain('location');
      expect(response.actions.length).toBeGreaterThan(0);
    });

    it('returns hotels when searching with location', async () => {
      prisma.hotel.findMany.mockResolvedValue([
        { id: 'hotel-1', name: 'Grand Plaza', location: 'New York', rating: 4.5, rooms: [{ price: 200 }] },
      ]);

      const response = await chatbot.processMessage(null, 'hotels in New York', 'session-s2');
      expect(response.message).toContain('Grand Plaza');
      expect(response.type).toBe('hotels');
    });

    it('returns no hotels found message', async () => {
      prisma.hotel.findMany.mockResolvedValue([]);

      const response = await chatbot.processMessage(null, 'hotels in Nowhere', 'session-s3');
      expect(response.message).toContain("couldn't find");
    });

    it('asks user to log in for booking status when not authenticated', async () => {
      const response = await chatbot.processMessage(null, 'my bookings', 'session-b1');
      expect(response.message).toContain('log in');
    });

    it('returns booking list for authenticated user', async () => {
      prisma.booking.findMany.mockResolvedValue([
        { id: 'booking-1', status: 'CONFIRMED', checkIn: new Date(), hotel: { name: 'Grand Plaza' }, room: { roomType: 'Deluxe' } },
      ]);

      const response = await chatbot.processMessage('user-1', 'my bookings', 'session-b2');
      expect(response.message).toContain('Grand Plaza');
      expect(response.type).toBe('bookings');
    });

    it('returns no bookings message for user without bookings', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      const response = await chatbot.processMessage('user-1', 'my bookings', 'session-b3');
      expect(response.message).toContain("don't have any bookings");
    });

    it('returns price info for known hotel', async () => {
      prisma.hotel.findFirst.mockResolvedValue({
        id: 'hotel-1', name: 'Grand Plaza',
        rooms: [{ roomType: 'Standard', price: 199, capacity: 2 }, { roomType: 'Suite', price: 399, capacity: 4 }],
      });

      const response = await chatbot.processMessage(null, "what is Grand Plaza's price", 'session-p1');
      expect(response.message).toContain('$199');
      expect(response.message).toContain('$399');
    });

    it('returns amenities for known hotel', async () => {
      prisma.hotel.findFirst.mockResolvedValue({
        id: 'hotel-1', name: 'Grand Plaza', amenities: ['wifi', 'pool', 'gym', 'spa'],
      });

      const response = await chatbot.processMessage(null, 'what amenities does Grand Plaza have', 'session-a1');
      expect(response.message).toContain('Wifi');
      expect(response.message).toContain('Pool');
    });

    it('returns fallback message for unknown intent', async () => {
      const response = await chatbot.processMessage(null, 'xyzzy', 'session-u1');
      expect(response.message).toContain("I'm not sure I understood");
    });
  });

  describe('context management', () => {
    it('maintains conversation context across messages', async () => {
      const firstResponse = await chatbot.processMessage(null, 'hello', 'ctx-session');
      expect(firstResponse.message).toContain('Hello');

      const context = chatbot.getContext('ctx-session');
      expect(context.history.length).toBe(2);
      expect(context.history[0].role).toBe('user');
      expect(context.history[1].role).toBe('bot');
    });

    it('creates new context for unknown session', () => {
      const context = chatbot.getContext('new-session');
      expect(context.history).toEqual([]);
      expect(context.currentHotel).toBeNull();
    });

    it('clears context on request', () => {
      chatbot.getContext('clear-session');
      chatbot.clearContext('clear-session');
      const context = chatbot.getContext('clear-session');
      expect(context.history).toEqual([]);
    });

    it('retrieves conversation history', async () => {
      await chatbot.processMessage(null, 'hello', 'history-session');
      const history = chatbot.getHistory('history-session');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('handleRecommendations', () => {
    it('returns recommendations for authenticated users', async () => {
      prisma.booking.findMany.mockResolvedValue([{ hotel: { location: 'New York' } }]);
      prisma.hotel.findMany.mockResolvedValue([
        { id: 'hotel-1', name: 'Top Hotel', rating: 4.8, location: 'New York', rooms: [{ price: 300 }] },
      ]);

      const response = await chatbot.handleRecommendations('user-1', {});
      expect(response.type).toBe('recommendations');
      expect(response.data).toHaveLength(1);
    });

    it('returns top-rated hotels for unauthenticated users', async () => {
      prisma.hotel.findMany.mockResolvedValue([
        { id: 'hotel-1', name: 'Top Hotel', rating: 4.9, location: 'Paris', rooms: [{ price: 500 }] },
      ]);

      const response = await chatbot.handleRecommendations(null, {});
      expect(response.type).toBe('recommendations');
      expect(response.message).toContain('top ratings');
    });
  });

  /**
   * Property-based tests
   */
  describe('P: Intent detection invariants', () => {
    it('all greeting variations return GREETING', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'),
          (greeting) => {
            expect(chatbot.detectIntent(greeting)).toBe('GREETING');
          }
        )
      );
    });

    it('every message maps to exactly one intent', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (message) => {
            const intent = chatbot.detectIntent(message.toLowerCase());
            const validIntents = ['GREETING', 'HELP', 'SEARCH_HOTELS', 'CHECK_AVAILABILITY',
              'BOOKING_STATUS', 'PRICE_INQUIRY', 'AMENITIES_QUERY', 'CANCEL_BOOKING',
              'GET_RECOMMENDATIONS', 'UNKNOWN'];
            expect(validIntents).toContain(intent);
          }
        )
      );
    });
  });
});
