import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

const MockNavigate = vi.fn(() => null);
vi.mock('react-router-dom', () => ({
  Navigate: (props) => MockNavigate(props),
  useLocation: () => ({ pathname: '/test' }),
}));

import ProtectedRoute from '../../components/ProtectedRoute';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../context/AuthContext';

describe('ProtectedRoute', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders children when authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: 'USER' },
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('calls Navigate when not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(MockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/login', replace: true, state: expect.any(Object) })
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('calls Navigate for non-admin users on admin routes', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: 'USER' },
    });

    render(
      <ProtectedRoute adminOnly>
        <div>Admin Dashboard</div>
      </ProtectedRoute>
    );

    expect(MockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/', replace: true })
    );
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('allows admin users to access admin routes', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: 'ADMIN' },
    });

    render(
      <ProtectedRoute adminOnly>
        <div>Admin Dashboard</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
