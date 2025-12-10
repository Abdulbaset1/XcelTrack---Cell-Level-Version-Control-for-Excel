import React, { useState } from 'react';
import { FaBell, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

interface Commit {
    id: string;
    user: string;
    message: string;
    timestamp: string;
    type: 'edit' | 'merge' | 'upload' | 'conflict';
}

interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: 'success' | 'error' | 'info';
}

const CommitPage: React.FC = () => {
    const [commits] = useState<Commit[]>([
        { id: 'c1', user: 'Maleeha', message: 'Updated revenue projections for Q4 2024', timestamp: '2025-12-07 14:23:15', type: 'edit' },
        { id: 'c2', user: 'Batool', message: 'Merged budget adjustments from development branch', timestamp: '2025-12-07 13:45:22', type: 'merge' },
        { id: 'c3', user: 'Ali', message: 'Uploaded new customer dataset', timestamp: '2025-12-07 12:10:08', type: 'upload' },
        { id: 'c4', user: 'Sarah', message: 'Resolved merge conflict in financial_model.xlsx', timestamp: '2025-12-07 11:32:45', type: 'conflict' },
        { id: 'c5', user: 'Aly', message: 'Updated system configuration files', timestamp: '2025-12-07 10:15:30', type: 'edit' },
        { id: 'c6', user: 'Zobia', message: 'Merged analytics dashboard updates', timestamp: '2025-12-06 16:42:12', type: 'merge' },
    ]);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'edit': return '#3b82f6';
            case 'merge': return '#10b981';
            case 'upload': return '#f59e0b';
            case 'conflict': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <div className="commit-page" style={{ padding: '0' }}>
            {/* Header */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title">Versions  & Activity</h1>
                        <p className="header-subtitle">View system activity and user actions</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', maxWidth: '100%' }}>
                {/* Recent Commits */}
                <div className="content-panel glass-panel" style={{ minWidth: 0 }}>
                    <div className="panel-header">
                        <h2 className="panel-title">Recent Activity</h2>
                        <span className="panel-badge neu-badge" style={{ background: 'rgba(99,102,241,0.2)', color: '#6366f1' }}>{commits.length} items</span>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {commits.map((commit, index) => (
                            <div
                                key={commit.id}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    background: 'rgba(99, 102, 241, 0.05)',
                                    border: '1px solid rgba(99, 102, 241, 0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    animationDelay: `${index * 0.1}s`,
                                }}
                                className="slide-in"
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{commit.user}</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{commit.user}</span>
                                </div>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {commit.message}
                                </p>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {commit.timestamp}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommitPage;