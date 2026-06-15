export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

export const createEmptyWorkbook = async (ownerId: string, name?: string) => {
    const response = await fetch(`${API_URL}/workbooks/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: ownerId, name }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create workbook');
    }

    return response.json();
};

export const getWorkbooks = async (ownerId: string) => {
    const response = await fetch(`${API_URL}/workbooks?owner_id=${ownerId}&requester_id=${ownerId}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch workbooks');
    }
    return response.json();
};

export interface ProfileSummaryStats {
    excelFiles: number;
    collaborations: number;
    revisions: number;
    storageUsedBytes: number;
    storageLimitBytes: number;
    storageRemainingBytes: number;
    storageUsagePercent: number;
}

export interface ProfileSummaryActivityItem {
    id: number;
    action: string;
    file: string;
    message: string;
    timestamp: string;
    workbook_id: number;
    changes_count: number;
    hash: string;
}

export interface ProfileSummaryResponse {
    user: {
        uid: string;
        email: string;
        name: string;
        role: string;
        created_at: string;
    };
    stats: ProfileSummaryStats;
    recentActivity: ProfileSummaryActivityItem[];
}

export const getProfileSummary = async (
    requesterId: string,
    userId?: string
): Promise<ProfileSummaryResponse> => {
    const params = new URLSearchParams({ requester_id: requesterId });
    if (userId) params.set('user_id', userId);

    const response = await fetch(`${API_URL}/profile/summary?${params.toString()}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch profile summary');
    }
    return response.json();
};

export const updateProfileDetails = async (
    requesterId: string,
    payload: { user_id?: string; name: string }
): Promise<{ user: { firebase_uid: string; email: string; name: string; role: string; created_at: string } }> => {
    const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId, ...payload }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update profile');
    }

    return response.json();
};

export interface UserSettingsResponse {
    settings: {
        user_id: string;
        auto_save_interval: number;
        version_history_limit: number;
        email_alerts: boolean;
        collaboration_invites: boolean;
        public_profile: boolean;
        updated_at: string;
    };
}

export const getUserSettings = async (requesterId: string, userId?: string): Promise<UserSettingsResponse> => {
    const params = new URLSearchParams({ requester_id: requesterId });
    if (userId) params.set('user_id', userId);

    const response = await fetch(`${API_URL}/settings?${params.toString()}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch settings');
    }
    return response.json();
};

export const updateUserSettings = async (
    requesterId: string,
    payload: {
        user_id?: string;
        auto_save_interval: number;
        version_history_limit: number;
        email_alerts: boolean;
        collaboration_invites: boolean;
        public_profile: boolean;
    }
): Promise<UserSettingsResponse> => {
    const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId, ...payload }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update settings');
    }
    return response.json();
};

export interface RegisteredUser {
    firebase_uid: string;
    email: string;
    name: string;
    role?: string;
    created_at?: string;
}

export const getRegisteredUsers = async (requesterId: string): Promise<RegisteredUser[]> => {
    const response = await fetch(`${API_URL}/users?requester_id=${requesterId}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch users');
    }
    return response.json();
};

export const addWorkbookCollaborator = async (
    workbookId: string | number,
    ownerId: string,
    collaboratorId: string
) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: ownerId, collaborator_id: collaboratorId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add collaborator');
    }

    return response.json();
};

export interface WorkbookCollaborator {
    id: number;
    user_id: string;
    added_by: string;
    added_at: string;
    name: string;
    email: string;
    role?: string;
}

export const getWorkbookCollaborators = async (
    workbookId: string | number,
    requesterId: string
): Promise<{ collaborators: WorkbookCollaborator[] }> => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/collaborators?requester_id=${requesterId}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch collaborators');
    }

    return response.json();
};

export const removeWorkbookCollaborator = async (
    workbookId: string | number,
    requesterId: string,
    collaboratorId: string
) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/collaborators/${collaboratorId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove collaborator');
    }

    return response.json();
};

export const deleteWorkbook = async (workbookId: string | number, requesterId: string) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}?requester_id=${requesterId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete workbook');
    }

    return response.json();
};

export const renameWorkbook = async (
    workbookId: string | number,
    requesterId: string,
    name: string
) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId, name }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to rename workbook');
    }

    return response.json();
};

export const getWorkbookData = async (workbookId: string, requesterId: string) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}?requester_id=${requesterId}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch workbook data');
    }
    return response.json();
};

export const downloadWorkbook = async (workbookId: string, fileName: string, requesterId: string) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/download?requester_id=${requesterId}`);
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

export interface CommitDiff {
    cellReference: string;
    worksheetName?: string;
    changeType: 'added' | 'modified' | 'deleted';
    oldValue?: string;
    newValue?: string;
    oldFormula?: string;
    newFormula?: string;
    description?: string;
}

export interface WorkbookDiffResponse {
    workbook_id: number;
    base_commit: number | 'initial';
    head_commit: number;
    diffs: CommitDiff[];
}

export interface WorkbookConflict {
    id: number;
    workbook_id: number;
    worksheet_id: number;
    row_idx: number;
    col_idx: number;
    user1_id: string;
    user1_value: string | null;
    user2_id: string;
    user2_value: string | null;
    status: 'pending' | 'resolved';
    resolved_by?: string;
    resolution?: string;
    created_at: string;
    resolved_at?: string;
}

export interface CommitDetails {
    commit: Commit;
    changes: CellChange[];
}

export interface CreateCommitResponse {
    commit: Commit;
    cells_snapshotted: number;
}

// Create a new commit (snapshot)
export const createCommit = async (
    workbook_id: number,
    user_id: string,
    message?: string
): Promise<CreateCommitResponse> => {
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
export const getCommitHistory = async (workbook_id: number, requesterId: string, limit: number = 50, offset: number = 0): Promise<{ commits: Commit[] }> => {
    const response = await fetch(`${API_URL}/workbooks/${workbook_id}/commits?requester_id=${requesterId}&limit=${limit}&offset=${offset}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch commit history');
    }

    return response.json();
};

// Get all commits for a user (Global Activity)
export const getUserCommits = async (userId: string, requesterId: string, limit: number = 50, offset: number = 0): Promise<{ commits: (Commit & { workbook_name: string })[] }> => {
    const response = await fetch(`${API_URL}/commits?user_id=${userId}&requester_id=${requesterId}&limit=${limit}&offset=${offset}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user commits');
    }

    return response.json();
};

// Get detailed commit information
export const getCommitDetails = async (commit_id: number, requesterId: string): Promise<CommitDetails> => {
    const response = await fetch(`${API_URL}/commits/${commit_id}?requester_id=${requesterId}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch commit details');
    }

    return response.json();
};

export const getWorkbookDiff = async (
    workbookId: number,
    requesterId: string,
    headCommitId: number,
    baseCommitId?: number
): Promise<WorkbookDiffResponse> => {
    const baseQuery = baseCommitId ? `&base=${baseCommitId}` : '';
    const response = await fetch(
        `${API_URL}/workbooks/${workbookId}/diff?requester_id=${requesterId}&head=${headCommitId}${baseQuery}`
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch workbook diff');
    }

    return response.json();
};

export const getWorkbookConflicts = async (
    workbookId: number,
    requesterId: string,
    status: 'pending' | 'resolved' | 'all' = 'pending'
): Promise<{ conflicts: WorkbookConflict[] }> => {
    const response = await fetch(
        `${API_URL}/workbooks/${workbookId}/conflicts?requester_id=${requesterId}&status=${status}`
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch workbook conflicts');
    }

    return response.json();
};

export const resolveWorkbookConflict = async (
    workbookId: number,
    conflictId: number,
    requesterId: string,
    payload: {
        policy?: 'manual' | 'last-writer-wins';
        resolution?: string;
        resolvedValue?: string;
    }
) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId, ...payload }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to resolve conflict');
    }

    return response.json();
};

// Lightweight check for pending conflicts
export const hasConflicts = async (
    workbookId: number,
    requesterId: string
): Promise<{ hasConflicts: boolean; pendingCount: number }> => {
    const response = await fetch(
        `${API_URL}/workbooks/${workbookId}/has-conflicts?requester_id=${requesterId}`
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to check conflicts');
    }

    return response.json();
};

// Get a full snapshot of the workbook at a specific commit
export const getCommitSnapshot = async (commit_id: number, requesterId: string) => {
    const response = await fetch(`${API_URL}/commits/${commit_id}/snapshot?requester_id=${requesterId}`);
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
        body: JSON.stringify({ commit_id, user_id, requester_id: user_id }),
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

export const createWorksheet = async (workbookId: string, requesterId: string, name: string, order: number) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId, name, order }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create worksheet');
    }
    return response.json();
};

export const renameWorksheet = async (workbookId: string, sheetId: string, requesterId: string, name: string) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/sheets/${sheetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId, name }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to rename worksheet');
    }
    return response.json();
};

export const deleteWorksheet = async (workbookId: string, sheetId: string, requesterId: string) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/sheets/${sheetId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete worksheet');
    }
    return response.json();
};

export const reorderWorksheets = async (workbookId: string, requesterId: string, orders: { id: string; order: number }[]) => {
    const response = await fetch(`${API_URL}/workbooks/${workbookId}/sheets/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId, orders }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reorder worksheets');
    }
    return response.json();
};

// ============================================
// AI API
// ============================================

export interface ExplainFormulaResponse {
    formula: string;
    explanation: string;
    provider: string;
    model: string;
    fallback: boolean;
}

export interface DetectErrorsResponse {
    workbook_id: number;
    totalScanned: number;
    totalIssues: number;
    findings: Array<{
        worksheet: string;
        cell: string;
        errorType: string;
        currentValue: string;
        formula: string;
        suggestion: string;
    }>;
}

export interface AnalyzeDataResponse {
    workbook_id: number;
    summary: string;
    stats: {
        count: number;
        min: number;
        max: number;
        mean: number;
        median: number;
        stdDev: number;
        q1: number;
        q3: number;
        iqr: number;
    } | null;
    outliers: Array<{
        worksheet: string;
        cell: string;
        value: number;
    }>;
}

export interface PromptAIResponse {
    prompt: string;
    answer: string;
    provider: string;
    model: string;
    fallback: boolean;
    selection: {
        worksheet_id: number;
        row: number;
        col: number;
        rowCount: number;
        colCount: number;
    } | null;
    selectedCellsCount: number;
}

export const explainFormula = async (
    requesterId: string,
    payload: {
        formula: string;
        workbook_id?: number;
        worksheet_name?: string;
        cell_reference?: string;
    }
): Promise<ExplainFormulaResponse> => {
    const response = await fetch(`${API_URL}/ai/explain-formula`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId, ...payload }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to explain formula');
    }

    return response.json();
};

export const detectWorkbookErrors = async (
    requesterId: string,
    workbookId: number
): Promise<DetectErrorsResponse> => {
    const response = await fetch(`${API_URL}/ai/detect-errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId, workbook_id: workbookId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to detect workbook errors');
    }

    return response.json();
};

export const analyzeWorkbookData = async (
    requesterId: string,
    workbookId: number
): Promise<AnalyzeDataResponse> => {
    const response = await fetch(`${API_URL}/ai/analyze-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId, workbook_id: workbookId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze workbook data');
    }

    return response.json();
};

export const askPromptAI = async (
    requesterId: string,
    payload: {
        workbook_id: number;
        prompt: string;
        worksheet_id?: number;
        selection?: {
            row: number;
            col: number;
            rowCount: number;
            colCount: number;
        };
    }
): Promise<PromptAIResponse> => {
    const response = await fetch(`${API_URL}/ai/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId, ...payload }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to run AI prompt');
    }

    return response.json();
};

// ============================================
// ADMIN DASHBOARD API
// ============================================

export interface AdminStats {
    totalUsers: number;
    totalWorkbooks: number;
    totalCommits: number;
    pendingConflicts: number;
    recentSignups: number;
    storageBytesUsed: number;
}

export interface RecentActivityCommit {
    id: number;
    message: string;
    user_id: string;
    timestamp: string;
    hash: string;
    workbook_id: number;
    workbook_name: string;
    user_name: string;
    user_email: string;
    changes_count: number;
}

export interface AuditLog {
    id: number;
    user_id: string;
    user_email: string;
    action: string;
    details: any;
    ip_address: string;
    timestamp: string;
}

export interface AdminAnalytics {
    userGrowth: { date: string; count: number }[];
    commitActivity: { date: string; count: number }[];
    systemMetrics: {
        totalUsers: number;
        totalWorkbooks: number;
        totalCommits: number;
        totalCells: number;
        dbSizeBytes: number;
    };
    recentAuditLogs: AuditLog[];
}

export interface AdminManagedUser {
    firebase_uid: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | string;
    created_at?: string;
}

export interface AdminComplianceReport {
    reportGeneratedAt: string;
    auditLogging: {
        status: string;
        totalLogs: number;
        lastLoggedAction: string;
    };
    userDistribution: Record<string, number>;
    retentionPolicy: string;
    backupStatus: string;
}

export interface InAppNotification {
    id: number;
    user_id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    metadata?: any;
    is_read: boolean;
    created_at: string;
}

export const getAdminStats = async (requesterId: string): Promise<AdminStats> => {
    const response = await fetch(`${API_URL}/admin/stats?requester_id=${requesterId}`);
    if (!response.ok) throw new Error('Failed to fetch admin stats');
    return response.json();
};

export const getRecentActivity = async (requesterId: string, limit: number = 20): Promise<{ commits: RecentActivityCommit[] }> => {
    const response = await fetch(`${API_URL}/admin/recent-activity?requester_id=${requesterId}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch recent activity');
    return response.json();
};

export interface AuditLogFilters {
    action?: string;
    user?: string;
    from?: string;
    to?: string;
}

export const getAuditLogs = async (
    requesterId: string,
    limit: number = 100,
    offset: number = 0,
    filters: AuditLogFilters = {}
): Promise<{ logs: AuditLog[]; total: number }> => {
    const params = new URLSearchParams({
        requester_id: requesterId,
        limit: String(limit),
        offset: String(offset),
    });

    if (filters.action) params.set('action', filters.action);
    if (filters.user) params.set('user', filters.user);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);

    const response = await fetch(`${API_URL}/admin/audit-logs?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
};

export const getAuditLogsExportUrl = (
    requesterId: string,
    format: 'csv' | 'json' = 'csv',
    filters: AuditLogFilters = {}
) => {
    const params = new URLSearchParams({ requester_id: requesterId, format });
    if (filters.action) params.set('action', filters.action);
    if (filters.user) params.set('user', filters.user);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    return `${API_URL}/admin/audit-logs/export?${params.toString()}`;
};

export const getAdminAnalytics = async (requesterId: string): Promise<AdminAnalytics> => {
    const response = await fetch(`${API_URL}/admin/analytics?requester_id=${requesterId}`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
};

export const getAdminUsers = async (requesterId: string): Promise<{ users: AdminManagedUser[] }> => {
    const response = await fetch(`${API_URL}/admin/users?requester_id=${requesterId}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch admin users');
    }
    return response.json();
};

export const updateAdminUser = async (
    requesterId: string,
    uid: string,
    payload: { email: string; name: string; role: string }
): Promise<{ message: string; user: AdminManagedUser }> => {
    const response = await fetch(`${API_URL}/admin/users/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId, ...payload }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update user');
    }

    return response.json();
};

export const deleteAdminUser = async (requesterId: string, uid: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/admin/users/${uid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete user');
    }

    return response.json();
};

export const getAdminComplianceReport = async (requesterId: string): Promise<AdminComplianceReport> => {
    const response = await fetch(`${API_URL}/admin/compliance-report?requester_id=${requesterId}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch compliance report');
    }
    return response.json();
};

export const getNotifications = async (
    requesterId: string,
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false
): Promise<{ notifications: InAppNotification[] }> => {
    const response = await fetch(
        `${API_URL}/notifications?requester_id=${requesterId}&limit=${limit}&offset=${offset}&unreadOnly=${unreadOnly}`
    );
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
};

export const markNotificationRead = async (requesterId: string, notificationId: number) => {
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId }),
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
};

export const markAllNotificationsRead = async (requesterId: string) => {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId }),
    });
    if (!response.ok) throw new Error('Failed to mark all notifications as read');
    return response.json();
};

export const clearNotification = async (requesterId: string, notificationId: number) => {
    const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId }),
    });
    if (!response.ok) throw new Error('Failed to clear notification');
    return response.json();
};
