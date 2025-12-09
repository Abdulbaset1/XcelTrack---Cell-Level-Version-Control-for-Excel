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

    const [notifications] = useState<Notification[]>(
        [
            { id: 'n1', title: 'Commit Successful', message: 'Revenue projections updated successfully', timestamp: '2025-12-07 14:23:20', type: 'success' },
            { id: 'n2', title: 'Merge Completed', message: 'Budget adjustments merged without conflicts', timestamp: '2025-12-07 13:45:30', type: 'success' },
            { id: 'n3', title: 'Data Upload Complete', message: 'Customer dataset uploaded (2.5GB)', timestamp: '2025-12-07 12:10:15', type: 'success' },
            { id: 'n4', title: 'Conflict Resolved', message: 'Merge conflict in financial_model.xlsx resolved', timestamp: '2025-12-07 11:33:00', type: 'info' },
            { id: 'n5', title: 'Configuration Updated', message: 'System configuration files updated successfully', timestamp: '2025-12-07 10:15:45', type: 'success' },
        ]
    );

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'edit': return '#3b82f6';
            case 'merge': return '#10b981';
            case 'upload': return '#f59e0b';
            case 'conflict': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success': return (
                <>
                    {/* @ts-ignore */}
                    <FaCheckCircle style={{ color: '#10b981' }} />
                </>
            );
            case 'error': return (
                <>
                    {/* @ts-ignore */}
                    <FaTimesCircle style={{ color: '#ef4444' }} />
                </>
            );
            case 'info': return (
                <>
                    {/* @ts-ignore */}
                    <FaInfoCircle style={{ color: '#3b82f6' }} />
                </>
            );
            default: return (
                <>
                    {/* @ts-ignore */}
                    <FaBell />
                </>
            );
        }
    };

    return (
        <div className="commit-page" style={{ padding: '0' }}>
            {/* Header */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title">Commits & Activity</h1>
                        <p className="header-subtitle">View recent commits and system notifications</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '100%' }}>
                {/* Recent Commits */}
                <div className="content-panel glass-panel" style={{ minWidth: 0 }}>
                    <div className="panel-header">
                        <h2 className="panel-title">Recent Commits</h2>
                        <span className="panel-badge neu-badge" style={{ background: 'rgba(99,102,241,0.2)', color: '#6366f1' }}>{commits.length} commits</span>
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
                                    <span style={{
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        background: getTypeColor(commit.type),
                                        color: 'white',
                                        textTransform: 'capitalize',
                                    }}>
                                        {commit.type}
                                    </span>
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

                {/* Notifications */}
                <div className="content-panel glass-panel" style={{ minWidth: 0 }}>
                    <div className="panel-header">
                        <h2 className="panel-title">Notifications</h2>
                        <span className="panel-badge neu-badge" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>{notifications.length} new</span>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {notifications.map((notif, index) => (
                            <div
                                key={notif.id}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    background: notif.type === 'success' ? 'rgba(16,185,129,0.08)' : notif.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
                                    border: `1px solid ${notif.type === 'success' ? 'rgba(16,185,129,0.2)' : notif.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
                                    display: 'flex',
                                    gap: '0.75rem',
                                    animationDelay: `${index * 0.1}s`,
                                }}
                                className="slide-in"
                            >
                                <div style={{ fontSize: '1.2rem', marginTop: '0.25rem' }}>
                                    {getNotificationIcon(notif.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                                        {notif.title}
                                    </div>
                                    <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        {notif.message}
                                    </p>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {notif.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommitPage;