import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaTrash, FaUserShield, FaUser } from 'react-icons/fa6';
import { FaShieldAlt } from 'react-icons/fa';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    joinDate: string;
    lastActive: string;
}

const UsersPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch users from backend
    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();

            // Map backend data to frontend interface
            const mappedUsers: User[] = data.map((u: any) => ({
                id: u.firebase_uid, // specific mapping for delete/update calls
                name: u.name || 'Unknown',
                email: u.email,
                role: u.role,
                joinDate: new Date(u.created_at).toLocaleDateString(),
                lastActive: 'Recently' // Placeholder as backend doesn't send this yet
            }));
            setUsers(mappedUsers);
            setFilteredUsers(mappedUsers);
            setError('');
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Ensure server is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Filter users based on search and exclude current user
    useEffect(() => {
        let result = users;
        if (currentUser) {
            result = result.filter((u: User) => u.id !== currentUser.uid);
        }
        if (searchTerm) {
            result = result.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredUsers(result);
    }, [searchTerm, users, currentUser]);

    const deleteUser = async (uid: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        setActionLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/admin/users/${uid}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete user');

            setUsers(prev => prev.filter(u => u.id !== uid));
            if (selectedUser?.id === uid) setSelectedUser(null);
            alert('User deleted successfully');
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Failed to delete user. Check console for details.');
        } finally {
            setActionLoading(false);
        }
    };

    const changeRole = async (uid: string, newRole: 'admin' | 'user') => {
        setActionLoading(true);
        try {
            // We need to send name and email as well because the PUT endpoint expects them
            // In a real app, we might want a specific PATCH endpoint for role only
            const userToUpdate = users.find(u => u.id === uid);
            if (!userToUpdate) return;

            const response = await fetch(`http://localhost:5000/api/admin/users/${uid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userToUpdate.email,
                    name: userToUpdate.name,
                    role: newRole
                })
            });

            if (!response.ok) throw new Error('Failed to update role');

            setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u));
            if (selectedUser?.id === uid) {
                setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
            }
        } catch (err) {
            console.error('Error updating role:', err);
            alert('Failed to update role.');
        } finally {
            setActionLoading(false);
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return '#ef4444'; // Red for Admin
            case 'user': return '#3b82f6';  // Blue for User
            default: return '#6b7280';
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                Loading users...
            </div>
        );
    }

    return (
        <div className="users-page" style={{ padding: '0' }}>
            {/* Header */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title">Users Management</h1>
                        <p className="header-subtitle">Manage system users and access levels.</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', maxWidth: '100%' }}>
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
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '1rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', margin: '1rem 0' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filteredUsers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                No users found
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '10px',
                                        background: selectedUser?.id === user.id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                                        border: selectedUser?.id === user.id ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(99, 102, 241, 0.1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{user.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '20px',
                                            background: `${getRoleColor(user.role)}15`,
                                            color: getRoleColor(user.role),
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        }}>
                                            {/* @ts-ignore */}
                                            {user.role === 'admin' ? <FaUserShield size={10} /> : <FaUser size={10} />}
                                            {user.role.toUpperCase()}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            Joined: {user.joinDate}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* User Details & Role Management Panel */}
                <div className="content-panel glass-panel" style={{ height: 'fit-content', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-soft)', paddingBottom: '1rem' }}>
                        {/* @ts-ignore */}
                        <FaShieldAlt size={16} />
                        <h3 style={{ margin: 0 }}>User Management</h3>
                    </div>

                    {selectedUser ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedUser.name}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedUser.email}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>ID: {selectedUser.id}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => deleteUser(selectedUser.id)}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '0.5rem',
                                            background: actionLoading ? '#cbd5e1' : '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        {/* @ts-ignore */}
                                        <FaTrash size={12} /> {actionLoading ? 'Processing...' : 'Delete User'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Change Role</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <button
                                        onClick={() => changeRole(selectedUser.id, 'admin')}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: selectedUser.role === 'admin' ? '2px solid #ef4444' : '1px solid var(--border-soft)',
                                            background: selectedUser.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                            color: selectedUser.role === 'admin' ? '#ef4444' : 'var(--text-primary)',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            transition: 'all 0.2s',
                                            opacity: actionLoading ? 0.7 : 1
                                        }}
                                    >
                                        {/* @ts-ignore */}
                                        <FaUserShield size={20} />
                                        <span style={{ fontWeight: 600 }}>Admin</span>
                                    </button>
                                    <button
                                        onClick={() => changeRole(selectedUser.id, 'user')}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: selectedUser.role === 'user' ? '2px solid #3b82f6' : '1px solid var(--border-soft)',
                                            background: selectedUser.role === 'user' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                            color: selectedUser.role === 'user' ? '#3b82f6' : 'var(--text-primary)',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            transition: 'all 0.2s',
                                            opacity: actionLoading ? 0.7 : 1
                                        }}
                                    >
                                        {/* @ts-ignore */}
                                        <FaUser size={20} />
                                        <span style={{ fontWeight: 600 }}>User</span>
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    Admins have full access. Users have restricted access.
                                </p>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-soft)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Last Active:</span>
                                    <span>{selectedUser.lastActive}</span>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 1rem' }}>
                            <div style={{ marginBottom: '1rem', opacity: 0.5 }}>
                                {/* @ts-ignore */}
                                <FaUser size={32} />
                            </div>
                            <p>Select a user from the list to manage their details and role.</p>
                        </div>
                    )}

                    {/* Stats */}
                    <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border-soft)' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Total Users:</span>
                            <strong>{users.length}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Admins:</span>
                            <strong>{users.filter(u => u.role === 'admin').length}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Users:</span>
                            <strong>{users.filter(u => u.role === 'user').length}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersPage;