const API_URL = 'http://localhost:5000/api';

export const uploadWorkbook = async (file: File, ownerId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('owner_id', ownerId);

    const response = await fetch(`${API_URL}/workbooks/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload workbook');
    }

    return response.json();
};

export const getWorkbooks = async (ownerId: string) => {
    const response = await fetch(`${API_URL}/workbooks?owner_id=${ownerId}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch workbooks');
    }
    return response.json();
};

export const getWorkbookData = async (workbookId: string) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch workbook data');
    }
    return response.json();
};

export const downloadWorkbook = async (workbookId: string, fileName: string) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/download`);
    if (!response.ok) {
        throw new Error('Failed to download workbook');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

// ============================================
// VERSION CONTROL API
// ============================================

export interface Commit {
    id: number;
    workbook_id: number;
    user_id: string;
    message: string;
    timestamp: string;
    hash: string;
    changes_count?: number;
}

export interface CellChange {
    id: number;
    commit_id: number;
    cell_id: number;
    address: string;
    row_idx: number;
    col_idx: number;
    worksheet_name: string;
    value: string | null;
    formula: string | null;
    style: any;
}

export interface CommitDetails {
    commit: Commit;
    changes: CellChange[];
}

// Create a new commit (snapshot)
export const createCommit = async (workbook_id: number, user_id: string, message?: string) => {
    const response = await fetch(`${API_URL}/commits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workbook_id, user_id, message }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create commit');
    }

    return response.json();
};

// Get commit history for a workbook
export const getCommitHistory = async (workbook_id: number, limit: number = 50, offset: number = 0): Promise<{ commits: Commit[] }> => {
    const response = await fetch(`${API_URL}/workbooks/${workbook_id}/commits?limit=${limit}&offset=${offset}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch commit history');
    }

    return response.json();
};

// Get all commits for a user (Global Activity)
export const getUserCommits = async (userId: string, limit: number = 50, offset: number = 0): Promise<{ commits: (Commit & { workbook_name: string })[] }> => {
    const response = await fetch(`${API_URL}/commits?user_id=${userId}&limit=${limit}&offset=${offset}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user commits');
    }

    return response.json();
};

// Get detailed commit information
export const getCommitDetails = async (commit_id: number): Promise<CommitDetails> => {
    const response = await fetch(`${API_URL}/commits/${commit_id}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch commit details');
    }

    return response.json();
};

// Get a full snapshot of the workbook at a specific commit
export const getCommitSnapshot = async (commit_id: number) => {
    const response = await fetch(`${API_URL}/commits/${commit_id}/snapshot`);
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch commit snapshot');
    }
    return response.json();
};

// Rollback workbook to a specific commit
export const rollbackToCommit = async (workbook_id: number, commit_id: number, user_id: string) => {
    const response = await fetch(`${API_URL}/workbooks/${workbook_id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commit_id, user_id }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rollback');
    }

    return response.json();
};

// ============================================
// WORKSHEET MANAGEMENT API
// ============================================

export const createWorksheet = async (workbookId: string, name: string, order: number) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, order }),
    });
    if (!response.ok) throw new Error('Failed to create worksheet');
    return response.json();
};

export const renameWorksheet = async (workbookId: string, sheetId: string, name: string) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/sheets/${sheetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to rename worksheet');
    return response.json();
};

export const deleteWorksheet = async (workbookId: string, sheetId: string) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/sheets/${sheetId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete worksheet');
    return response.json();
};

export const reorderWorksheets = async (workbookId: string, orders: { id: string; order: number }[]) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/sheets/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
    });
    if (!response.ok) throw new Error('Failed to reorder worksheets');
    return response.json();
};
