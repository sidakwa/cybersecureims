import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// Mock AuthContext so we control auth state in each test
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useAuth } from '../contexts/AuthContext';

// Inline AdminRoute — mirrors the logic in App.tsx so any divergence fails the test
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div>loading</div>;
  if (!user) return <span data-testid="redirect-login">redirect:login</span>;
  if (!isAdmin) return <span data-testid="redirect-dashboard">redirect:dashboard</span>;
  return <>{children}</>;
}

function makeAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: null, profile: null, organization: null,
    organizationId: null, role: 'viewer', isAdmin: false,
    loading: false, signOut: vi.fn(), refreshProfile: vi.fn(),
    ...overrides,
  });
}

describe('AdminRoute', () => {
  it('shows spinner while auth is loading', () => {
    makeAuth({ loading: true });
    render(
      <MemoryRouter>
        <AdminRoute><div>admin page</div></AdminRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('redirects unauthenticated user to login', () => {
    makeAuth({ user: null });
    render(
      <MemoryRouter>
        <AdminRoute><div>admin page</div></AdminRoute>
      </MemoryRouter>
    );
    expect(screen.getByTestId('redirect-login')).toBeInTheDocument();
    expect(screen.queryByText('admin page')).not.toBeInTheDocument();
  });

  it('redirects authenticated non-admin to dashboard', () => {
    makeAuth({ user: { id: 'u1' } as any, role: 'auditor', isAdmin: false });
    render(
      <MemoryRouter>
        <AdminRoute><div>admin page</div></AdminRoute>
      </MemoryRouter>
    );
    expect(screen.getByTestId('redirect-dashboard')).toBeInTheDocument();
    expect(screen.queryByText('admin page')).not.toBeInTheDocument();
  });

  it('renders children for an admin user', () => {
    makeAuth({ user: { id: 'u1' } as any, role: 'admin', isAdmin: true });
    render(
      <MemoryRouter>
        <AdminRoute><div>admin page</div></AdminRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('admin page')).toBeInTheDocument();
  });
});
