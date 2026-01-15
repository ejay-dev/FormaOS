// __tests__/auth/auth-flows.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import SignInForm from '@/components/auth/SignInForm';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@supabase/auth-helpers-nextjs');

const mockPush = jest.fn();
const mockSupabase = {
  auth: {
    signInWithOAuth: jest.fn(),
    signInWithPassword: jest.fn(),
    getSession: jest.fn(),
  },
};

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase);
});

describe('Authentication Flows', () => {
  describe('Google OAuth Flow', () => {
    it('should initiate Google OAuth correctly', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        error: null,
        data: { url: 'https://accounts.google.com/oauth' },
      });

      render(<SignInForm />);

      const googleButton = screen.getByRole('button', {
        name: /continue with google/i,
      });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: expect.stringContaining('/auth/callback'),
          },
        });
      });
    });

    it('should handle OAuth errors gracefully', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        error: { message: 'OAuth failed' },
        data: null,
      });

      render(<SignInForm />);

      const googleButton = screen.getByRole('button', {
        name: /continue with google/i,
      });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText(/oauth failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Email/Password Flow', () => {
    it('should sign in with valid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        error: null,
        data: { user: { id: '123', email: 'test@example.com' } },
      });

      render(<SignInForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should show validation errors for invalid email', async () => {
      render(<SignInForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'invalid-email' },
      });
      fireEvent.blur(screen.getByLabelText(/email/i));

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email/i),
        ).toBeInTheDocument();
      });
    });

    it('should handle authentication errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        error: { message: 'Invalid login credentials' },
        data: { user: null },
      });

      render(<SignInForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/invalid login credentials/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('should redirect authenticated users from auth pages', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: '123', email: 'test@example.com' },
            access_token: 'token',
          },
        },
      });

      render(<SignInForm />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });
});
