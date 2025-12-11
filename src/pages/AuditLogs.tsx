import React, { useState } from 'react';
import { FaSearch, FaDownload, FaFilter, FaFileExport, FaListAlt } from 'react-icons/fa';
// file: component for FR9.2 and FR9.5

interface AuditLog {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    details: string;
    ipAddress: string;
    status: 'success' | 'failure' | 'warning';
}

const AuditLogsPage: React.FC = () => {
    // Mock data for audit logs
    const [logs] = useState<AuditLog[]>([
        { id: 'log-1', timestamp: '2025-12-10 14:30:22', user: 'admin@example.com', action: 'USER_ROLE_CHANGE', details: 'Changed user u2 role to Admin', ipAddress: '192.168.1.1', status: 'success' },
        { id: 'log-2', timestamp: '2025-12-10 14:15:10', user: 'system', action: 'SYSTEM_BACKUP', details: 'Automated daily backup completed', ipAddress: 'localhost', status: 'success' },
        { id: 'log-3', timestamp: '2025-12-10 13:45:00', user: 'maleeha@example.com', action: 'LOGIN_ATTEMPT', details: 'Failed login attempt', ipAddress: '203.0.113.42', status: 'failure' },
        { id: 'log-4', timestamp: '2025-12-10 12:00:01', user: 'batool@example.com', action: 'FILE_UPLOAD', details: 'Uploaded financial_report_q4.xlsx', ipAddress: '192.168.1.5', status: 'success' },
        { id: 'log-5', timestamp: '2025-12-10 11:30:15', user: 'admin@example.com', action: 'SETTINGS_UPDATE', details: 'Updated security policy', ipAddress: '192.168.1.1', status: 'warning' },
        { id: 'log-6', timestamp: '2025-12-10 10:15:20', user: 'rehana@example.com', action: 'REPORT_GENERATION', details: 'Generated User Activity Report', ipAddress: '192.168.1.8', status: 'success' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' ||
            (filterType === 'success' && log.status === 'success') ||
            (filterType === 'failure' && log.status === 'failure') ||
            (filterType === 'warning' && log.status === 'warning');
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return '#10b981';
            case 'failure': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const handleExport = () => {
        alert('Generating Audit Log Report... (Download simulation)');
    };

    const handleComplianceReport = () => {
        alert('Generating Compliance Report (FR9.4)... (Download simulation)');
    }

    return (
        <div className="audit-logs-page" style={{ padding: '0' }}>
            {/* Header */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title">Audit Logs & Compliance</h1>
                        <p className="header-subtitle">Monitor system activity and generate compliance reports.</p>
                    </div>
                    <div className="header-right">
                        <button
                            onClick={handleComplianceReport}
                            className="neu-button"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.6rem 1.2rem',
                                fontSize: '0.9rem',
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                                transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                            }}
                        >
                            {/* @ts-ignore */}
                            <FaFileExport /> Generate Compliance Report
                        </button>
                    </div>
                </div>
            </header>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '100%' }}>

                {/* Controls */}
                <div className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
                            <div className="glass-input" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', width: '100%' }}>
                                {/* @ts-ignore */}
                                <FaSearch color="var(--text-secondary)" style={{ marginRight: '0.5rem' }} />
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>

                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="glass-input"
                            style={{ minWidth: '150px' }}
                        >
                            <option value="all">All Status</option>
                            <option value="success">Success</option>
                            <option value="failure">Failure</option>
                            <option value="warning">Warning</option>
                        </select>
                    </div>

                    <button
                        onClick={handleExport}
                        className="neu-button"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            backdropFilter: 'blur(10px)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {/* @ts-ignore */}
                        <FaDownload /> Export Logs
                    </button>
                </div>

                {/* Logs Table */}
                <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* @ts-ignore */}
                        <FaListAlt /> <h3 style={{ margin: 0 }}>System Activity Log</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Timestamp</th>
                                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>User</th>
                                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Action</th>
                                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Details</th>
                                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>IP Address</th>
                                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log, index) => (
                                    <tr key={log.id} style={{ borderBottom: index < filteredLogs.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{log.timestamp}</td>
                                        <td style={{ padding: '1rem' }}>{log.user}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                background: 'rgba(255,255,255,0.1)',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem'
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{log.ipAddress}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                color: getStatusColor(log.status),
                                                fontWeight: 500,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem'
                                            }}>
                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(log.status) }}></div>
                                                {log.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredLogs.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No logs found matching your criteria.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AuditLogsPage;