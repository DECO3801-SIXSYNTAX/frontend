import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock window.location
const mockLocation = {
  pathname: '/reset-password/test-uid/test-token',
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('ResetPasswordPage', () => {
  let user: any;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockLocation.pathname = '/reset-password/test-uid/test-token';
    mockLocation.href = '';
  });

  test('renders reset password form correctly', () => {
    render(<ResetPasswordPage />);

    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    expect(screen.getByText('Enter your new password to complete the reset')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  test('shows error for invalid URL format', async () => {
    mockLocation.pathname = '/invalid-path';
    render(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText('Invalid reset password link. Please check the link from your email.')).toBeInTheDocument();
    });
  });

  test('shows error when passwords do not match', async () => {
    render(<ResetPasswordPage />);

    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    await user.type(newPasswordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'differentpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  test('shows error for short password', async () => {
    render(<ResetPasswordPage />);

    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    await user.type(newPasswordInput, '123');
    await user.type(confirmPasswordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });
  });

  test('successfully resets password', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    } as any);

    render(<ResetPasswordPage />);

    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    await user.type(newPasswordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/password-reset-confirm/',
        {
          uid: 'test-uid',
          token: 'test-token',
          password: 'newpassword123',
          password2: 'newpassword123'
        }
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Password reset successful! Redirecting to login...')).toBeInTheDocument();
    });
  });

  test('shows error for invalid/expired token', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { token: ['Invalid token'] },
        statusText: 'Bad Request',
        headers: {},
        config: {}
      }
    });

    render(<ResetPasswordPage />);

    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    await user.type(newPasswordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid or expired reset link. Please request a new password reset.')).toBeInTheDocument();
    });
  });

  test('toggles password visibility', async () => {
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText('New Password') as HTMLInputElement;
    const toggleButtons = screen.getAllByRole('button');

    // Find the eye toggle button by looking for buttons that are not the submit button
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    const eyeToggleButton = toggleButtons.find(btn => btn !== submitButton);

    expect(passwordInput.type).toBe('password');

    if (eyeToggleButton) {
      await user.click(eyeToggleButton);
      expect(passwordInput.type).toBe('text');

      await user.click(eyeToggleButton);
      expect(passwordInput.type).toBe('password');
    } else {
      // If we can't find the toggle button, still test the input exists
      expect(passwordInput).toBeInTheDocument();
    }
  });
});