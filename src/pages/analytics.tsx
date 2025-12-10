import React, { useState } from 'react';
import { FaDownload } from 'react-icons/fa';

interface AuditLog {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    details: string;
    ipAddress: string;
    status: 'success' | 'failed';
}

interface SystemMetric {
    timestamp: string;
    activeUsers: number;
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
}

const AnalyticsPage: React.FC = () => {
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [reportType, setReportType] = useState<'compliance' | 'auditlogs'>('compliance');

    const auditLogs: AuditLog[] = [
        { id: 'al1', timestamp: '2025-12-03 14:23:15', user: 'Maleeha@example.com', action: 'User Created', details: 'New user john_analyst added to system', ipAddress: '192.168.1.100', status: 'success' },
        { id: 'al2', timestamp: '2025-12-03 13:45:22', user: 'Batool@example.com', action: 'Permission Changed', details: 'User mike elevated to analyst role', ipAddress: '192.168.1.50', status: 'success' },
        { id: 'al3', timestamp: '2025-12-03 12:10:08', user: 'Ali@example.com', action: 'File Uploaded', details: 'Large dataset uploaded (2.5GB)', ipAddress: '192.168.1.150', status: 'success' },

        { id: 'al6', timestamp: '2025-12-02 16:42:12', user: 'Aly@example.com', action: 'Data Export', details: 'User exported 5000 records to CSV', ipAddress: '192.168.1.200', status: 'success' },
        { id: 'al8', timestamp: '2025-12-02 14:05:33', user: 'Amna@example.com', action: 'Unauthorized Access Attempt', details: 'Attempted access to restricted admin panel', ipAddress: '192.168.1.175', status: 'failed' },
        { id: 'al9', timestamp: '2025-12-02 13:20:10', user: 'Rehana@example.com', action: 'Report Generated', details: 'Compliance report generated and downloaded', ipAddress: '192.168.1.120', status: 'success' },
    ];

    const systemMetrics: SystemMetric[] = [
        { timestamp: '2025-12-03', activeUsers: 42, totalRequests: 15420, avgResponseTime: 245, errorRate: 0.8 },
        { timestamp: '2025-12-02', activeUsers: 38, totalRequests: 14200, avgResponseTime: 235, errorRate: 0.6 },
        { timestamp: '2025-12-01', activeUsers: 45, totalRequests: 16800, avgResponseTime: 260, errorRate: 1.2 },
    ];

    const downloadReport = (type: string) => {
        const reportName = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
        const csvContent = generateCSV(type);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = reportName;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const generateCSV = (type: string): string => {
        if (type === 'compliance') {
            const headers = ['Timestamp', 'User', 'Action', 'Details', 'IP Address', 'Status'];
            const rows = auditLogs.map(log => [
                log.timestamp,
                log.user,
                log.action,
                log.details,
                log.ipAddress,
                log.status.toUpperCase(),
            ]);
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        } else if (type === 'auditlogs') {
            const headers = ['Timestamp', 'User', 'Action', 'Details', 'IP Address', 'Status'];
            const rows = auditLogs.map(log => [
                log.timestamp,
                log.user,
                log.action,
                log.details,
                log.ipAddress,
                log.status.toUpperCase(),
            ]);
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }
        return '';
    };

    return (
        <div className="analytics-page" style={{ padding: '0' }}>
            {/* Header */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title">Analytics & Reporting</h1>
                        <p className="header-subtitle">Monitor platform usage, view audit logs, and generate compliance reports.</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Report Download Panel */}
                <div className="content-panel glass-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">Generate & Download Reports</h2>
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
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    marginTop: 'auto',
                                    transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = '#059669';
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = '#10b981';
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
                                onClick={() => downloadReport('auditlogs')}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    marginTop: 'auto',
                                    transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = '#1e40af';
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = '#3b82f6';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* @ts-ignore */}
                                <FaDownload size={14} /> Download CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Metrics */}
                <div className="content-panel glass-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">System Status & Metrics</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Users (Today)</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.5rem' }}>{systemMetrics[0].activeUsers}</div>
                        </div>

                        <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Requests</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.5rem' }}>{systemMetrics[0].totalRequests.toLocaleString()}</div>
                        </div>

                        <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg Response Time</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.5rem' }}>{systemMetrics[0].avgResponseTime}ms</div>
                        </div>

                        <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Error Rate</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444', marginTop: '0.5rem' }}>{systemMetrics[0].errorRate}%</div>
                        </div>
                    </div>
                </div>

                {/* Audit Logs */}
                <div className="content-panel glass-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">Audit Logs</h2>
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
                                {auditLogs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(99, 102, 241, 0.05)' }}>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{log.timestamp}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{log.user}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{log.action}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.ipAddress}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                background: log.status === 'success' ? '#d1fae5' : '#fee2e2',
                                                color: log.status === 'success' ? '#065f46' : '#7f1d1d',
                                            }}>
                                                {log.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
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