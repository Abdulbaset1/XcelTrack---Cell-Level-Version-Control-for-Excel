import {
  addWorkbookCollaborator,
  createEmptyWorkbook,
  deleteWorkbook,
  downloadWorkbook,
  getProfileSummary,
  getRegisteredUsers,
  getWorkbookCollaborators,
  getWorkbookData,
  getWorkbooks,
  renameWorkbook,
  updateProfileDetails,
} from './api';

describe('api service wrappers', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    global.fetch = jest.fn();
  });

  it('creates a workbook with the expected payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ workbook: { id: 1 } }),
    });

    await createEmptyWorkbook('owner-1', 'Sheet 1');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/workbooks/create',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws a descriptive error on profile summary failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'no access' }),
    });

    await expect(getProfileSummary('user-1')).rejects.toThrow('no access');
  });

  it('builds the correct query string for workbook fetches', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ([]),
    });

    await getWorkbooks('user-1');
    await getRegisteredUsers('user-1');
    await getWorkbookData('55', 'user-1');

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/workbooks?owner_id=user-1&requester_id=user-1');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/users?requester_id=user-1');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/workbooks/55?requester_id=user-1');
  });

  it('renames and deletes workbooks', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });

    await renameWorkbook(10, 'user-1', 'Budget');
    await deleteWorkbook(10, 'user-1');

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/workbooks/10', expect.objectContaining({ method: 'PUT' }));
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/workbooks/10?requester_id=user-1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('adds collaborators and fetches collaborator lists', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ collaborators: [] }) });

    await addWorkbookCollaborator(7, 'owner-1', 'collab-1');
    await getWorkbookCollaborators(7, 'owner-1');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/workbooks/7/collaborators',
      expect.objectContaining({ method: 'POST' })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/workbooks/7/collaborators?requester_id=owner-1'
    );
  });

  it('downloads workbook files through the DOM', async () => {
    const click = jest.fn();
    const anchor = { href: '', download: '', click } as any;

    jest.spyOn(document, 'createElement').mockReturnValue(anchor);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => anchor as any);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => anchor as any);
    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalRevokeObjectURL = window.URL.revokeObjectURL;
    window.URL.createObjectURL = jest.fn(() => 'blob:mock') as any;
    window.URL.revokeObjectURL = jest.fn() as any;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['x']),
    });

    await downloadWorkbook('99', 'report.xlsx', 'user-1');

    expect(click).toHaveBeenCalled();
    expect(anchor.download).toBe('report.xlsx');

    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('surfaces errors for workbook creation and collaborator operations', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'create failed' }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'collab failed' }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'remove failed' }) });

    await expect(createEmptyWorkbook('owner-1')).rejects.toThrow('create failed');
    await expect(addWorkbookCollaborator(1, 'owner-1', 'collab-1')).rejects.toThrow('collab failed');
    await expect(getWorkbookCollaborators(1, 'owner-1')).rejects.toThrow('remove failed');
  });

  it('throws when download fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    await expect(downloadWorkbook('1', 'file.xlsx', 'user-1')).rejects.toThrow('Failed to download workbook');
  });
});