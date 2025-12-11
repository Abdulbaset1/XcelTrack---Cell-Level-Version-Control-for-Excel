import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../components/admin-dashboard.css';
import CommitPage from './commit';
import UsersPage from './users';
import AnalyticsPage from './analytics';
import SettingsPage from './adminsetting';
import AdminProfile from './adminprofile';
import AuditLogsPage from './AuditLogs';
import { FaUsers, FaFile } from 'react-icons/fa6';
import { FaGitAlt, FaCog, FaSignOutAlt, FaListAlt } from 'react-icons/fa';
import { MdDashboard, MdSettings } from 'react-icons/md';

// Type definitions
interface Commit {
    id: string;
    user: string;
    message: string;
    timestamp: Date;
    type: 'edit' | 'merge' | 'upload' | 'conflict';
}



interface SystemStatus {
    activeUsers: number;
    totalCommits: number;
    pendingMerges: number;
    systemHealth: 'excellent' | 'good' | 'warning' | 'error';
}

const AdminDashboard: React.FC = () => {
    /* Notifications removed as per FR alignment */
    const [activeTab, setActiveTab] = useState<'overview' | 'commits' | 'users' | 'analytics' | 'settings' | 'profile' | 'logs'>('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [recentCommits, setRecentCommits] = useState<Commit[]>([]);
    const [systemStatus, setSystemStatus] = useState<SystemStatus>({
        activeUsers: 42,
        totalCommits: 1256,
        pendingMerges: 3,
        systemHealth: 'good'
    });
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    // Mock data - replace with actual API calls
    useEffect(() => {
        /* Notifications mock data removed */

        const mockCommits: Commit[] = [
            {
                id: 'c1',
                user: 'user123',
                message: 'Updated revenue projections for Q4 2024',
                timestamp: new Date(),
                type: 'edit'
            },
            {
                id: 'c2',
                user: 'user456',
                message: 'Merged budget adjustments from development branch',
                timestamp: new Date(Date.now() - 120000),
                type: 'merge'
            },
            {
                id: 'c3',
                user: 'user789',
                message: 'Uploaded new customer dataset',
                timestamp: new Date(Date.now() - 300000),
                type: 'upload'
            }
        ];

        setRecentCommits(mockCommits);
        setSystemStatus({
            activeUsers: 42,
            totalCommits: 1256,
            pendingMerges: 3,
            systemHealth: 'good'
        });
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    return (
        <div className={`admin-dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            {/* Animated Background */}
            <div className="animated-bg">
                <div className="floating-shape shape-1"></div>
                <div className="floating-shape shape-2"></div>
                <div className="floating-shape shape-3"></div>
            </div>

            {/* Sidebar toggle */}
            <button
                className={`sidebar-toggle-btn ${sidebarOpen ? 'open' : 'closed'}`}
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
            >
                <div className={`hamburger-icon ${sidebarOpen ? 'open' : ''}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </button>

            {/* Sidebar */}
            <div className={`sidebar-container ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-slider">
                    <div className="sidebar-primary">
                        <div className="sidebar-header">
                            <div className="logo-container">
                                <div className="logo-icon">
                                    <img src="/logo.png" alt="XcelTrack Logo" className="logo-img" />
                                </div>
                                {sidebarOpen && <h2 className="logo-text">XcelTrack</h2>}
                            </div>
                        </div>
                        <nav className="sidebar-nav">
                            {/* MAIN Section */}
                            <div className="nav-section">
                                {sidebarOpen && <div className="nav-label">MAIN</div>}
                                <button
                                    className={`nav-item neu-hover ${activeTab === 'overview' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    {/* @ts-ignore */}
                                    <MdDashboard className="nav-icon" />
                                    {sidebarOpen && <span className="nav-text">Dashboard</span>}
                                </button>
                                <button
                                    className={`nav-item neu-hover ${activeTab === 'commits' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('commits')}
                                >
                                    {/* @ts-ignore */}
                                    <FaFile className="nav-icon" />
                                    {sidebarOpen && <span className="nav-text">Versions</span>}
                                </button>
                                <button
                                    className={`nav-item neu-hover ${activeTab === 'users' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('users')}
                                >
                                    {/* @ts-ignore */}
                                    <FaUsers className="nav-icon" />
                                    {sidebarOpen && <span className="nav-text">Users</span>}
                                </button>
                                <button
                                    className={`nav-item neu-hover ${activeTab === 'logs' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('logs')}
                                >
                                    {/* @ts-ignore */}
                                    <FaListAlt className="nav-icon" />
                                    {sidebarOpen && <span className="nav-text">Audit Logs</span>}
                                </button>
                                <button
                                    className={`nav-item neu-hover ${activeTab === 'analytics' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('analytics')}
                                >
                                    {/* @ts-ignore */}
                                    <MdDashboard className="nav-icon" />
                                    {sidebarOpen && <span className="nav-text">Analytics</span>}
                                </button>
                            </div>

                            {/* SYSTEM Section */}
                            <div className="nav-section">
                                {sidebarOpen && <div className="nav-label">SYSTEM</div>}

                                {/* @ts-ignore */}

                                <button
                                    className={`nav-item neu-hover ${activeTab === 'settings' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('settings')}
                                >
                                    {/* @ts-ignore */}
                                    <MdSettings className="nav-icon" />
                                    {sidebarOpen && <span className="nav-text">Settings</span>}
                                </button>
                            </div>

                            {/* Sign Out Section */}
                            <div className="nav-section" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                <button
                                    className="nav-item neu-hover sign-out-btn"
                                    onClick={handleSignOut}
                                    title="Sign Out"
                                >
                                    {/* @ts-ignore */}
                                    <FaSignOutAlt className="nav-icon" />
                                    {sidebarOpen && <span className="nav-text">Sign Out</span>}
                                </button>
                            </div>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                {/* Switch Content based on Tab */}
                {activeTab === 'commits' ? (
                    <CommitPage />
                ) : activeTab === 'users' ? (
                    <UsersPage />
                ) : activeTab === 'analytics' ? (
                    <AnalyticsPage />
                ) : activeTab === 'logs' ? (
                    <AuditLogsPage />

                ) : activeTab === 'settings' ? (
                    <SettingsPage />
                ) : activeTab === 'profile' ? (
                    <AdminProfile />
                ) : (
                    <>
                        {/* Top Header */}
                        <header className="glass-header">
                            <div className="header-content">
                                <div className="header-left">
                                    <h1 className="header-title">
                                        <span className="title-glow">Admin Dashboard</span>
                                    </h1>
                                    <p className="header-subtitle">Welcome back, Admin! Here's what's happening today.</p>
                                </div>

                                <div className="header-right">
                                    {/* Search bar removed */}

                                    <div className="header-actions">
                                        {/* Notifications removed */}
                                        <button
                                            className="action-btn neu-button"
                                            onClick={() => setActiveTab('settings')}
                                            title="Settings"
                                        >
                                            {/* @ts-ignore */}
                                            <FaCog className="action-icon" />
                                        </button>
                                        <button
                                            className="user-avatar neu-avatar"
                                            onClick={() => setActiveTab('profile')}
                                            title="View Admin Profile"
                                        >
                                            {user?.photoURL ? (
                                                <img
                                                    src={user.photoURL}
                                                    alt="User Avatar"
                                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <span>{user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}</span>
                                            )}
                                            <div className="avatar-status"></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <div className={`stat-card neu-card ${hoveredCard === 'users' ? 'hover-glow' : ''}`}
                                onMouseEnter={() => setHoveredCard('users')}
                                onMouseLeave={() => setHoveredCard(null)}>
                                <div className="stat-icon-container">
                                    {/* @ts-ignore */}
                                    <FaUsers className="stat-icon neu-icon" />
                                    <div className="stat-pulse"></div>
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-title">Active Users</h3>
                                    <div className="stat-number">{systemStatus.activeUsers}</div>
                                    <div className="stat-trend positive">↗ +12% this week</div>
                                    <div className="stat-detail">Platform Usage (FR9.1)</div>
                                </div>
                            </div>

                            <div className="stat-card neu-card">
                                <div className="stat-icon-container">
                                    {/* @ts-ignore */}
                                    <FaFile className="stat-icon neu-icon" />
                                    <div className="stat-pulse"></div>
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-title">total versions</h3>
                                    <div className="stat-number">{systemStatus.totalCommits}</div>
                                    <div className="stat-trend positive">↗ +8% today</div>
                                </div>
                            </div>

                            <div className="stat-card neu-card">
                                <div className="stat-icon-container">
                                    {/* @ts-ignore */}
                                    <FaGitAlt className="stat-icon neu-icon" />
                                    <div className="stat-pulse pulse-warning"></div>
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-title">Pending Merges</h3>
                                    <div className="stat-number">{systemStatus.pendingMerges}</div>
                                    <div className="stat-trend warning">⚠ Requires attention</div>
                                </div>
                            </div>
                        </div>

                        <div className="content-grid">
                            {/* Activity Panel Only - Notifications Removed */}
                            <div className="content-panel glass-panel" style={{ gridColumn: '1 / -1' }}>
                                <div className="panel-header">
                                    <h2 className="panel-title">Recent Activity</h2>
                                    {/* Filter buttons removed as requested */}
                                </div>
                                <div className="activity-list">
                                    {recentCommits.map((commit, index) => (
                                        <div
                                            key={commit.id}
                                            className="activity-item slide-in"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            {/* Icons/Buttons removed as requested */}
                                            <div className="activity-content">
                                                <div className="activity-header">
                                                    <span className="activity-user">{commit.user}</span>
                                                    {/* activity-type removed */}
                                                </div>
                                                <p className="activity-message">{commit.message}</p>
                                                <span className="activity-time">
                                                    {commit.timestamp.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* System Overview Panel */}
                        <div className="content-panel glass-panel full-width">
                            <div className="panel-header">
                                <h2 className="panel-title">System Overview</h2>
                                <button className="view-all-btn">
                                    View Detailed Report →
                                </button>
                            </div>
                            <div className="system-overview">
                                <div className="overview-item">
                                    <h3>Storage Usage</h3>
                                    <div className="progress-container">
                                        <div className="progress-track neu-progress">
                                            <div
                                                className="progress-fill progress-glow"
                                                style={{ width: '65%' }}
                                            ></div>
                                        </div>
                                        <span>65% used (1.3GB of 2GB)</span>
                                    </div>
                                </div>

                                <div className="overview-item">
                                    <h3>Active Sessions</h3>
                                    <div className="sessions-display">
                                        <div className="session-dots">
                                            <div className="session-dot"></div>
                                            <div className="session-dot"></div>
                                            <div className="session-dot"></div>
                                            <div className="session-dot"></div>
                                            <div className="session-dot"></div>
                                            <div className="session-dot"></div>
                                        </div>
                                        <div className="sessions-count">24</div>
                                    </div>
                                </div>

                                <div className="overview-item">
                                    <h3>Server Status</h3>
                                    <div className="status-container">
                                        <div className="status-indicator"></div>
                                        <span>All servers operational</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div >
    );
};

export default AdminDashboard;