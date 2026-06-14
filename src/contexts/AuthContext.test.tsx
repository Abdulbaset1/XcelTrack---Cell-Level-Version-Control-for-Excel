import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import {
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { getDoc, setDoc } from 'firebase/firestore';

jest.mock('../firebase', () => ({
  auth: {},
  googleProvider: {},
  githubProvider: {},
  db: {},
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  signInWithPopup: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerification: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  GithubAuthProvider: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

describe('AuthContext', () => {
  let api: ReturnType<typeof useAuth> | undefined;

  const Consumer = () => {
    api = useAuth();
    return null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, cb) => {
      cb(null);
      return jest.fn();
    });
    global.fetch = jest.fn();
  });

  const renderProvider = () => render(<AuthProvider><Consumer /></AuthProvider>);

  it('logs in and resolves the user role', async () => {
    renderProvider();

    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: {
        uid: 'u1',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        emailVerified: true,
        metadata: { creationTime: 'now' },
      },
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ role: 'Admin' }) });

    await waitFor(() => expect(api).toBeDefined());

    await act(async () => {
      const user = await api!.login('test@example.com', 'secret');
      expect(user?.role).toBe('Admin');
    });

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'secret');
  });

  it('signs up a new user and syncs backend data', async () => {
    renderProvider();

    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: {
        uid: 'u2',
        email: 'new@example.com',
        displayName: null,
      },
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await waitFor(() => expect(api).toBeDefined());

    await act(async () => {
      const ok = await api!.signup('New User', 'new@example.com', 'password123');
      expect(ok).toBe(true);
    });

    expect(updateProfile).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalled();
  });

  it('supports logout and password reset actions', async () => {
    renderProvider();
    await waitFor(() => expect(api).toBeDefined());

    await act(async () => {
      await api!.logout();
      await api!.resetPassword('reset@example.com');
    });

    expect(firebaseSignOut).toHaveBeenCalled();
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'reset@example.com');
  });

  it('handles google login and verification email', async () => {
    renderProvider();

    (signInWithPopup as jest.Mock).mockResolvedValue({
      user: {
        uid: 'u3',
        email: 'google@example.com',
        displayName: 'Google User',
        photoURL: null,
        emailVerified: true,
        metadata: { creationTime: 'now' },
      },
    });
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false, data: () => ({}) });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ role: 'User' }) });

    await waitFor(() => expect(api).toBeDefined());

    await act(async () => {
      const user = await api!.loginWithGoogle();
      expect(user?.uid).toBe('u3');
      await api!.sendVerificationEmail();
    });

    expect(signInWithPopup).toHaveBeenCalled();
    expect(sendEmailVerification).not.toHaveBeenCalled();
  });

  it('handles github login with an existing user doc', async () => {
    renderProvider();

    (signInWithPopup as jest.Mock).mockResolvedValue({
      user: {
        uid: 'u4',
        email: 'github@example.com',
        displayName: 'GitHub User',
        photoURL: null,
        emailVerified: true,
        metadata: { creationTime: 'now' },
      },
    });
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => ({ role: 'Admin' }) });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ role: 'Admin' }) });

    await waitFor(() => expect(api).toBeDefined());

    await act(async () => {
      const user = await api!.loginWithGithub();
      expect(user?.uid).toBe('u4');
      expect(user?.role).toBe('Admin');
    });

    expect(signInWithPopup).toHaveBeenCalled();
    expect(GithubAuthProvider).toBeDefined();
  });

  it('does not send verification email when no user is signed in', async () => {
    renderProvider();
    await waitFor(() => expect(api).toBeDefined());

    await act(async () => {
      await api!.sendVerificationEmail();
      await api!.uploadProfilePicture(new File(['x'], 'avatar.png', { type: 'image/png' }));
    });

    expect(sendEmailVerification).not.toHaveBeenCalled();
  });

  it('throws when email login fails', async () => {
    renderProvider();

    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(new Error('bad login'));

    await waitFor(() => expect(api).toBeDefined());

    await expect(api!.login('bad@example.com', 'wrong')).rejects.toThrow('bad login');
  });
});