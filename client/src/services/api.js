import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/me', data),
};

// Hotels API
export const hotelsAPI = {
  getAll: (params) => api.get('/hotels', { params }),
  getById: (id) => api.get(`/hotels/${id}`),
  create: (formData) => api.post('/hotels', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.patch('/hotels/' + id, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete('/hotels/' + id),
};

// Rooms API
export const roomsAPI = {
  getByHotel: (hotelId, params) => api.get(`/hotels/${hotelId}/rooms`, { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  checkAvailability: (params) => api.get('/rooms/availability', { params }),
  create: (hotelId, formData) => api.post('/hotels/' + hotelId + '/rooms', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.patch('/rooms/' + id, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete('/rooms/' + id),
};

// Bookings API
export const bookingsAPI = {
  getMyBookings: () => api.get('/bookings/my'),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  cancel: (id) => api.delete(`/bookings/${id}`),
  canReview: (id) => api.get(`/bookings/${id}/can-review`),
};

// Reviews API
export const reviewsAPI = {
  getByHotel: (hotelId, params) => api.get(`/hotels/${hotelId}/reviews`, { params }),
  getMyReviews: () => api.get('/reviews/my/reviews'),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.patch(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// AI API
export const aiAPI = {
  getRecommendations: (data) => api.post('/ai/recommendations', data),
  getPersonalizedHotels: (data) => api.post('/ai/personalized-hotels', data),
  getSentiment: (hotelId) => api.get(`/ai/sentiment/${hotelId}`),
};

// Chatbot API
export const chatbotAPI = {
  chat: (message, sessionId) => api.post('/chatbot/chat', { message, sessionId }),
  getHistory: (sessionId) => api.get(`/chatbot/history/${sessionId}`),
  clearHistory: (sessionId) => api.delete(`/chatbot/history/${sessionId}`),
};

// Analytics API (Admin only)
export const analyticsAPI = {
  getDashboardStats: (period) => api.get('/analytics/dashboard', { params: { period } }),
  getUserStats: () => api.get('/analytics/users'),
  getHotelStats: (hotelId) => api.get(`/analytics/hotel/${hotelId}`),
};

export default api;
