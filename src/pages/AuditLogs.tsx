import React, { useState, useEffect } from 'react';
import { FaSearch, FaDownload, FaFilter, FaClock } from 'react-icons/fa';

interface LogEntry {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    resource: string;
    status: 'Success' | 'Failure' | 'Warning';
    ipAddress: string;
    details: string;
}

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        // Mock Data for Audit Logs
        const mockLogs: LogEntry[] = [
            { id: 'LOG-001', timestamp: '2025-12-10 09:45:12', user: 'admin@xceltrack.com', action: 'User Role Update', resource: 'User: john.doe', status: 'Success', ipAddress: '192.168.1.5', details: 'Promoted to Editor' },
            { id: 'LOG-002', timestamp: '2025-12-10 09:30:00', user: 'system', action: 'Automated Backup', resource: 'Database', status: 'Success', ipAddress: 'localhost', details: 'Daily snapshot created' },
            { id: 'LOG-003', timestamp: '2025-12-10 08:15:22', user: 'unknown', action: 'Failed Login', resource: 'Auth', status: 'Failure', ipAddress: '203.0.113.42', details: 'Invalid password attempt' },
            { id: 'LOG-004', timestamp: '2025-12-09 16:20:05', user: 'sarah.smith', action: 'Export Data', resource: 'Financial Report Q4', status: 'Warning', ipAddress: '192.168.1.8', details: 'Large dataset export' },
            { id: 'LOG-005', timestamp: '2025-12-09 14:10:55', user: 'admin@xceltrack.com', action: 'System Config Change', resource: 'Security Settings', status: 'Success', ipAddress: '192.168.1.5', details: 'Enabled 2FA enforcement' },
        ];
        setLogs(mockLogs);
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.resource.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || log.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const cardStyle = "bg-white backdrop-blur-lg border border-white/60 rounded-2xl shadow-xl overflow-hidden";

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#051747]">Audit Logs</h2>
                    <p className="text-[#535F80]">Immutable system activity records for compliance and security.</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
                    {/* @ts-ignore */}
                    <FaDownload /> Export Logs
                </button>
            </div>

            {/* Filters */}
            <div className={`${cardStyle} p-4`}>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        {/* @ts-ignore */}
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search logs by user, action, or resource..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="Success">Success</option>
                            <option value="Failure">Failure</option>
                            <option value="Warning">Warning</option>
                        </select>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200">
                            {/* @ts-ignore */}
                            <FaFilter />
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className={cardStyle}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-[#051747]">
                                <th className="p-4 font-semibold text-sm">Timestamp</th>
                                <th className="p-4 font-semibold text-sm">User</th>
                                <th className="p-4 font-semibold text-sm">Action</th>
                                <th className="p-4 font-semibold text-sm">Resource</th>
                                <th className="p-4 font-semibold text-sm">Status</th>
                                <th className="p-4 font-semibold text-sm">IP Address</th>
                                <th className="p-4 font-semibold text-sm">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-blue-50/30 transition-colors text-gray-700 text-sm">
                                    <td className="p-4 whitespace-nowrap font-mono text-xs text-gray-500">{log.timestamp}</td>
                                    <td className="p-4 font-medium">{log.user}</td>
                                    <td className="p-4">
                                        <span className="flex items-center gap-2">
                                            {/* @ts-ignore */}
                                            <FaClock className="text-gray-400 text-xs" />
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">{log.resource}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                            ${log.status === 'Success' ? 'bg-green-100 text-green-700' :
                                                log.status === 'Failure' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-gray-500">{log.ipAddress}</td>
                                    <td className="p-4 text-gray-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredLogs.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No logs found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
