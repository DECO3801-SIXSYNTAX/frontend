import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignUp from '../pages/SignUp';
import { AuthService } from '../services/AuthService';

jest.mock('../services/AuthService');
const MockedAuthService = AuthService as jest.MockedClass<typeof AuthService>;

describe('SignUp Page', () => {
  let mockSignUp: jest.Mock;
  let mockOnBackToSignIn: jest.Mock;
  let user: any;

  beforeEach(() => {
    user = userEvent.setup();
    mockSignUp = jest.fn();
    mockOnBackToSignIn = jest.fn();
    MockedAuthService.mockImplementation(() => ({
      signUp: mockSignUp,
    } as any));
    jest.clearAllMocks();
  });

  test('renders signup form correctly', () => {
    render(<SignUp onBackToSignIn={mockOnBackToSignIn} />);
    
    expect(screen.getByText('Join SiPanit')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByText(/event planner/i)).toBeInTheDocument();
    expect(screen.getByText(/service vendor/i)).toBeInTheDocument();
  });

  test('shows planner fields when planner role selected', async () => {
    render(<SignUp onBackToSignIn={mockOnBackToSignIn} />);
    
    const plannerButton = screen.getByText(/event planner/i);
    await user.click(plannerButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/experience level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/event specialty/i)).toBeInTheDocument();
    });
  });

  test('hides planner fields when vendor role selected', async () => {
    render(<SignUp onBackToSignIn={mockOnBackToSignIn} />);
    
    // First select planner to show fields
    const plannerButton = screen.getByText(/event planner/i);
    await user.click(plannerButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    });
    
    // Then select vendor
    const vendorButton = screen.getByText(/service vendor/i);
    await user.click(vendorButton);
    
    await waitFor(() => {
      expect(screen.queryByLabelText(/company/i)).not.toBeInTheDocument();
    });
  });

  test('validates required fields for vendor', async () => {
    render(<SignUp onBackToSignIn={mockOnBackToSignIn} />);
    
    const vendorButton = screen.getByText(/service vendor/i);
    await user.click(vendorButton);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
    });
  });

  test('creates vendor account successfully', async () => {
    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'vendor@test.com',
      name: 'Test Vendor',
      role: 'vendor' as const
    };
    
    mockSignUp.mockResolvedValueOnce(mockUser);
    
    render(<SignUp onBackToSignIn={mockOnBackToSignIn} />);
    
    // Select vendor role
    const vendorButton = screen.getByText(/service vendor/i);
    await user.click(vendorButton);
    
    // Fill form
    await user.type(screen.getByLabelText(/full name/i), 'Test Vendor');
    await user.type(screen.getByLabelText(/email address/i), 'vendor@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        name: 'Test Vendor',
        email: 'vendor@test.com',
        password: 'password123',
        role: 'vendor'
      });
    });
  });

  test('navigates back to signin', async () => {
    render(<SignUp onBackToSignIn={mockOnBackToSignIn} />);
    
    const signInLink = screen.getByText(/sign in/i);
    await user.click(signInLink);
    
    expect(mockOnBackToSignIn).toHaveBeenCalled();
  });
});