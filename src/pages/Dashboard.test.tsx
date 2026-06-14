import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  createEmptyWorkbook,
  downloadWorkbook,
  addWorkbookCollaborator,
  getRegisteredUsers,
  getWorkbookCollaborators,
  renameWorkbook,
  getProfileSummary,
  getUserCommits,
  getWorkbooks,
} from '../services/api';

jest.mock('../contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../contexts/ToastContext', () => ({ useToast: jest.fn() }));
jest.mock('../components/FileUploadModal', () => () => null);
jest.mock('../components/SkeletonLoader', () => () => <div>Loading...</div>);

jest.mock('../services/api', () => ({
  getWorkbooks: jest.fn(),
  getProfileSummary: jest.fn(),
  uploadWorkbook: jest.fn(),
  createEmptyWorkbook: jest.fn(),
  downloadWorkbook: jest.fn(),
  getUserCommits: jest.fn(),
  getRegisteredUsers: jest.fn(),
  addWorkbookCollaborator: jest.fn(),
  getWorkbookCollaborators: jest.fn(),
  removeWorkbookCollaborator: jest.fn(),
  renameWorkbook: jest.fn(),
  deleteWorkbook: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  Link: ({ children }: any) => <a>{children}</a>,
}), { virtual: true });

describe('Dashboard', () => {
  const mockNavigate = jest.fn();
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'user-1', email: 'test@example.com' } });

    (getWorkbooks as jest.Mock).mockResolvedValue([]);
    (getProfileSummary as jest.Mock).mockResolvedValue({
      stats: {
        storageUsedBytes: 1024,
        storageLimitBytes: 2048,
        storageUsagePercent: 50,
      },
    });
    (getUserCommits as jest.Mock).mockResolvedValue({ commits: [] });
    (getRegisteredUsers as jest.Mock).mockResolvedValue([{ firebase_uid: 'collab-1', email: 'collab@example.com', name: 'Collaborator' }]);
    (getWorkbookCollaborators as jest.Mock).mockResolvedValue({ collaborators: [] });
  });

  it('creates a new workbook', async () => {
    (createEmptyWorkbook as jest.Mock).mockResolvedValue({ workbook: { id: 55 } });

    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText(/new spreadsheet/i)).toBeInTheDocument());

    fireEvent.click(screen.getAllByText(/new spreadsheet/i)[0]);

    await waitFor(() => {
      expect(createEmptyWorkbook).toHaveBeenCalledWith('user-1');
      expect(mockShowToast).toHaveBeenCalledWith('New spreadsheet created', 'success');
      expect(mockNavigate).toHaveBeenCalledWith('/editor/55');
    });
  });

  it('downloads a workbook from the list', async () => {
    (getWorkbooks as jest.Mock).mockResolvedValue([
      {
        id: 9,
        name: 'Budget.xlsx',
        updated_at: new Date().toISOString(),
        is_owner: true,
      },
    ]);

    (downloadWorkbook as jest.Mock).mockResolvedValue(undefined);

    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText('Budget.xlsx')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Download as Excel'));

    await waitFor(() => {
      expect(downloadWorkbook).toHaveBeenCalledWith(9, 'Budget.xlsx', 'user-1');
      expect(mockShowToast).toHaveBeenCalledWith('Preparing download for Budget.xlsx...', 'info');
      expect(mockShowToast).toHaveBeenCalledWith('Download started successfully', 'success');
    });
  });

  it('renames a workbook successfully', async () => {
    (getWorkbooks as jest.Mock).mockResolvedValue([
      {
        id: 14,
        name: 'Old Name.xlsx',
        updated_at: new Date().toISOString(),
        is_owner: true,
      },
    ]);
    (renameWorkbook as jest.Mock).mockResolvedValue({ workbook: { id: 14, name: 'New Name.xlsx' } });
    (window.prompt as unknown as jest.Mock) = jest.fn(() => 'New Name');
    (window.confirm as unknown as jest.Mock) = jest.fn(() => true);

    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText('Old Name.xlsx')).toBeInTheDocument());
    fireEvent.click(screen.getByTitle('More actions'));
    fireEvent.click(screen.getByText('Rename file'));

    await waitFor(() => {
      expect(renameWorkbook).toHaveBeenCalledWith(14, 'user-1', 'New Name.xlsx');
      expect(mockShowToast).toHaveBeenCalledWith('Workbook renamed successfully', 'success');
    });
  });

  it('warns when rename name is empty', async () => {
    (getWorkbooks as jest.Mock).mockResolvedValue([
      {
        id: 15,
        name: 'Empty Check.xlsx',
        updated_at: new Date().toISOString(),
        is_owner: true,
      },
    ]);
    (window.prompt as unknown as jest.Mock) = jest.fn(() => '   ');

    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText('Empty Check.xlsx')).toBeInTheDocument());
    fireEvent.click(screen.getByTitle('More actions'));
    fireEvent.click(screen.getByText('Rename file'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('File name cannot be empty', 'warning');
    });
  });

  it('opens collaborator modal and adds a collaborator', async () => {
    (getWorkbooks as jest.Mock).mockResolvedValue([
      {
        id: 16,
        name: 'Shared Sheet.xlsx',
        updated_at: new Date().toISOString(),
        is_owner: true,
      },
    ]);
    (addWorkbookCollaborator as jest.Mock).mockResolvedValue({ collaborator: { user_id: 'collab-1' } });

    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText('Shared Sheet.xlsx')).toBeInTheDocument());
    fireEvent.click(screen.getByTitle('More actions'));
    fireEvent.click(screen.getByText('Add collaborator'));

    await waitFor(() => expect(screen.getByPlaceholderText(/search registered users/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/search registered users/i), { target: { value: 'collab' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(addWorkbookCollaborator).toHaveBeenCalledWith(16, 'user-1', 'collab-1');
      expect(mockShowToast).toHaveBeenCalledWith('Collaborator added successfully', 'success');
    });
  });

  it('warns when collaborator modal is opened for a non-owner file', async () => {
    (getWorkbooks as jest.Mock).mockResolvedValue([
      {
        id: 17,
        name: 'Shared By Others.xlsx',
        updated_at: new Date().toISOString(),
        is_owner: false,
        owner_name: 'Owner Name',
      },
    ]);

    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText('Shared By Others.xlsx')).toBeInTheDocument());
    fireEvent.click(screen.getByTitle('More actions'));
    fireEvent.click(screen.getByText('Add collaborator'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Only the file owner can add collaborators', 'warning');
    });
  });

  it('warns when creating a workbook without an authenticated user', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    render(<Dashboard />);

    fireEvent.click(screen.getAllByText(/new spreadsheet/i)[0]);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('You must be logged in to create a spreadsheet', 'warning');
    });
  });

  it('shows a dashboard error when workbook fetch fails', async () => {
    (getWorkbooks as jest.Mock).mockRejectedValueOnce(new Error('network down'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('network down')).toBeInTheDocument();
    });
  });

  it('shows an error toast when download fails', async () => {
    (getWorkbooks as jest.Mock).mockResolvedValue([
      {
        id: 12,
        name: 'Broken.xlsx',
        updated_at: new Date().toISOString(),
        is_owner: true,
      },
    ]);
    (downloadWorkbook as jest.Mock).mockRejectedValueOnce(new Error('download failed'));

    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText('Broken.xlsx')).toBeInTheDocument());
    fireEvent.click(screen.getByTitle('Download as Excel'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to download workbook', 'error');
    });
  });
});