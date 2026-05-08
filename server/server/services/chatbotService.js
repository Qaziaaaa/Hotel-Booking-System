import prisma from '../config/database.js';
import dayjs from 'dayjs';

/**
 * Chatbot service for handling hotel booking conversations
 */
class ChatbotService {
  constructor() {
    this.contexts = new Map(); // Store conversation contexts
  }

  /**
   * Process user message and generate response
   */
  async processMessage(userId, message, sessionId = 'default') {
    const context = this.getContext(sessionId);
    const lowerMessage = message.toLowerCase();

    // Update context with user message
    context.history.push({ role: 'user', message, timestamp: new Date() });

    let response = {
      type: 'text',
      message: '',
      actions: [],
      data: null,
    };

    // Determine intent
    const intent = this.detectIntent(lowerMessage);

    switch (intent) {
      case 'SEARCH_HOTELS':
        response = await this.handleHotelSearch(lowerMessage, context);
        break;
      case 'CHECK_AVAILABILITY':
        response = await this.handleAvailabilityCheck(lowerMessage, context);
        break;
      case 'BOOKING_STATUS':
        response = await this.handleBookingStatus(userId, context);
        break;
      case 'PRICE_INQUIRY':
        response = await this.handlePriceInquiry(lowerMessage, context);
        break;
      case 'AMENITIES_QUERY':
        response = await this.handleAmenitiesQuery(lowerMessage, context);
        break;
      case 'CANCEL_BOOKING':
        response = await this.handleCancellation(userId, lowerMessage, context);
        break;
      case 'GET_RECOMMENDATIONS':
        response = await this.handleRecommendations(userId, context);
        break;
      case 'GREETING':
        response.message = "Hello! I'm your hotel booking assistant. How can I help you today? You can ask me to:\n\n• Search for hotels\n• Check availability\n• View your bookings\n• Get recommendations\n• Ask about prices and amenities";
        break;
      case 'HELP':
        response.message = "Here's what I can help you with:\n\n🏨 **Search Hotels** - Ask 'Find hotels in [city]'\n📅 **Check Availability** - Ask 'Is [hotel] available on [date]?'\n📋 **Your Bookings** - Ask 'Show my bookings'\n💰 **Prices** - Ask 'How much is [hotel]?'\n⭐ **Amenities** - Ask 'What amenities does [hotel] have?'\n🎯 **Recommendations** - Ask 'Recommend a hotel for me'";
        break;
      default:
        response.message = "I'm not sure I understood. You can ask me to:\n• Search for hotels in a location\n• Check room availability\n• View your booking status\n• Get personalized recommendations\n\nType 'help' for more options.";
    }

    // Store response in context
    context.history.push({ role: 'bot', message: response.message, timestamp: new Date() });
    this.saveContext(sessionId, context);

    return response;
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message) {
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    if (greetings.some(g => message.includes(g))) return 'GREETING';

    if (message.includes('help') || message.includes('what can you do')) return 'HELP';

    if (message.includes('search') || message.includes('find') || message.includes('looking for') || 
        message.includes('hotel in') || message.includes('hotels in')) return 'SEARCH_HOTELS';

    if (message.includes('available') || message.includes('availability') || message.includes('free room')) 
      return 'CHECK_AVAILABILITY';

    if (message.includes('my booking') || message.includes('my reservation') || message.includes('status')) 
      return 'BOOKING_STATUS';

    if (message.includes('price') || message.includes('cost') || message.includes('how much') || message.includes('rate')) 
      return 'PRICE_INQUIRY';

    if (message.includes('amenities') || message.includes('facilities') || message.includes('features') || 
        message.includes('pool') || message.includes('wifi') || message.includes('gym')) 
      return 'AMENITIES_QUERY';

    if (message.includes('cancel') || message.includes('refund')) return 'CANCEL_BOOKING';

    if (message.includes('recommend') || message.includes('suggestion') || message.includes('best hotel')) 
      return 'GET_RECOMMENDATIONS';

    return 'UNKNOWN';
  }

  /**
   * Handle hotel search
   */
  async handleHotelSearch(message, context) {
    // Extract location from message
    const locationMatch = message.match(/(?:in|at|near)\s+([a-zA-Z\s]+)/) || 
                         message.match(/([a-zA-Z\s]+)\s*(?:hotel|hotels)/);
    const location = locationMatch ? locationMatch[1].trim() : null;

    if (!location) {
      context.awaiting = 'location';
      return {
        type: 'text',
        message: "I'd be happy to help you find hotels! Which city or location are you interested in?",
        actions: [{ type: 'quick_reply', text: 'New York', value: 'New York' },
                  { type: 'quick_reply', text: 'Miami', value: 'Miami' },
                  { type: 'quick_reply', text: 'Los Angeles', value: 'Los Angeles' }],
      };
    }

    const hotels = await prisma.hotel.findMany({
      where: {
        OR: [
          { location: { contains: location, mode: 'insensitive' } },
          { name: { contains: location, mode: 'insensitive' } },
        ],
      },
      take: 5,
      include: { rooms: { take: 1 } },
    });

    if (hotels.length === 0) {
      return {
        type: 'text',
        message: `I couldn't find any hotels in ${location}. Would you like to try a different location?`,
        actions: [{ type: 'button', text: 'Try another location', action: 'search_again' }],
      };
    }

    const hotelList = hotels.map((h, i) => 
      `${i + 1}. **${h.name}** - ${h.location}\n   From $${h.rooms[0]?.price || 'N/A'}/night ⭐ ${h.rating}`
    ).join('\n\n');

    return {
      type: 'hotels',
      message: `I found ${hotels.length} hotel${hotels.length > 1 ? 's' : ''} in ${location}:\n\n${hotelList}\n\nWould you like more details about any of these?`,
      data: hotels,
      actions: hotels.map(h => ({ type: 'button', text: `View ${h.name}`, link: `/hotels/${h.id}` })),
    };
  }

  /**
   * Handle availability check
   */
  async handleAvailabilityCheck(message, context) {
    // Extract hotel name and dates
    const hotelMatch = message.match(/(?:is|at)\s+([a-zA-Z\s]+)\s+(?:available|free)/);
    const dateMatch = message.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\w+\s+\d{1,2})/);

    if (!context.currentHotel && !hotelMatch) {
      return {
        type: 'text',
        message: "Which hotel would you like to check availability for?",
      };
    }

    const hotelName = context.currentHotel || (hotelMatch ? hotelMatch[1].trim() : null);

    const hotel = await prisma.hotel.findFirst({
      where: { name: { contains: hotelName, mode: 'insensitive' } },
      include: { rooms: true },
    });

    if (!hotel) {
      return {
        type: 'text',
        message: "I couldn't find that hotel. Could you provide the exact hotel name?",
      };
    }

    context.currentHotel = hotel.name;

    // Check availability logic would go here
    const availableRooms = hotel.rooms.filter(r => r.capacity > 0);

    if (availableRooms.length > 0) {
      return {
        type: 'availability',
        message: `✅ **${hotel.name}** has ${availableRooms.length} room type${availableRooms.length > 1 ? 's' : ''} available!\n\n${availableRooms.map(r => `• **${r.roomType}**: $${r.price}/night (up to ${r.capacity} guests)`).join('\n')}\n\nWould you like to book one of these rooms?`,
        data: { hotel, rooms: availableRooms },
        actions: [{ type: 'button', text: 'Book Now', link: `/hotels/${hotel.id}` }],
      };
    } else {
      return {
        type: 'text',
        message: `❌ Sorry, **${hotel.name}** doesn't have any available rooms for your selected dates.\n\nWould you like to check other dates or hotels?`,
      };
    }
  }

  /**
   * Handle booking status inquiry
   */
  async handleBookingStatus(userId, context) {
    if (!userId) {
      return {
        type: 'text',
        message: "Please log in to view your bookings. Would you like to go to the login page?",
        actions: [{ type: 'button', text: 'Login', link: '/login' }],
      };
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { hotel: true, room: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (bookings.length === 0) {
      return {
        type: 'text',
        message: "You don't have any bookings yet. Would you like to search for hotels?",
        actions: [{ type: 'button', text: 'Search Hotels', link: '/hotels' }],
      };
    }

    const bookingList = bookings.map(b => {
      const checkIn = dayjs(b.checkIn).format('MMM D, YYYY');
      const status = b.status === 'CONFIRMED' ? '✅' : b.status === 'PENDING' ? '⏳' : '❌';
      return `${status} **${b.hotel.name}** - ${b.room.roomType}\n   Check-in: ${checkIn} | Status: ${b.status}`;
    }).join('\n\n');

    return {
      type: 'bookings',
      message: `Here are your recent bookings:\n\n${bookingList}\n\nView all your bookings for more details.`,
      data: bookings,
      actions: [{ type: 'button', text: 'View All Bookings', link: '/my-bookings' }],
    };
  }

  /**
   * Handle price inquiry
   */
  async handlePriceInquiry(message, context) {
    const hotelMatch = message.match(/(?:is|at|does)\s+([a-zA-Z\s]+)\s+(?:cost|price)/) ||
                       message.match(/([a-zA-Z\s]+)\s+(?:price|cost)/);
    const hotelName = hotelMatch ? hotelMatch[1].trim() : context.currentHotel;

    if (!hotelName) {
      return {
        type: 'text',
        message: "Which hotel would you like to know the price for?",
      };
    }

    const hotel = await prisma.hotel.findFirst({
      where: { name: { contains: hotelName, mode: 'insensitive' } },
      include: { rooms: true },
    });

    if (!hotel) {
      return {
        type: 'text',
        message: `I couldn't find pricing information for "${hotelName}". Please check if the name is correct.`,
      };
    }

    context.currentHotel = hotel.name;

    const priceList = hotel.rooms.map(r => 
      `• **${r.roomType}**: $${r.price}/night (up to ${r.capacity} guests)`
    ).join('\n');

    const cheapest = Math.min(...hotel.rooms.map(r => r.price));

    return {
      type: 'prices',
      message: `💰 **${hotel.name}** room prices:\n\n${priceList}\n\nPrices start from **$${cheapest}/night**. Taxes and fees may apply.`,
      data: hotel.rooms,
    };
  }

  /**
   * Handle amenities query
   */
  async handleAmenitiesQuery(message, context) {
    const hotelMatch = message.match(/(?:does|at)\s+([a-zA-Z\s]+)\s+have/) ||
                       message.match(/([a-zA-Z\s]+)\s+amenities/);
    const hotelName = hotelMatch ? hotelMatch[1].trim() : context.currentHotel;

    if (!hotelName) {
      return {
        type: 'text',
        message: "Which hotel's amenities would you like to know about?",
      };
    }

    const hotel = await prisma.hotel.findFirst({
      where: { name: { contains: hotelName, mode: 'insensitive' } },
    });

    if (!hotel) {
      return {
        type: 'text',
        message: `I couldn't find "${hotelName}". Please check the hotel name.`,
      };
    }

    const amenities = hotel.amenities.map(a => `• ${a.charAt(0).toUpperCase() + a.slice(1)}`).join('\n');

    const amenityIcons = {
      wifi: '📶', pool: '🏊', gym: '💪', spa: '💆', restaurant: '🍽️',
      bar: '🍸', parking: '🚗', breakfast: '🍳', 'room-service': '🛎️',
    };

    return {
      type: 'amenities',
      message: `✨ **${hotel.name}** offers these amenities:\n\n${hotel.amenities.map(a => `${amenityIcons[a] || '✓'} ${a.charAt(0).toUpperCase() + a.slice(1)}`).join('\n')}\n\nIs there a specific amenity you're looking for?`,
      data: hotel.amenities,
    };
  }

  /**
   * Handle booking cancellation
   */
  async handleCancellation(userId, message, context) {
    if (!userId) {
      return {
        type: 'text',
        message: "Please log in to cancel your bookings.",
        actions: [{ type: 'button', text: 'Login', link: '/login' }],
      };
    }

    return {
      type: 'text',
      message: "To cancel a booking, please visit your bookings page where you can see all your reservations and cancel eligible ones.",
      actions: [{ type: 'button', text: 'My Bookings', link: '/my-bookings' }],
    };
  }

  /**
   * Handle recommendations
   */
  async handleRecommendations(userId, context) {
    let whereClause = {};
    
    // If user is logged in, use their history
    if (userId) {
      const userBookings = await prisma.booking.findMany({
        where: { userId },
        include: { hotel: true },
        take: 3,
      });
      
      if (userBookings.length > 0) {
        const preferredLocations = userBookings.map(b => b.hotel.location);
        whereClause.location = { in: preferredLocations };
      }
    }

    // Get highly-rated hotels
    const recommendations = await prisma.hotel.findMany({
      where: { rating: { gte: 4.0 }, ...whereClause },
      orderBy: { rating: 'desc' },
      take: 3,
      include: { rooms: { take: 1 } },
    });

    const recList = recommendations.map((h, i) => 
      `${i + 1}. **${h.name}** ⭐ ${h.rating}\n   ${h.location} | From $${h.rooms[0]?.price || 'N/A'}/night`
    ).join('\n\n');

    return {
      type: 'recommendations',
      message: `🎯 Based on ${userId ? 'your preferences' : 'top ratings'}, I recommend:\n\n${recList}\n\nWould you like to learn more about any of these hotels?`,
      data: recommendations,
      actions: recommendations.map(h => ({ 
        type: 'button', 
        text: `View ${h.name}`, 
        link: `/hotels/${h.id}` 
      })),
    };
  }

  /**
   * Get or create conversation context
   */
  getContext(sessionId) {
    if (!this.contexts.has(sessionId)) {
      this.contexts.set(sessionId, {
        history: [],
        currentHotel: null,
        awaiting: null,
        createdAt: new Date(),
      });
    }
    return this.contexts.get(sessionId);
  }

  /**
   * Save conversation context
   */
  saveContext(sessionId, context) {
    this.contexts.set(sessionId, context);
    
    // Clean old contexts periodically
    this.cleanOldContexts();
  }

  /**
   * Clean contexts older than 1 hour
   */
  cleanOldContexts() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [id, context] of this.contexts) {
      if (context.createdAt < oneHourAgo) {
        this.contexts.delete(id);
      }
    }
  }

  /**
   * Get conversation history
   */
  getHistory(sessionId) {
    return this.getContext(sessionId).history;
  }

  /**
   * Clear conversation context
   */
  clearContext(sessionId) {
    this.contexts.delete(sessionId);
  }
}

export default new ChatbotService();
