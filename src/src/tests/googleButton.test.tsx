import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import GoogleButton from '../components/GoogleButton';

// Mock the Google Identity Services API
const mockGoogleAPI = {
  accounts: {
    id: {
      initialize: jest.fn(),
      renderButton: jest.fn(),
      prompt: jest.fn(),
    },
  },
};

// Mock the apiGoogleLogin function
jest.mock('../api/auth', () => ({
  apiGoogleLogin: jest.fn(),
}));

import { apiGoogleLogin } from '../api/auth';
const mockApiGoogleLogin = apiGoogleLogin as jest.MockedFunction<typeof apiGoogleLogin>;

describe('GoogleButton', () => {
  let mockOnSuccess: jest.Mock;
  let mockOnError: jest.Mock;

  beforeEach(() => {
    mockOnSuccess = jest.fn();
    mockOnError = jest.fn();

    // Setup global window.google mock
    (global as any).window.google = mockGoogleAPI;

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    delete (global as any).window.google;
  });

  test('initializes Google API correctly', () => {
    render(<GoogleButton onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Check if Google API initialization is called
    expect(mockGoogleAPI.accounts.id.initialize).toHaveBeenCalled();

    // Check if the renderButton function is called
    expect(mockGoogleAPI.accounts.id.renderButton).toHaveBeenCalled();

    // Verify initialization config
    const initConfig = mockGoogleAPI.accounts.id.initialize.mock.calls[0][0];
    expect(initConfig).toHaveProperty('callback');
    expect(initConfig).toHaveProperty('auto_select', false);
    expect(initConfig).toHaveProperty('cancel_on_tap_outside', true);
  });

  test('calls onSuccess when google authentication succeeds', async () => {
    const mockUser = {
      id: 'google-user-123',
      email: 'googleuser@gmail.com',
      name: 'Google User',
      role: 'planner' as const,
      password: 'google-oauth' // Required by User type but not used for Google auth
    };

    const mockAuthResponse = {
      refresh: 'mock-refresh-token',
      access: 'mock-access-token',
      user: mockUser,
      is_new_user: false,
      login_provider: 'google'
    };

    mockApiGoogleLogin.mockResolvedValueOnce(mockAuthResponse);

    render(<GoogleButton onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Simulate the Google callback being triggered
    const initCall = mockGoogleAPI.accounts.id.initialize.mock.calls[0];
    const googleCallback = initCall[0].callback;

    // Simulate Google credential response
    await googleCallback({ credential: 'mock-google-id-token', select_by: 'btn' });

    await waitFor(() => {
      expect(mockApiGoogleLogin).toHaveBeenCalledWith('mock-google-id-token', undefined);
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  test('calls onError when google authentication fails', async () => {
    mockApiGoogleLogin.mockRejectedValueOnce(new Error('Google authentication failed'));

    render(<GoogleButton onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Simulate the Google callback being triggered
    const initCall = mockGoogleAPI.accounts.id.initialize.mock.calls[0];
    const googleCallback = initCall[0].callback;

    // Simulate Google credential response
    await googleCallback({ credential: 'invalid-token', select_by: 'btn' });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Google sign-in failed. Please try again.');
    });
  });

  test('includes role parameter when provided', async () => {
    const mockUser = {
      id: 'vendor-user-123',
      email: 'vendor@example.com',
      name: 'Vendor User',
      role: 'vendor' as const,
      password: 'google-oauth' // Required by User type but not used for Google auth
    };

    const mockAuthResponse = {
      refresh: 'mock-refresh-token',
      access: 'mock-access-token',
      user: mockUser,
      is_new_user: true,
      login_provider: 'google'
    };

    mockApiGoogleLogin.mockResolvedValueOnce(mockAuthResponse);

    render(<GoogleButton onSuccess={mockOnSuccess} onError={mockOnError} role="vendor" />);

    // Simulate the Google callback being triggered
    const initCall = mockGoogleAPI.accounts.id.initialize.mock.calls[0];
    const googleCallback = initCall[0].callback;

    // Simulate Google credential response
    await googleCallback({ credential: 'mock-google-id-token', select_by: 'btn' });

    await waitFor(() => {
      expect(mockApiGoogleLogin).toHaveBeenCalledWith('mock-google-id-token', 'vendor');
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
    });
  });
});