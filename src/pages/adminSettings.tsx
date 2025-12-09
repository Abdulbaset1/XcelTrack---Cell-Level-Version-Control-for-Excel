import React, { useState } from 'react';
import { FaSave, FaKey, FaBell, FaShieldAlt, FaDatabase, FaCog } from 'react-icons/fa';

interface AdminProfile {
    name: string;
    email: string;
    phone: string;
    department: string;
    lastLogin: string;
    twoFactorEnabled: boolean;
}

interface SystemSettings {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    auditLogging: boolean;
    maxSessionTime: number;
    passwordExpiry: number;
    mfaRequired: boolean;
    dataEncryption: boolean;
}

interface NotificationSettings {
    emailOnNewUser: boolean;
    emailOnFailedLogin: boolean;
    emailOnDataExport: boolean;
    emailOnSystemAlert: boolean;
    smsAlerts: boolean;
}

const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system' | 'notifications'>('profile');
    const [profile, setProfile] = useState<AdminProfile>({
        name: 'Admin User',
        email: 'admin@xceltrack.com',
        phone: '+1-234-567-8900',
        department: 'IT Administration',
        lastLogin: '2025-12-07 14:23:15',
        twoFactorEnabled: true,
    });

    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        autoBackup: true,
        backupFrequency: 'daily',
        auditLogging: true,
        maxSessionTime: 480,
        passwordExpiry: 90,
        mfaRequired: true,
        dataEncryption: true,
    });

    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        emailOnNewUser: true,
        emailOnFailedLogin: true,
        emailOnDataExport: true,
        emailOnSystemAlert: true,
        smsAlerts: false,
    });

    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

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

    const handleSystemSettingsUpdate = () => {
        setSuccessMessage('System settings updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleNotificationSettingsUpdate = () => {
        setSuccessMessage('Notification preferences updated!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    return (
        <div className="settings-page" style={{ padding: '0' }}>
            {/* Header */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title">Settings & Administration</h1>
                        <p className="header-subtitle">Manage admin profile, security, system configuration, and notifications.</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', maxWidth: '100%' }}>
                {/* Sidebar Tabs */}
                <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                        { id: 'profile', label: 'Profile', icon: '👤' },
                        { id: 'security', label: 'Security', icon: '🔒' },
                        { id: 'system', label: 'System', icon: '⚙️' },
                        { id: 'notifications', label: 'Notifications', icon: '🔔' },
                    ].map(tab => (
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
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Phone</label>
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={e => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                                        className="glass-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Department</label>
                                    <input
                                        type="text"
                                        value={profile.department}
                                        onChange={e => setProfile(prev => ({ ...prev, department: e.target.value }))}
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
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Two-Factor Authentication</div>
                                        <div style={{ fontSize: '0.9rem', color: profile.twoFactorEnabled ? '#10b981' : '#ef4444' }}>
                                            {profile.twoFactorEnabled ? '✓ Enabled' : '✕ Disabled'}
                                        </div>
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h3 style={{ margin: 0 }}>Security Options</h3>
                                {[
                                    { key: 'twoFactorEnabled', label: 'Two-Factor Authentication', desc: 'Require 2FA for login' },
                                ].map(option => (
                                    <div key={option.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '6px' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{option.label}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{option.desc}</div>
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={profile.twoFactorEnabled}
                                                onChange={e => setProfile(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            />
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* System Tab */}
                    {activeTab === 'system' && (
                        <div className="content-panel glass-panel">
                            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>System Configuration</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                {[
                                    { key: 'autoBackup', label: 'Automatic Backup', desc: 'Enable automatic system backups' },
                                    { key: 'auditLogging', label: 'Audit Logging', desc: 'Log all system activities and user actions' },
                                    { key: 'mfaRequired', label: 'Require MFA', desc: 'Force multi-factor authentication for all users' },
                                    { key: 'dataEncryption', label: 'Data Encryption', desc: 'Encrypt sensitive data at rest' },
                                ].map(option => (
                                    <div key={option.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{option.label}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{option.desc}</div>
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={systemSettings[option.key as keyof SystemSettings] as boolean}
                                                onChange={e => setSystemSettings(prev => ({ ...prev, [option.key]: e.target.checked }))}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            />
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Backup Frequency</label>
                                    <select
                                        value={systemSettings.backupFrequency}
                                        onChange={e => setSystemSettings(prev => ({ ...prev, backupFrequency: e.target.value as any }))}
                                        className="glass-input"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Max Session Time (minutes)</label>
                                    <input
                                        type="number"
                                        value={systemSettings.maxSessionTime}
                                        onChange={e => setSystemSettings(prev => ({ ...prev, maxSessionTime: parseInt(e.target.value) || 0 }))}
                                        className="glass-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Password Expiry (days)</label>
                                    <input
                                        type="number"
                                        value={systemSettings.passwordExpiry}
                                        onChange={e => setSystemSettings(prev => ({ ...prev, passwordExpiry: parseInt(e.target.value) || 0 }))}
                                        className="glass-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setSystemSettings({
                                        ...systemSettings,
                                        autoBackup: (document.querySelector('input[data-setting="autoBackup"]') as HTMLInputElement)?.checked || false,
                                        mfaRequired: (document.querySelector('input[data-setting="mfaRequired"]') as HTMLInputElement)?.checked || false,
                                        dataEncryption: (document.querySelector('input[data-setting="dataEncryption"]') as HTMLInputElement)?.checked || false,
                                        auditLogging: (document.querySelector('input[data-setting="auditLogging"]') as HTMLInputElement)?.checked || false,
                                    });
                                }}
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
                                <FaCog size={16} /> Save System Settings
                            </button>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="content-panel glass-panel">
                            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Notification Preferences</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                {[
                                    { key: 'emailOnNewUser', label: 'New User Registration', desc: 'Email notification when new user joins' },
                                    { key: 'emailOnFailedLogin', label: 'Failed Login Attempts', desc: 'Alert on suspicious login activity' },
                                    { key: 'emailOnDataExport', label: 'Data Export Notifications', desc: 'Notify when users export data' },
                                    { key: 'emailOnSystemAlert', label: 'System Alerts', desc: 'Critical system notifications' },
                                    { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive SMS for critical incidents' },
                                ].map(option => (
                                    <div key={option.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{option.label}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{option.desc}</div>
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={notificationSettings[option.key as keyof NotificationSettings] as boolean}
                                                onChange={e => setNotificationSettings(prev => ({ ...prev, [option.key]: e.target.checked }))}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            />
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    setNotificationSettings({
                                        ...notificationSettings,
                                        emailOnNewUser: (document.querySelector('input[data-notification="emailOnNewUser"]') as HTMLInputElement)?.checked || false,
                                        emailOnFailedLogin: (document.querySelector('input[data-notification="emailOnFailedLogin"]') as HTMLInputElement)?.checked || false,
                                        emailOnDataExport: (document.querySelector('input[data-notification="emailOnDataExport"]') as HTMLInputElement)?.checked || false,
                                        emailOnSystemAlert: (document.querySelector('input[data-notification="emailOnSystemAlert"]') as HTMLInputElement)?.checked || false,
                                        smsAlerts: (document.querySelector('input[data-notification="smsAlerts"]') as HTMLInputElement)?.checked || false,
                                    });
                                }}
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
                                <FaBell size={16} /> Save Preferences
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;