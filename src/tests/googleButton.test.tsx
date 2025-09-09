import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import GoogleButton from '../components/GoogleButton';
import { AuthService } from '../services/AuthService';

jest.mock('../services/AuthService');

describe('GoogleButton', () => {
  let mockSignIn: jest.Mock;
  let mockOnSuccess: jest.Mock;
  let mockOnError: jest.Mock;

  beforeEach(() => {
    mockSignIn = jest.fn();
    mockOnSuccess = jest.fn();
    mockOnError = jest.fn();
    
    (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => ({
      signIn: mockSignIn,
    } as any));
  });

  test('renders google button correctly', () => {
    render(<GoogleButton onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByAltText('Google')).toBeInTheDocument();
  });

  test('calls onSuccess when google login succeeds', async () => {
    const user = userEvent.setup();
    const mockUser = { email: 'googleuser@gmail.com', name: 'Google User' };
    
    mockSignIn.mockResolvedValueOnce(mockUser);
    
    render(<GoogleButton onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    const button = screen.getByText('Continue with Google');
    await user.click(button);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('googleuser@gmail.com');
    });
  });

  test('calls onError when google login fails', async () => {
    const user = userEvent.setup();
    
    mockSignIn.mockRejectedValueOnce(new Error('Google login failed'));
    
    render(<GoogleButton onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    const button = screen.getByText('Continue with Google');
    await user.click(button);
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Google login failed');
    });
  });
});