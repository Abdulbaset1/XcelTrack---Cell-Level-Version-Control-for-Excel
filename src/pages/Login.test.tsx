import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from './Login';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}), { virtual: true });

describe('Login', () => {
  const mockNavigate = jest.fn();
  const mockLogin = jest.fn();
  const mockSignup = jest.fn();
  const mockLoginWithGoogle = jest.fn();
  const mockLoginWithGithub = jest.fn();
  const mockResetPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      signup: mockSignup,
      loginWithGoogle: mockLoginWithGoogle,
      loginWithGithub: mockLoginWithGithub,
      resetPassword: mockResetPassword,
    });
  });

  it('shows validation errors and disables submit until valid', async () => {
    render(<Login onSwitchToSignup={jest.fn()} />);

    const submitButton = screen.getByRole('button', { name: /^sign in$/i });
    expect(submitButton).toBeDisabled();

    fireEvent.blur(screen.getByLabelText(/email address/i));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret123' } });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it('logs in and navigates to dashboard for regular users', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'User' });

    render(<Login onSwitchToSignup={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'secret123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows login failure message when credentials are invalid', async () => {
    mockLogin.mockRejectedValueOnce(new Error('invalid credentials'));

    render(<Login onSwitchToSignup={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrong-pass' } });
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('signs in with Google and GitHub buttons', async () => {
    mockLoginWithGoogle.mockResolvedValueOnce({ role: 'User' });
    mockLoginWithGithub.mockResolvedValueOnce({ role: 'admin' });

    render(<Login onSwitchToSignup={jest.fn()} />);

    fireEvent.click(screen.getByLabelText(/sign in with google/i));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));

    mockNavigate.mockClear();
    fireEvent.click(screen.getByLabelText(/sign in with github/i));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
  });

  it('resets password and shows helper message', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);

    render(<Login onSwitchToSignup={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'reset@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /forgot your password/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('reset@example.com');
      expect(screen.getByText('Password reset email sent! Check your inbox.')).toBeInTheDocument();
    });
  });

  it('requires email before password reset', async () => {
    render(<Login onSwitchToSignup={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /forgot your password/i }));

    await waitFor(() => {
      expect(screen.getByText('Please enter your email address above to reset your password.')).toBeInTheDocument();
    });
  });

  // Test/admin flows removed from UI; no tests for them anymore
});