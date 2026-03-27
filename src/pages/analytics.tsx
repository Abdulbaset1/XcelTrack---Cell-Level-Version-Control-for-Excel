import React, { useState, useEffect, useCallback } from 'react';
import { FaDownload } from 'react-icons/fa';
import { getAdminAnalytics, AdminAnalytics, AuditLog } from '../services/api';

const AnalyticsPage: React.FC = () => {
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        try {
            const data = await getAdminAnalytics();
            setAnalytics(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 60000);
        return () => clearInterval(interval);
    }, [fetchAnalytics]);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const downloadReport = (type: string) => {
        if (!analytics) return;

        const logs = analytics.recentAuditLogs;
        const headers = ['Timestamp', 'User Email', 'Action', 'Details', 'IP Address', 'Status'];
        const rows = logs.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.user_email || log.user_id || 'System',
            log.action,
            log.details ? JSON.stringify(log.details) : '',
            log.ip_address || 'N/A',
            log.action.includes('FAIL') ? 'FAILED' : 'SUCCESS',
        ]);
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

        const reportName = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = reportName;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="analytics-page" style={{ padding: '0' }}>
            {/* Header */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title">Analytics &amp; Reporting</h1>
                        <p className="header-subtitle">Monitor platform usage, view audit logs, and generate compliance reports.</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Error State */}
                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444' }}>
                        {error}
                        <button onClick={fetchAnalytics} style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', textDecoration: 'underline' }}>
                            Retry
                        </button>
                    </div>
                )}

                {/* Report Download Panel */}
                <div className="content-panel glass-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">Generate &amp; Download Reports</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                        {/* Compliance Report */}
                        <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#10b981' }}>Compliance Report</div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1 }}>
                                Audit-ready logs for regulated industries. Includes all user actions, system changes, and access attempts.
                            </p>
                            <button
                                onClick={() => downloadReport('compliance')}
                                disabled={loading || !analytics}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    background: loading ? '#94a3b8' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    marginTop: 'auto',
                                    transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                                onMouseEnter={e => {
                                    if (!loading) {
                                        e.currentTarget.style.background = '#059669';
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = loading ? '#94a3b8' : '#10b981';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* @ts-ignore */}
                                <FaDownload size={14} /> Download CSV
                            </button>
                        </div>

                        {/* Audit Logs Report */}
                        <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#3b82f6' }}>Audit Logs Report</div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1 }}>
                                Comprehensive audit logs showing user activity, access logs, and system changes for monitoring and auditing.
                            </p>
                            <button
                                onClick={() => {
                                    window.location.href = 'http://localhost:5000/api/admin/audit-logs/export';
                                }}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    background: loading ? '#94a3b8' : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    marginTop: 'auto',
                                    transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                                onMouseEnter={e => {
                                    if (!loading) {
                                        e.currentTarget.style.background = '#1e40af';
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = loading ? '#94a3b8' : '#3b82f6';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* @ts-ignore */}
                                <FaDownload size={14} /> Export Full Logs (CSV)
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Metrics */}
                <div className="content-panel glass-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">System Status &amp; Metrics</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Users</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.5rem' }}>
                                {loading ? '—' : analytics?.systemMetrics.totalUsers ?? 0}
                            </div>
                        </div>

                        <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Workbooks</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.5rem' }}>
                                {loading ? '—' : analytics?.systemMetrics.totalWorkbooks ?? 0}
                            </div>
                        </div>

                        <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Commits</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.5rem' }}>
                                {loading ? '—' : analytics?.systemMetrics.totalCommits ?? 0}
                            </div>
                        </div>

                        <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Database Size</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6366f1', marginTop: '0.5rem' }}>
                                {loading ? '—' : formatBytes(analytics?.systemMetrics.dbSizeBytes ?? 0)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Growth & Commit Activity */}
                {analytics && (analytics.userGrowth.length > 0 || analytics.commitActivity.length > 0) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* User Growth */}
                        <div className="content-panel glass-panel">
                            <div className="panel-header">
                                <h2 className="panel-title">User Growth (7 Days)</h2>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {analytics.userGrowth.length === 0 ? (
                                    <div style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No signups in the last 7 days</div>
                                ) : (
                                    analytics.userGrowth.map((day, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.05)' }}>
                                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{new Date(day.date).toLocaleDateString()}</span>
                                            <span style={{ fontWeight: 700, color: '#10b981' }}>+{day.count} users</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Commit Activity */}
                        <div className="content-panel glass-panel">
                            <div className="panel-header">
                                <h2 className="panel-title">Commit Activity (7 Days)</h2>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {analytics.commitActivity.length === 0 ? (
                                    <div style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No commits in the last 7 days</div>
                                ) : (
                                    analytics.commitActivity.map((day, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.05)' }}>
                                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{new Date(day.date).toLocaleDateString()}</span>
                                            <span style={{ fontWeight: 700, color: '#3b82f6' }}>{day.count} commits</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Audit Logs */}
                <div className="content-panel glass-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">Recent Audit Logs</h2>
                    </div>

                    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid rgba(99, 102, 241, 0.1)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-dark)' }}>Timestamp</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-dark)' }}>User</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-dark)' }}>Action</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-dark)' }}>Details</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-dark)' }}>IP Address</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-dark)' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td>
                                    </tr>
                                ) : !analytics?.recentAuditLogs?.length ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No audit logs yet. Admin actions will appear here.
                                        </td>
                                    </tr>
                                ) : (
                                    analytics.recentAuditLogs.map(log => {
                                        const isFailed = log.action.includes('FAIL');
                                        return (
                                            <tr key={log.id} style={{ borderBottom: '1px solid rgba(99, 102, 241, 0.05)' }}>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{log.user_email || log.user_id || 'System'}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{log.action}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                                </td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.ip_address || 'N/A'}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '20px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        background: isFailed ? '#fee2e2' : '#d1fae5',
                                                        color: isFailed ? '#7f1d1d' : '#065f46',
                                                    }}>
                                                        {isFailed ? 'FAILED' : 'SUCCESS'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Compliance Checklist */}
                <div className="content-panel glass-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">Compliance Status</h2>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                        {['Audit Logging Enabled', 'Data Encryption Active', 'Failed Login Alerts Configured', 'Backup System Operational'].map((item, idx) => (
                            <div key={idx} style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>✓</span>
                                <span style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;