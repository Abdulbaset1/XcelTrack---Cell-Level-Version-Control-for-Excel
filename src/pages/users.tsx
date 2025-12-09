import React, { useState } from 'react';
import { FaTrash } from 'react-icons/fa6';
import { FaUser, FaEdit, FaShieldAlt } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'analyst' | 'viewer';
    status: 'active' | 'inactive' | 'pending';
    joinDate: string;
    lastActive: string;
}

interface Permission {
    resource: string;
    action: string;
}

const rolePermissions: Record<'admin' | 'analyst' | 'viewer', Permission[]> = {
    admin: [
        { resource: 'users', action: 'create' },
        { resource: 'users', action: 'edit' },
        { resource: 'users', action: 'delete' },
        { resource: 'files', action: 'upload' },
        { resource: 'files', action: 'download' },
        { resource: 'reports', action: 'generate' },
        { resource: 'system', action: 'configure' },
    ],
    analyst: [
        { resource: 'files', action: 'upload' },
        { resource: 'files', action: 'download' },
        { resource: 'files', action: 'edit' },
        { resource: 'reports', action: 'view' },
    ],
    viewer: [
        { resource: 'files', action: 'view' },
        { resource: 'reports', action: 'view' },
    ],
};

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([
        { id: 'u1', name: 'Maleeha', email: 'maleeha@example.com', role: 'admin', status: 'active', joinDate: '2024-01-15', lastActive: '2025-12-03' },
        { id: 'u2', name: 'Batool', email: 'batool@example.com', role: 'analyst', status: 'active', joinDate: '2023-11-20', lastActive: '2025-12-03' },
        { id: 'u3', name: 'Rehana', email: 'rehana@example.com', role: 'analyst', status: 'active', joinDate: '2024-06-10', lastActive: '2025-12-01' },
        { id: 'u4', name: 'Basit', email: 'basit@example.com', role: 'viewer', status: 'pending', joinDate: '2025-12-02', lastActive: '2025-12-02' },
        { id: 'u5', name: 'Aly', email: 'aly@example.com', role: 'viewer', status: 'active', joinDate: '2024-03-05', lastActive: '2025-12-01' },
        { id: 'u6', name: 'Zobia', email: 'zobia@example.com', role: 'analyst', status: 'active', joinDate: '2024-05-12', lastActive: '2025-12-02' },
        { id: 'u7', name: 'Amna', email: 'amna@example.com', role: 'viewer', status: 'inactive', joinDate: '2024-02-20', lastActive: '2025-11-25' },

    ]);

    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'analyst' as const });
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const filteredUsers = users.filter(user => {
        const matchesFilter = filter === 'all' || user.status === filter;
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const addUser = () => {
        if (!newUser.name || !newUser.email) {
            alert('Please fill in all fields');
            return;
        }
        const user: User = {
            id: `u${Date.now()}`,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            status: 'pending',
            joinDate: new Date().toISOString().split('T')[0],
            lastActive: new Date().toISOString().split('T')[0],
        };
        setUsers(prev => [user, ...prev]);
        setNewUser({ name: '', email: '', role: 'analyst' });
    };

    const deleteUser = (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    const approveUser = (id: string) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'active' as const } : u));
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return '#ef4444';
            case 'analyst': return '#3b82f6';
            case 'viewer': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'inactive': return '#ef4444';
            case 'pending': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    return (
        <div className="users-page" style={{ padding: '0' }}>
            {/* Header */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title">Users Management</h1>
                        <p className="header-subtitle">Manage system users, roles, and permissions.</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '100%' }}>
                {/* Users List */}
                <div className="content-panel glass-panel" style={{ minWidth: 0 }}>
                    <div className="panel-header">
                        <h2 className="panel-title">All Users</h2>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="glass-input"
                                style={{ flex: 1, minWidth: '150px' }}
                            />
                            <select
                                value={filter}
                                onChange={e => setFilter(e.target.value as any)}
                                className="glass-input"
                                style={{ minWidth: '120px' }}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filteredUsers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                No users found
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '10px',
                                        background: 'rgba(99, 102, 241, 0.05)',
                                        border: '1px solid rgba(99, 102, 241, 0.1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ fontWeight: 600 }}>{user.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        {/* @ts-ignore */}
                                        <FaShieldAlt size={14} style={{ color: getRoleColor(user.role) }} />
                                        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: getRoleColor(user.role) }}>
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div
                                            style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: getStatusColor(user.status),
                                            }}
                                        ></div>
                                        <span style={{ fontSize: '0.9rem', color: getStatusColor(user.status), fontWeight: 500 }}>
                                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                        Joined: {user.joinDate}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {user.status === 'pending' && (
                                            <button
                                                onClick={() => approveUser(user.id)}
                                                style={{
                                                    padding: '0.4rem 0.6rem',
                                                    background: '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Approve
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            style={{
                                                padding: '0.4rem 0.6rem',
                                                background: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                            }}
                                        >
                                            {/* @ts-ignore */}
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Add User Panel */}
                <div className="content-panel glass-panel" style={{ height: 'fit-content', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        {/* @ts-ignore */}
                        <FaPlus size={16} />
                        <h3 style={{ margin: 0 }}>Add New User</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Name</label>
                            <input
                                type="text"
                                value={newUser.name}
                                onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Full name"
                                className="glass-input"
                                style={{ width: '100%', marginTop: '0.25rem' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Email</label>
                            <input
                                type="email"
                                value={newUser.email}
                                onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="user@example.com"
                                className="glass-input"
                                style={{ width: '100%', marginTop: '0.25rem' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Role</label>
                            <select
                                value={newUser.role}
                                onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                                className="glass-input"
                                style={{ width: '100%', marginTop: '0.25rem' }}
                            >
                                <option value="viewer">Viewer</option>
                                <option value="analyst">Analyst</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <button
                            onClick={addUser}
                            style={{
                                padding: '0.75rem',
                                background: 'linear-gradient(135deg, rgba(47, 94, 154, 1) 0%, rgba(47, 94, 154, 0.9) 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                marginTop: '0.5rem',
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
                            Add User
                        </button>
                    </div>

                    {/* Stats */}
                    <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border-soft)' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Total Users:</span>
                            <strong>{users.length}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Active:</span>
                            <strong style={{ color: '#10b981' }}>{users.filter(u => u.status === 'active').length}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Pending:</span>
                            <strong style={{ color: '#f59e0b' }}>{users.filter(u => u.status === 'pending').length}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Inactive:</span>
                            <strong style={{ color: '#ef4444' }}>{users.filter(u => u.status === 'inactive').length}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersPage;