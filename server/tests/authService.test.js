import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('../server/config/database.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../server/middleware/auth.js', () => ({
  generateToken: vi.fn(() => 'mock-jwt-token'),
}));

import prisma from '../server/config/database.js';
import * as authService from '../server/services/authService.js';
import AppError from '../server/utils/AppError.js';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
    };

    it('creates a new user and returns user with token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: validUser.email,
        firstName: validUser.firstName,
        lastName: validUser.lastName,
        role: 'USER',
        createdAt: new Date(),
      });

      const result = await authService.register(validUser);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.user.email).toBe(validUser.email);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validUser.email },
      });
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('throws 409 when email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: validUser.email });

      await expect(authService.register(validUser)).rejects.toThrow(AppError);
      await expect(authService.register(validUser)).rejects.toThrow('Email already registered');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password before storing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(async ({ data }) => ({
        id: 'user-1',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'USER',
        createdAt: new Date(),
      }));

      await authService.register(validUser);

      const createdData = prisma.user.create.mock.calls[0][0].data;
      expect(createdData.password).not.toBe(validUser.password);
      const isHashed = await bcrypt.compare(validUser.password, createdData.password);
      expect(isHashed).toBe(true);
    });

    it('does not return password in response', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: validUser.email,
        firstName: validUser.firstName,
        lastName: validUser.lastName,
        role: 'USER',
        createdAt: new Date(),
      });

      const result = await authService.register(validUser);
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('returns user and token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(credentials.password, 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: credentials.email,
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
      });

      const result = await authService.login(credentials);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.token).toBe('mock-jwt-token');
    });

    it('throws 401 for non-existent email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(credentials)).rejects.toThrow(AppError);
      await expect(authService.login(credentials)).rejects.toThrow('Invalid email or password');
    });

    it('throws 401 for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('differentpassword', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: credentials.email,
        password: hashedPassword,
      });

      await expect(authService.login(credentials)).rejects.toThrow(AppError);
      await expect(authService.login(credentials)).rejects.toThrow('Invalid email or password');
    });

    it('does not return password hash in response', async () => {
      const hashedPassword = await bcrypt.hash(credentials.password, 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: credentials.email,
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
      });

      const result = await authService.login(credentials);
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('getMe', () => {
    it('returns user by id', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'USER',
        createdAt: new Date(),
      });

      const user = await authService.getMe('user-1');
      expect(user.email).toBe('test@example.com');
      expect(user).not.toHaveProperty('password');
    });

    it('throws 404 when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.getMe('nonexistent')).rejects.toThrow(AppError);
      await expect(authService.getMe('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('updateMe', () => {
    it('updates user fields', async () => {
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1987654321',
        role: 'USER',
      });

      const result = await authService.updateMe('user-1', {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1987654321',
      });

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { firstName: 'Jane', lastName: 'Smith', phone: '+1987654321' },
        select: expect.any(Object),
      });
    });

    it('only updates provided fields', async () => {
      prisma.user.update.mockImplementation(async ({ where, data }) => ({
        id: where.id,
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: null,
        role: 'USER',
      }));

      const result = await authService.updateMe('user-1', { firstName: 'Jane' });
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Doe');
    });
  });
});
