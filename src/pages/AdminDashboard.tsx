import React, { useState } from 'react';
import '../components/admin-dashboard.css';
import UsersPage from './users';
import AuditLogs from './AuditLogs';
import Compliance from './Compliance';
import { FaUsers, FaClipboardList, FaShieldAlt, FaHdd } from 'react-icons/fa';
import { FaSignOutAlt, FaSearch, FaBell } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Type definitions
interface SystemStatus {
    serverStatus: 'Operational' | 'Degraded' | 'Down';
    lastBackup: string;
    securityAlerts: number;
    activeSessions: number;
}

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audit' | 'compliance'>('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    // Mock System Status (FR9.1, FR9.2)
    const systemStatus: SystemStatus = {
        serverStatus: 'Operational',
        lastBackup: 'Today, 04:00 AM',
        securityAlerts: 0,
        activeSessions: 12
    };

    const handleSignOut = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Styling constants for Light Sapphire Theme
    const cardStyle = "bg-white backdrop-blur-lg border border-white/60 rounded-2xl shadow-xl p-6 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)]";
    const navItemStyle = (isActive: boolean) => `
        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
        ${isActive
            ? 'bg-blue-600 text-white shadow-lg border border-white/10'
            : 'text-blue-200 hover:bg-white/5 hover:text-white'}
    `;

    return (
        <div className="flex h-screen bg-[#F3F4F6] overflow-hidden font-sans">
            {/* Sidebar */}
            {/* Sidebar */}
            <aside
                className={`bg-[#0D2440] border-r border-white/10 transition-all duration-300 z-20 flex flex-col
                    ${sidebarOpen ? 'w-64' : 'w-20'}
                `}
            >
                {/* Logo Area */}
                <div className="h-20 flex items-center justify-center border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg p-1">
                            <img src="/logo.png" alt="XcelTrack Logo" className="w-full h-full object-contain" />
                        </div>
                        {sidebarOpen && (
                            <span className="text-xl font-bold text-white tracking-wide">
                                XcelTrack
                            </span>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {/* Main Menu */}
                    {sidebarOpen && <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 mt-4 px-4">Menu</div>}

                    <button onClick={() => setActiveTab('overview')} className={navItemStyle(activeTab === 'overview')}>
                        {/* @ts-ignore */}
                        <FaHdd className="text-lg" />
                        {sidebarOpen && <span>Overview</span>}
                    </button>

                    <button onClick={() => setActiveTab('users')} className={navItemStyle(activeTab === 'users')}>
                        {/* @ts-ignore */}
                        <FaUsers className="text-lg" />
                        {sidebarOpen && <span>User Management</span>}
                    </button>

                    <button onClick={() => setActiveTab('audit')} className={navItemStyle(activeTab === 'audit')}>
                        {/* @ts-ignore */}
                        <FaClipboardList className="text-lg" />
                        {sidebarOpen && <span>Audit Logs</span>}
                    </button>

                    <button onClick={() => setActiveTab('compliance')} className={navItemStyle(activeTab === 'compliance')}>
                        {/* @ts-ignore */}
                        <FaShieldAlt className="text-lg" />
                        {sidebarOpen && <span>Compliance Reports</span>}
                    </button>
                </nav>

                {/* User & Logout */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-white/5 hover:text-red-300 transition-all"
                    >
                        {/* @ts-ignore */}
                        <FaSignOutAlt className="text-lg" />
                        {sidebarOpen && <span className="font-medium">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden flex flex-col relative w-full">
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleSidebar} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-[#051747]">
                                {activeTab === 'overview' ? 'System Overview' :
                                    activeTab === 'users' ? 'User Management' :
                                        activeTab === 'audit' ? 'Audit Logs' : 'Compliance Reports'}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative hidden md:block">
                            {/* @ts-ignore */}
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
                            />
                        </div>
                        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                            {/* @ts-ignore */}
                            <FaBell className="text-lg" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-[#051747]">{user?.name || 'Admin User'}</p>
                                <p className="text-xs text-gray-500">System Administrator</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent -z-10 pointer-events-none"></div>

                    {activeTab === 'overview' && (
                        <div className="space-y-8 max-w-7xl mx-auto">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className={cardStyle}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 rounded-lg bg-green-100 text-green-600">
                                            {/* @ts-ignore */}
                                            <FaHdd className="text-xl" />
                                        </div>
                                        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">Passed</span>
                                    </div>
                                    <h3 className="text-gray-500 text-sm font-medium">Server Status</h3>
                                    <p className="text-2xl font-bold text-[#051747] mt-1">{systemStatus.serverStatus}</p>
                                </div>

                                <div className={cardStyle}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                                            {/* @ts-ignore */}
                                            <FaUsers className="text-xl" />
                                        </div>
                                        <span className="text-green-500 text-xs font-bold">Live</span>
                                    </div>
                                    <h3 className="text-gray-500 text-sm font-medium">Active Sessions</h3>
                                    <p className="text-2xl font-bold text-[#051747] mt-1">{systemStatus.activeSessions}</p>
                                </div>

                                <div className={cardStyle}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                                            {/* @ts-ignore */}
                                            <FaClipboardList className="text-xl" />
                                        </div>
                                        <span className="text-xs text-gray-400">Total</span>
                                    </div>
                                    <h3 className="text-gray-500 text-sm font-medium">Audit Logs Today</h3>
                                    <p className="text-2xl font-bold text-[#051747] mt-1">1,245</p>
                                </div>

                                <div className={cardStyle}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                                            {/* @ts-ignore */}
                                            <FaShieldAlt className="text-xl" />
                                        </div>
                                        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">Secure</span>
                                    </div>
                                    <h3 className="text-gray-500 text-sm font-medium">Security Alerts</h3>
                                    <p className="text-2xl font-bold text-[#051747] mt-1">{systemStatus.securityAlerts}</p>
                                </div>
                            </div>

                            {/* Main Content Sections */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className={`${cardStyle} h-96`}>
                                    <h3 className="text-lg font-bold text-[#051747] mb-6">Platform Usage Trends</h3>
                                    <div className="w-full h-64 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 border-dashed">
                                        <span className="text-gray-400 text-sm">Chart Visualization Placeholder</span>
                                    </div>
                                </div>

                                <div className={`${cardStyle} h-96`}>
                                    <h3 className="text-lg font-bold text-[#051747] mb-6">System Health Details</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="font-semibold text-gray-700">Database Backup</p>
                                                <p className="text-xs text-gray-500">Last run: {systemStatus.lastBackup}</p>
                                            </div>
                                            <span className="text-green-600 font-bold text-sm">Completed</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="font-semibold text-gray-700">API Latency</p>
                                                <p className="text-xs text-gray-500">Average response time</p>
                                            </div>
                                            <span className="text-blue-600 font-bold text-sm">45ms</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="font-semibold text-gray-700">Storage Authorization</p>
                                                <p className="text-xs text-gray-500">Encryption status</p>
                                            </div>
                                            <span className="text-green-600 font-bold text-sm">Active (AES-256)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && <UsersPage />}
                    {activeTab === 'audit' && <AuditLogs />}
                    {activeTab === 'compliance' && <Compliance />}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
