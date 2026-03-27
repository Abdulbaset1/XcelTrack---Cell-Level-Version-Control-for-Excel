import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaDownload, FaFileExport, FaListAlt, FaTimes, FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaChartBar } from 'react-icons/fa';

// file: component for FR9.2 and FR9.5

interface AuditLog {
    id: string;
    timestamp: string;
    user: string; // Map to user_email from backend
    user_email?: string;
    action: string;
    details: any;
    ip_address?: string;
    ipAddress?: string; // mapping helper
    status?: 'success' | 'failure' | 'warning';
}

interface ComplianceReport {
    reportGeneratedAt: string;
    auditLogging: {
        status: string;
        totalLogs: number;
        lastLoggedAction: string;
    };
    userDistribution: { [key: string]: number };
    retentionPolicy: string;
    backupStatus: string;
}

const AuditLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
    const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const API_BASE_URL = 'http://localhost:5000/api';

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/audit-logs?limit=100`);
            if (!response.ok) throw new Error('Failed to fetch logs');
            const data = await response.json();
            // Map backend fields to frontend interface if necessary
            const mappedLogs = data.logs.map((log: any) => ({
                ...log,
                timestamp: new Date(log.timestamp).toLocaleString(),
                user: log.user_email || log.user_id || 'System',
                ipAddress: log.ip_address || 'N/A',
                status: log.action.includes('ERROR') || log.action.includes('FAIL') ? 'failure' :
                    log.action.includes('WARN') ? 'warning' : 'success'
            }));
            setLogs(mappedLogs);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filteredLogs = logs.filter(log => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = log.user.toLowerCase().includes(query) ||
            log.action.toLowerCase().includes(query) ||
            (typeof log.details === 'string' ? log.details.toLowerCase().includes(query) : JSON.stringify(log.details).toLowerCase().includes(query));

        const matchesFilter = filterType === 'all' ||
            (filterType === 'success' && log.status === 'success') ||
            (filterType === 'failure' && log.status === 'failure') ||
            (filterType === 'warning' && log.status === 'warning');

        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'success': return '#10b981';
            case 'failure': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            window.location.href = `${API_BASE_URL}/admin/audit-logs/export`;
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export logs. Please try again.');
        } finally {
            setTimeout(() => setIsExporting(false), 2000);
        }
    };

    const handleComplianceReport = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/compliance-report`);
            if (!response.ok) throw new Error('Failed to fetch compliance report');
            const data = await response.json();
            setComplianceReport(data);
            setIsComplianceModalOpen(true);
        } catch (err: any) {
            alert('Error generating compliance report: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

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
                            disabled={isLoading}
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
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                                transition: 'all 0.3s ease',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {/* @ts-ignore */}
                            <FaFileExport /> {isLoading ? 'Generating...' : 'Generate Compliance Report'}
                        </button>
                    </div>
                </div>
            </header>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>

                {/* Controls */}
                <div className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '800px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                            <div className="glass-input" style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.5rem 1rem',
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.9)',
                                border: '1px solid var(--border-light)',
                                boxShadow: 'var(--shadow-soft)',
                                borderRadius: '10px'
                            }}>
                                {/* @ts-ignore */}
                                <FaSearch
                                    size={18}
                                    style={{
                                        color: 'var(--text-secondary)',
                                        marginRight: '0.75rem',
                                        opacity: 0.8
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Search user, action or details..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        outline: 'none',
                                        width: '100%',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                        </div>

                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="glass-input"
                            style={{ flex: 1, minWidth: '0' }}
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
                        disabled={isExporting}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'var(--text-primary)',
                            cursor: isExporting ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            backdropFilter: 'blur(10px)',
                            opacity: isExporting ? 0.7 : 1
                        }}
                    >
                        {/* @ts-ignore */}
                        <FaDownload /> {isExporting ? 'Exporting...' : 'Export Logs'}
                    </button>
                </div>

                {/* Logs Table */}
                <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* @ts-ignore */}
                        <FaListAlt /> <h3 style={{ margin: 0 }}>System Activity Log</h3>
                        {isLoading && <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Refreshing...</span>}
                    </div>
                    <div style={{ width: '100%', overflowX: 'hidden' }}>
                        {error ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
                                {/* @ts-ignore */}
                                <FaExclamationTriangle size={24} style={{ marginBottom: '1rem' }} />
                                <p>{error}</p>
                                <button onClick={fetchLogs} className="btn-link" style={{ marginTop: '1rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Try Again</button>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', tableLayout: 'fixed' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', width: '160px' }}>Timestamp</th>
                                        <th style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', width: '180px' }}>User</th>
                                        <th style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', width: '140px' }}>Action</th>
                                        <th style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Details</th>
                                        <th style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', width: '120px' }}>IP Address</th>
                                        <th style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', width: '100px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log, index) => (
                                        <tr key={log.id} style={{ borderBottom: index < filteredLogs.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                                            <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.timestamp}</td>
                                            <td style={{ padding: '0.75rem', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.user}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    background: 'rgba(13, 35, 64, 0.05)',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    border: '1px solid rgba(13, 35, 64, 0.1)',
                                                    display: 'inline-block',
                                                    maxWidth: '100%',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                            </td>
                                            <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.ipAddress}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    color: getStatusColor(log.status),
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(log.status) }}></div>
                                                    {log.status?.toUpperCase() || 'SUCCESS'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!isLoading && !error && filteredLogs.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                {/* @ts-ignore */}
                                <FaSearch size={32} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>No audit logs found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Compliance Report Modal */}
            {isComplianceModalOpen && complianceReport && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(8, 31, 98, 0.4)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem'
                }}>
                    <div className="glass-panel" style={{
                        maxWidth: '600px',
                        width: '100%',
                        padding: '2rem',
                        position: 'relative',
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid var(--primary)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <button
                            onClick={() => setIsComplianceModalOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)'
                            }}
                        >
                            {/* @ts-ignore */}
                            <FaTimes size={20} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}>
                                {/* @ts-ignore */}
                                <FaShieldAlt size={30} />
                            </div>
                            <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Compliance & Audit Report</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Generated on {new Date(complianceReport.reportGeneratedAt).toLocaleString()}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    {/* @ts-ignore */}
                                    <FaChartBar /> Logging Status
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#10b981' }}>
                                    {/* @ts-ignore */}
                                    <FaCheckCircle /> {complianceReport.auditLogging.status.toUpperCase()}
                                </div>
                            </div>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Total Records
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {complianceReport.auditLogging.totalLogs}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>User Distribution</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                {Object.entries(complianceReport.userDistribution).map(([role, count]) => (
                                    <div key={role} style={{
                                        padding: '0.5rem 1rem',
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem'
                                    }}>
                                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{role}:</span> {count}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Retention Policy:</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{complianceReport.retentionPolicy}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Backup Readiness:</span>
                                <span style={{ fontWeight: 600, color: '#10b981' }}>{complianceReport.backupStatus}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsComplianceModalOpen(false)}
                            style={{
                                width: '100%',
                                marginTop: '2rem',
                                padding: '0.8rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Close Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogsPage;