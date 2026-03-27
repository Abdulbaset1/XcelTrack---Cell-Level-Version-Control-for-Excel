import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../components/admin-dashboard.css';
import CommitPage from './commit';
import UsersPage from './users';
import SettingsPage from './adminsetting';
import AdminProfile from './adminprofile';
import AuditLogsPage from './AuditLogs';
import AnalyticsPage from './analytics';
import { FaUsers, FaFile } from 'react-icons/fa6';
import { FaGitAlt, FaCog, FaSignOutAlt, FaListAlt, FaDatabase, FaSync, FaChartBar } from 'react-icons/fa';
import { MdDashboard, MdSettings } from 'react-icons/md';
import { getAdminStats, getRecentActivity, AdminStats, RecentActivityCommit } from '../services/api';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'commits' | 'users' | 'settings' | 'profile' | 'logs' | 'analytics'>('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [recentCommits, setRecentCommits] = useState<RecentActivityCommit[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [statsData, activityData] = await Promise.all([
                getAdminStats(),
                getRecentActivity(10),
            ]);
            setStats(statsData);
            setRecentCommits(activityData.commits);
            setLastUpdated(new Date());
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch dashboard data:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch + 30 second auto-refresh
    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

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

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

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
                                    <FaChartBar className="nav-icon" />
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
                                        <p className="header-subtitle">
                                            Welcome back, {user?.displayName || 'Admin'}!
                                            {lastUpdated && (
                                                <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', opacity: 0.7 }}>
                                                    Last updated: {lastUpdated.toLocaleTimeString()}
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="header-right">
                                        <div className="header-actions">
                                            <button
                                                className="action-btn neu-button"
                                                onClick={fetchDashboardData}
                                                title="Refresh Data"
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                            >
                                                {/* @ts-ignore */}
                                                <FaSync className="action-icon" style={{ fontSize: '0.85rem' }} />
                                            </button>
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

                            {/* Error Banner */}
                            {error && (
                                <div style={{
                                    margin: '1rem',
                                    padding: '0.75rem 1rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    color: '#ef4444',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>⚠ {error}</span>
                                    <button
                                        onClick={fetchDashboardData}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

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
                                        <h3 className="stat-title">Total Users</h3>
                                        <div className="stat-number">
                                            {loading ? '—' : stats?.totalUsers ?? 0}
                                        </div>
                                        <div className="stat-trend positive">
                                            {stats?.recentSignups ? `+${stats.recentSignups} this week` : 'No new signups'}
                                        </div>
                                    </div>
                                </div>

                                <div className={`stat-card neu-card ${hoveredCard === 'commits' ? 'hover-glow' : ''}`}
                                    onMouseEnter={() => setHoveredCard('commits')}
                                    onMouseLeave={() => setHoveredCard(null)}>
                                    <div className="stat-icon-container">
                                        {/* @ts-ignore */}
                                        <FaFile className="stat-icon neu-icon" />
                                        <div className="stat-pulse"></div>
                                    </div>
                                    <div className="stat-content">
                                        <h3 className="stat-title">Total Versions</h3>
                                        <div className="stat-number">
                                            {loading ? '—' : stats?.totalCommits ?? 0}
                                        </div>
                                        <div className="stat-trend positive">
                                            {stats?.totalWorkbooks ? `${stats.totalWorkbooks} workbooks` : '0 workbooks'}
                                        </div>
                                    </div>
                                </div>

                                <div className={`stat-card neu-card ${hoveredCard === 'conflicts' ? 'hover-glow' : ''}`}
                                    onMouseEnter={() => setHoveredCard('conflicts')}
                                    onMouseLeave={() => setHoveredCard(null)}>
                                    <div className="stat-icon-container">
                                        {/* @ts-ignore */}
                                        <FaGitAlt className="stat-icon neu-icon" />
                                        <div className={`stat-pulse ${(stats?.pendingConflicts ?? 0) > 0 ? 'pulse-warning' : ''}`}></div>
                                    </div>
                                    <div className="stat-content">
                                        <h3 className="stat-title">Pending Conflicts</h3>
                                        <div className="stat-number">
                                            {loading ? '—' : stats?.pendingConflicts ?? 0}
                                        </div>
                                        <div className={`stat-trend ${(stats?.pendingConflicts ?? 0) > 0 ? 'warning' : 'positive'}`}>
                                            {(stats?.pendingConflicts ?? 0) > 0 ? '⚠ Requires attention' : '✓ All clear'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="content-grid">
                                {/* Activity Panel */}
                                <div className="content-panel glass-panel" style={{ gridColumn: '1 / -1' }}>
                                    <div className="panel-header">
                                        <h2 className="panel-title">Recent Activity</h2>
                                        {recentCommits.length > 0 && (
                                            <span className="panel-badge neu-badge" style={{ background: 'rgba(99,102,241,0.2)', color: '#6366f1' }}>
                                                {recentCommits.length} items
                                            </span>
                                        )}
                                    </div>
                                    <div className="activity-list">
                                        {loading ? (
                                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                                Loading activity...
                                            </div>
                                        ) : recentCommits.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                                No activity yet. Commit changes to a workbook to see activity here.
                                            </div>
                                        ) : (
                                            recentCommits.map((commit, index) => (
                                                <div
                                                    key={commit.id}
                                                    className="activity-item slide-in"
                                                    style={{ animationDelay: `${index * 0.1}s` }}
                                                >
                                                    <div className="activity-content">
                                                        <div className="activity-header">
                                                            <span className="activity-user">{commit.user_name || commit.user_email || commit.user_id}</span>
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
                                                        <p className="activity-message">{commit.message}</p>
                                                        <span className="activity-time">
                                                            {formatTimeAgo(commit.timestamp)} · {commit.changes_count} cell changes
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* System Overview Panel */}
                            <div className="content-panel glass-panel full-width">
                                <div className="panel-header">
                                    <h2 className="panel-title">System Overview</h2>
                                </div>
                                <div className="system-overview">
                                    <div className="overview-item">
                                        <h3>Database Storage</h3>
                                        <div className="progress-container">
                                            <div className="progress-track neu-progress">
                                                <div
                                                    className="progress-fill progress-glow"
                                                    style={{ width: `${Math.min(((stats?.storageBytesUsed ?? 0) / (2 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span>
                                                {loading ? '—' : `${formatBytes(stats?.storageBytesUsed ?? 0)} used`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overview-item">
                                        <h3>Workbooks</h3>
                                        <div className="sessions-display">
                                            <div className="session-dots">
                                                {/* @ts-ignore */}
                                                <FaDatabase style={{ color: '#6366f1', fontSize: '1.2rem' }} />
                                            </div>
                                            <div className="sessions-count">
                                                {loading ? '—' : stats?.totalWorkbooks ?? 0}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overview-item">
                                        <h3>Server Status</h3>
                                        <div className="status-container">
                                            <div className="status-indicator"></div>
                                            <span>{error ? 'Connection issue' : 'All systems operational'}</span>
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