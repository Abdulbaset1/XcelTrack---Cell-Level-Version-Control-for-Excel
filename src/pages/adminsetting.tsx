
import React, { useState } from 'react';
import { FaSave, FaKey } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

interface AdminProfile {
    name: string;
    email: string;


    lastLogin: string;
}



const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [profile, setProfile] = useState<AdminProfile>({
        name: user?.displayName || user?.name || 'Admin User',
        email: user?.email || 'admin@xceltrack.com',
        lastLogin: '2025-12-07 14:23:15',
    });

    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    React.useEffect(() => {
        if (user) {
            setProfile(prev => ({
                ...prev,
                name: user.displayName || user.name || prev.name,
                email: user.email || prev.email,
            }));
        }
    }, [user]);

    const handleProfileUpdate = () => {
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handlePasswordChange = () => {
        setErrorMessage('');
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setErrorMessage('All password fields are required');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setErrorMessage('New password and confirmation do not match');
            return;
        }
        if (passwordData.newPassword.length < 8) {
            setErrorMessage('New password must be at least 8 characters');
            return;
        }
        setSuccessMessage('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    return (
        <div className="settings-page" style={{ padding: '0' }}>
            {/* Header */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title">Settings</h1>

                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', maxWidth: '100%' }}>
                {/* Sidebar Tabs */}
                <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                        {
                            id: 'profile',
                            label: 'Profile',
                            icon: '👤',
                        },
                        {
                            id: 'security',
                            label: 'Security',
                            icon: '🔒',
                        },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                color: activeTab === tab.id ? '#6366f1' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab.id ? 600 : 400,
                                textAlign: 'left',
                                transition: 'all .2s ease',
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
                {/* Content Panel */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Messages */}
                    {successMessage && (
                        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', marginBottom: '1rem', color: '#10b981', fontWeight: 500 }}>
                            ✓ {successMessage}
                        </div>
                    )}
                    {errorMessage && (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '1rem', color: '#ef4444', fontWeight: 500 }}>
                            ✕ {errorMessage}
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="content-panel glass-panel">
                            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Admin Profile</h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                        className="glass-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
                                        className="glass-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                            </div>

                            <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Last Login</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{profile.lastLogin}</div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleProfileUpdate}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'linear-gradient(135deg, rgba(47, 94, 154, 1) 0%, rgba(47, 94, 154, 0.9) 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 12px rgba(47, 94, 154, 0.3)',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(13, 35, 64, 1) 0%, rgba(13, 35, 64, 0.95) 100%)';
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(13, 35, 64, 0.4)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(47, 94, 154, 1) 0%, rgba(47, 94, 154, 0.9) 100%)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(47, 94, 154, 0.3)';
                                }}
                            >
                                {/* @ts-ignore */}
                                <FaSave size={16} /> Save Changes
                            </button>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="content-panel glass-panel">
                            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Security Settings</h2>

                            {!showPasswordForm ? (
                                <button
                                    onClick={() => setShowPasswordForm(true)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                    }}
                                >
                                    {/* @ts-ignore */}
                                    <FaKey size={16} /> Change Password
                                </button>
                            ) : (
                                <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 1rem' }}>Change Admin Password</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Current Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.currentPassword}
                                                onChange={e => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                className="glass-input"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={e => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                className="glass-input"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={e => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                className="glass-input"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={handlePasswordChange}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.6rem',
                                                    background: '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Update Password
                                            </button>
                                            <button
                                                onClick={() => setShowPasswordForm(false)}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.6rem',
                                                    background: 'transparent',
                                                    color: 'var(--text-secondary)',
                                                    border: '1px solid var(--border-soft)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
