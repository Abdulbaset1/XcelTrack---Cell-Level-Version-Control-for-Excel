import React, { useState, useEffect } from 'react';
import '../components/admin-dashboard.css';
import CommitPage from './commit';
import UsersPage from './users';
import AnalyticsPage from './analytics';
import SettingsPage from './adminSettings';
import AdminProfile from './adminprofile';
import { FaUsers, FaFile, FaBell, FaPencil, FaArrowUpFromBracket } from 'react-icons/fa6';
import { FaGitAlt, FaCog, FaUser, FaSignOutAlt, FaSearch } from 'react-icons/fa';
import { MdDashboard, MdSettings, MdLock, MdShowChart } from 'react-icons/md';

// Type definitions
interface Commit {
    id: string;
    user: string;
    message: string;
    timestamp: Date;
    type: 'edit' | 'merge' | 'upload' | 'conflict';
}

interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: Date;
    priority: 'high' | 'medium' | 'low';
    read: boolean;
}

interface SystemStatus {
    activeUsers: number;
    totalCommits: number;
    pendingMerges: number;
    systemHealth: 'excellent' | 'good' | 'warning' | 'error';
}

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'commits' | 'users' | 'analytics' | 'settings' | 'profile'>('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [recentCommits, setRecentCommits] = useState<Commit[]>([]);
    const [systemStatus, setSystemStatus] = useState<SystemStatus>({
        activeUsers: 0,
        totalCommits: 0,
        pendingMerges: 0,
        systemHealth: 'good'
    });
    const [filter, setFilter] = useState<'all' | Commit['type']>('all');
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    // Mock data - replace with actual API calls
    useEffect(() => {
        const mockNotifications: Notification[] = [
            {
                id: '1',
                title: 'Merge Conflict Detected',
                message: 'Conflict in financial_model.xlsx between user123 and user456',
                timestamp: new Date(),
                priority: 'high',
                read: false
            },
            {
                id: '2',
                title: 'Major Edit Completed',
                message: 'User789 made significant changes to budget_2024.xlsx',
                timestamp: new Date(Date.now() - 300000),
                priority: 'medium',
                read: true
            },
            {
                id: '3',
                title: 'New User Registered',
                message: 'User "analyst_john" joined the system',
                timestamp: new Date(Date.now() - 600000),
                priority: 'low',
                read: true
            }
        ];

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

        setNotifications(mockNotifications);
        setRecentCommits(mockCommits);
        setSystemStatus({
            activeUsers: 42,
            totalCommits: 1256,
            pendingMerges: 3,
            systemHealth: 'good'
        });
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(notif =>
            notif.id === id ? { ...notif, read: true } : notif
        ));
    };

    const filteredCommits = filter === 'all'
        ? recentCommits
        : recentCommits.filter(commit => commit.type === filter);

    const unreadNotifications = notifications.filter(n => !n.read).length;

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleSignOut = () => {
        // Add your sign out logic here
        alert('Signing out...');
        // In a real app, you would redirect to login page or clear session
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
                                    <img src="/imgs/logo.jpg" alt="XcelTrack Logo" className="logo-img" />
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
                                    {sidebarOpen && <span className="nav-text">Commits</span>}
                                </button>
                                <button
                                    className={`nav-item neu-hover ${activeTab === 'users' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('users')}
                                >
                                    {/* @ts-ignore */}
                                    <FaUsers className="nav-icon" />
                                    {sidebarOpen && <span className="nav-text">Users</span>}
                                </button>
                            </div>

                            {/* SYSTEM Section */}
                            <div className="nav-section">
                                {sidebarOpen && <div className="nav-label">SYSTEM</div>}
                                <button
                                    className={`nav-item neu-hover ${activeTab === 'analytics' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('analytics')}
                                >
                                    {/* @ts-ignore */}
                                    <MdShowChart className="nav-icon" />
                                    {sidebarOpen && <span className="nav-text">Analytics</span>}
                                </button>
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
                {/* Show CommitPage when commits tab is active, UsersPage when users active, otherwise show Dashboard */}
                {activeTab === 'commits' ? (
                    <CommitPage />
                ) : activeTab === 'users' ? (
                    <UsersPage />
                ) : activeTab === 'analytics' ? (
                    <AnalyticsPage />
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
                                    <div className="search-container glass-input">
                                        <input type="text" placeholder="Search..." className="search-input" />
                                        <button className="search-btn neu-button">
                                            {/* @ts-ignore */}
                                            <FaSearch className="search-icon" />
                                        </button>
                                    </div>

                                    <div className="header-actions">
                                        <button className="action-btn neu-button pulse-glow">
                                            {/* @ts-ignore */}
                                            <FaBell className="action-icon" />
                                            {unreadNotifications > 0 && (
                                                <span className="notification-badge">{unreadNotifications}</span>
                                            )}
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
                                            <span>M</span>
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
                                </div>
                            </div>

                            <div className="stat-card neu-card">
                                <div className="stat-icon-container">
                                    {/* @ts-ignore */}
                                    <FaFile className="stat-icon neu-icon" />
                                    <div className="stat-pulse"></div>
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-title">Total Commits</h3>
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
                            {/* Notifications Panel */}
                            <div className="content-panel glass-panel">
                                <div className="panel-header">
                                    <h2 className="panel-title">Recent Notifications</h2>
                                    <div className="panel-badge neu-badge">{unreadNotifications} unread</div>
                                </div>
                                <div className="notifications-list">
                                    {notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`notification-item slide-in ${notification.priority} ${notification.read ? 'read' : 'unread'}`}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className="notification-icon">
                                                {notification.priority === 'high' ? (
                                                    <div className="priority-high">!</div>
                                                ) : notification.priority === 'medium' ? (
                                                    <div className="priority-medium">•</div>
                                                ) : (
                                                    <div className="priority-low">i</div>
                                                )}
                                            </div>
                                            <div className="notification-content">
                                                <div className="notification-header">
                                                    <span className="notification-title">{notification.title}</span>
                                                    <span className="notification-time">
                                                        {notification.timestamp.toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="notification-message">{notification.message}</p>
                                            </div>
                                            <div className="notification-arrow">→</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Activity Panel */}
                            <div className="content-panel glass-panel">
                                <div className="panel-header">
                                    <h2 className="panel-title">Recent Activity</h2>
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value as any)}
                                        className="filter-select glass-input"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="edit">Edits</option>
                                        <option value="merge">Merges</option>
                                        <option value="upload">Uploads</option>
                                        <option value="conflict">Conflicts</option>
                                    </select>
                                </div>
                                <div className="activity-list">
                                    {filteredCommits.map((commit, index) => (
                                        <div
                                            key={commit.id}
                                            className="activity-item slide-in"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            <div className="activity-icon-wrapper">
                                                {commit.type === 'edit' ? (
                                                    <>
                                                        {/* @ts-ignore */}
                                                        <FaPencil className="activity-icon edit" />
                                                    </>
                                                ) : commit.type === 'merge' ? (
                                                    <>
                                                        {/* @ts-ignore */}
                                                        <FaGitAlt className="activity-icon merge" />
                                                    </>
                                                ) : commit.type === 'upload' ? (
                                                    <>
                                                        {/* @ts-ignore */}
                                                        <FaArrowUpFromBracket className="activity-icon upload" />
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* @ts-ignore */}
                                                        <FaCog className="activity-icon conflict" />
                                                    </>
                                                )}
                                            </div>
                                            <div className="activity-content">
                                                <div className="activity-header">
                                                    <span className="activity-user">{commit.user}</span>
                                                    <span className={`activity-type ${commit.type}`}>
                                                        {commit.type}
                                                    </span>
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
        </div>
    );
};

export default AdminDashboard;