import React, { useState, useEffect, useCallback } from 'react';
import { getRecentActivity, RecentActivityCommit } from '../services/api';

const CommitPage: React.FC = () => {
    const [commits, setCommits] = useState<RecentActivityCommit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCommits = useCallback(async () => {
        try {
            const data = await getRecentActivity(50);
            setCommits(data.commits);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load commits');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCommits();
        const interval = setInterval(fetchCommits, 30000);
        return () => clearInterval(interval);
    }, [fetchCommits]);

    const formatTimeAgo = (timestamp: string): string => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="commit-page" style={{ padding: '0' }}>
            {/* Header */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title">Versions  &amp; Activity</h1>
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
                        <span className="panel-badge neu-badge" style={{ background: 'rgba(99,102,241,0.2)', color: '#6366f1' }}>
                            {loading ? '...' : `${commits.length} items`}
                        </span>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                Loading activity...
                            </div>
                        ) : error ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
                                <p>{error}</p>
                                <button
                                    onClick={fetchCommits}
                                    style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : commits.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                No commits yet. Make changes to a workbook and commit to see activity here.
                            </div>
                        ) : (
                            commits.map((commit, index) => (
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
                                        <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                                            {commit.user_name || commit.user_email || commit.user_id}
                                        </span>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '12px',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            color: '#6366f1',
                                            fontWeight: 500
                                        }}>
                                            {commit.workbook_name}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {commit.message}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {formatTimeAgo(commit.timestamp)}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {commit.changes_count} cell changes · {commit.hash?.substring(0, 8)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommitPage;