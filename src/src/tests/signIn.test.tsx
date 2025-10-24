import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SignIn from '../pages/SignIn';
import { AuthService } from '../services/AuthService';

// Mock the AuthService
jest.mock('../services/AuthService');
const MockedAuthService = AuthService as jest.MockedClass<typeof AuthService>;

// Mock the API functions
jest.mock('../api/auth', () => ({
  apiLogin: jest.fn(),
  apiUpdateUser: jest.fn(),
}));

// Mock SignUp component
jest.mock('../pages/SignUp', () => {
  return function MockSignUp({ onBackToSignIn }: { onBackToSignIn: () => void }) {
    return (
      <div data-testid="signup-page">
        <h1>Sign Up Page</h1>
        <button onClick={onBackToSignIn}>Back to Sign In</button>
      </div>
    );
  };
});

describe('SignIn Page', () => {
  let mockSignIn: jest.Mock;
  let user: any;

  beforeEach(() => {
    user = userEvent.setup();
    mockSignIn = jest.fn();
    MockedAuthService.mockImplementation(() => ({
      signIn: mockSignIn,
      requestPasswordReset: jest.fn(),
    } as any));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders signin form correctly', () => {
    render(<SignIn />);

    expect(screen.getByText('SiPanit')).toBeInTheDocument();
    expect(screen.getByText('Welcome back! Please sign in to continue')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/create account/i)).toBeInTheDocument();
  });

  test('shows error if fields empty on submit', async () => {
    render(<SignIn />);

    const button = screen.getByRole('button', { name: /sign in/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Please fill in both email and password fields')).toBeInTheDocument();
    });
  });

  test('shows error for invalid email format', async () => {
    render(<SignIn />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const button = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  test('submits when email and password provided', async () => {
    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'test@example.com',
      name: 'Test User',
      role: 'planner' as const
    };

    mockSignIn.mockResolvedValueOnce(mockUser);

    render(<SignIn />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const button = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(button);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Welcome back, Test User! Sign in successful.')).toBeInTheDocument();
    });
  });

  test('shows error when login fails', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<SignIn />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const button = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Please check your credentials and try again.')).toBeInTheDocument();
    });
  });

  test('shows loading state during signin', async () => {
    let resolveSignIn: (value: any) => void;
    const signInPromise = new Promise(resolve => {
      resolveSignIn = resolve;
    });

    mockSignIn.mockReturnValueOnce(signInPromise);

    render(<SignIn />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const button = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(button);

    // Check that button text changes to loading
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Signing In...' })).toBeInTheDocument();
    });

    // Check that button is disabled during loading
    await waitFor(() => {
      const signingInButton = screen.getByRole('button', { name: 'Signing In...' });
      expect(signingInButton).toHaveAttribute('disabled');
    });

    // Resolve to complete the test
    resolveSignIn!({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'planner'
    });
  });

  test('toggles password visibility', async () => {
    render(<SignIn />);

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButtons = screen.getAllByRole('button');
    const eyeToggleButton = toggleButtons.find(btn =>
      btn.className.includes('absolute right-3 top-9')
    );

    expect(passwordInput.type).toBe('password');

    if (eyeToggleButton) {
      await user.click(eyeToggleButton);
      expect(passwordInput.type).toBe('text');

      await user.click(eyeToggleButton);
      expect(passwordInput.type).toBe('password');
    }
  });

  test('opens forgot password modal', async () => {
    render(<SignIn />);

    const forgotPasswordLink = screen.getByText(/forgot password/i);
    await user.click(forgotPasswordLink);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
      expect(screen.getByText("Enter your email address and we'll send you a secure link to reset your password.")).toBeInTheDocument();
    });
  });

  test('validates forgot password form', async () => {
    render(<SignIn />);

    // Open forgot password modal
    const forgotPasswordLink = screen.getByText(/forgot password/i);
    await user.click(forgotPasswordLink);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    });

    // Use the button element instead of text
    const resetButton = screen.getByRole('button', { name: 'Send Reset Link' });
    await user.click(resetButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
    });
  });

  test('switches to signup page', async () => {
    render(<SignIn />);

    const createAccountButton = screen.getByText(/create account/i);
    await user.click(createAccountButton);

    await waitFor(() => {
      expect(screen.getByTestId('signup-page')).toBeInTheDocument();
      expect(screen.getByText('Sign Up Page')).toBeInTheDocument();
    });
  });

  test('switches back from signup to signin', async () => {
    render(<SignIn />);

    // Go to signup
    const createAccountButton = screen.getByText(/create account/i);
    await user.click(createAccountButton);

    await waitFor(() => {
      expect(screen.getByTestId('signup-page')).toBeInTheDocument();
    });

    // Go back to signin
    const backButton = screen.getByText('Back to Sign In');
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText('SiPanit')).toBeInTheDocument();
      expect(screen.queryByTestId('signup-page')).not.toBeInTheDocument();
    });
  });

  test('handles network error', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Login failed'));

    render(<SignIn />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const button = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Connection error. Please check your internet and try again.')).toBeInTheDocument();
    });
  });

  test('closes popup notification manually', async () => {
    render(<SignIn />);

    // Trigger an error to show popup
    const button = screen.getByRole('button', { name: /sign in/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Please fill in both email and password fields')).toBeInTheDocument();
    });

    // Find and click the close button (X button in the popup)
    const closeButtons = screen.getAllByRole('button');
    const popupCloseButton = closeButtons.find(btn =>
      btn.className.includes('text-red-500')
    );

    if (popupCloseButton) {
      await user.click(popupCloseButton);

      await waitFor(() => {
        expect(screen.queryByText('Please fill in both email and password fields')).not.toBeInTheDocument();
      });
    }
  });
});