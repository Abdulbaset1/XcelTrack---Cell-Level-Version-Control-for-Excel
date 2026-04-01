import React, { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Navbar from './Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import {
  clearNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api';

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('../contexts/WebSocketContext', () => ({
  useWebSocket: jest.fn(),
}));

jest.mock('../services/api', () => ({
  getNotifications: jest.fn(),
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  clearNotification: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}), { virtual: true });

describe('Navbar notifications', () => {
  const mockToggleTheme = jest.fn();
  const mockLogout = jest.fn();
  const mockSocketEmit = jest.fn();
  const mockSocketOff = jest.fn();
  let notificationHandler: ((event: any) => void) | undefined;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (useAuth as jest.Mock).mockReturnValue({
      user: {
        uid: 'user-1',
        name: 'Test User',
        photoURL: null,
      },
      logout: mockLogout,
    });

    (useTheme as jest.Mock).mockReturnValue({
      toggleTheme: mockToggleTheme,
      isDark: false,
    });

    (useWebSocket as jest.Mock).mockReturnValue({
      socket: {
        emit: mockSocketEmit,
        on: jest.fn((event: string, callback: (payload: any) => void) => {
          if (event === 'notification:new') {
            notificationHandler = callback;
          }
        }),
        off: mockSocketOff,
      },
    });

    (getNotifications as jest.Mock).mockResolvedValue({
      notifications: [],
    });

    (markNotificationRead as jest.Mock).mockResolvedValue({ message: 'ok' });
    (markAllNotificationsRead as jest.Mock).mockResolvedValue({ message: 'ok' });
    (clearNotification as jest.Mock).mockResolvedValue({ message: 'ok' });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('loads notifications and subscribes user channel', async () => {
    render(<Navbar toggleSidebar={jest.fn()} isSidebarOpen={true} />);

    await waitFor(() => {
      expect(getNotifications).toHaveBeenCalledWith('user-1', 30, 0, false);
    });

    expect(mockSocketEmit).toHaveBeenCalledWith('join-user-channel', { userId: 'user-1' });
  });

  test('adds realtime notification and avoids duplicates by id', async () => {
    render(<Navbar toggleSidebar={jest.fn()} isSidebarOpen={true} />);

    await waitFor(() => {
      expect(notificationHandler).toBeDefined();
    });

    fireEvent.click(screen.getByLabelText('Notifications'));

    await act(async () => {
      notificationHandler?.({
        id: 999,
        type: 'info',
        title: 'Realtime Alert',
        message: 'Conflict resolved',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    });

    await act(async () => {
      notificationHandler?.({
        id: 999,
        type: 'info',
        title: 'Realtime Alert',
        message: 'Conflict resolved',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Realtime Alert')).toBeInTheDocument();
      expect(screen.getAllByText('Realtime Alert')).toHaveLength(1);
    });
  });

  test('marks single notification as read', async () => {
    (getNotifications as jest.Mock).mockResolvedValue({
      notifications: [
        {
          id: 42,
          user_id: 'user-1',
          type: 'info',
          title: 'Needs Read',
          message: 'Please open this',
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ],
    });

    render(<Navbar toggleSidebar={jest.fn()} isSidebarOpen={true} />);

    await waitFor(() => {
      expect(getNotifications).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByLabelText('Notifications'));

    await waitFor(() => {
      expect(screen.getByText('Needs Read')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Needs Read'));

    await waitFor(() => {
      expect(markNotificationRead).toHaveBeenCalledWith('user-1', 42);
    });
  });

  test('marks all notifications as read', async () => {
    (getNotifications as jest.Mock).mockResolvedValue({
      notifications: [
        {
          id: 11,
          user_id: 'user-1',
          type: 'info',
          title: 'Unread One',
          message: 'First message',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 12,
          user_id: 'user-1',
          type: 'warning',
          title: 'Unread Two',
          message: 'Second message',
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ],
    });

    render(<Navbar toggleSidebar={jest.fn()} isSidebarOpen={true} />);

    await waitFor(() => {
      expect(getNotifications).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByLabelText('Notifications'));

    await waitFor(() => {
      expect(screen.getByText('Mark all as read')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Mark all as read'));

    await waitFor(() => {
      expect(markAllNotificationsRead).toHaveBeenCalledWith('user-1');
    });
  });

  test('clears a notification', async () => {
    (getNotifications as jest.Mock).mockResolvedValue({
      notifications: [
        {
          id: 21,
          user_id: 'user-1',
          type: 'info',
          title: 'Clear Me',
          message: 'Dismiss this item',
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ],
    });

    render(<Navbar toggleSidebar={jest.fn()} isSidebarOpen={true} />);

    await waitFor(() => {
      expect(getNotifications).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByLabelText('Notifications'));

    await waitFor(() => {
      expect(screen.getByText('Clear Me')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Clear'));

    await waitFor(() => {
      expect(clearNotification).toHaveBeenCalledWith('user-1', 21);
    });
  });

  test('handles notifications load failure gracefully', async () => {
    (getNotifications as jest.Mock).mockRejectedValueOnce(new Error('load failed'));

    render(<Navbar toggleSidebar={jest.fn()} isSidebarOpen={true} />);

    await waitFor(() => {
      expect(getNotifications).toHaveBeenCalledWith('user-1', 30, 0, false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load notifications:', expect.any(Error));
    });

    fireEvent.click(screen.getByLabelText('Notifications'));

    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });
  });

  test('handles mark read, mark all, and clear failures gracefully', async () => {
    (getNotifications as jest.Mock).mockResolvedValue({
      notifications: [
        {
          id: 31,
          user_id: 'user-1',
          type: 'info',
          title: 'Unread One',
          message: 'First message',
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ],
    });

    (markNotificationRead as jest.Mock).mockRejectedValueOnce(new Error('mark failed'));
    (markAllNotificationsRead as jest.Mock).mockRejectedValueOnce(new Error('mark all failed'));
    (clearNotification as jest.Mock).mockRejectedValueOnce(new Error('clear failed'));

    render(<Navbar toggleSidebar={jest.fn()} isSidebarOpen={true} />);

    await waitFor(() => {
      expect(getNotifications).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByLabelText('Notifications'));

    await waitFor(() => {
      expect(screen.getByText('Unread One')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Unread One'));

    await waitFor(() => {
      expect(markNotificationRead).toHaveBeenCalledWith('user-1', 31);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to mark notification as read:', expect.any(Error));
    });

    fireEvent.click(screen.getByText('Mark all as read'));

    await waitFor(() => {
      expect(markAllNotificationsRead).toHaveBeenCalledWith('user-1');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to mark all notifications as read:', expect.any(Error));
    });

    fireEvent.click(screen.getByText('Clear'));

    await waitFor(() => {
      expect(clearNotification).toHaveBeenCalledWith('user-1', 31);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to clear notification:', expect.any(Error));
    });
  });
});
