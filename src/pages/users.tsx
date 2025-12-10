import React, { useState } from 'react';
import { FaTrash, FaPen, FaKey, FaBan } from 'react-icons/fa6';
import { FaShieldAlt } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'analyst' | 'viewer';
    status: 'active' | 'inactive' | 'pending';
    joinDate: string;
    lastActive: string;
}


const UsersPage: React.FC = () => {
    const { resetPassword } = useAuth();
    const [users, setUsers] = useState<User[]>([]);

    // Form and Editing State
    const [formData, setFormData] = useState({ name: '', email: '', password: 'password123', role: 'analyst' as const, country: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');

    React.useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users');
            if (response.ok) {
                const data = await response.json();
                // Map backend fields to frontend User interface
                const mappedUsers: User[] = data.map((u: any) => ({
                    id: u.firebase_uid,
                    name: u.name,
                    email: u.email,
                    role: u.role.toLowerCase(), // Ensure lowercase for UI logic
                    status: 'active', // Default to active as backend doesn't track status yet
                    joinDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '',
                    lastActive: new Date().toISOString().split('T')[0] // Mock last active
                }));
                setUsers(mappedUsers);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            // setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleEditClick = (user: User) => {
        setIsEditing(true);
        setEditingUserId(user.id);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Don't fill password on edit
            role: user.role as any,
            country: '' // Backend might not have country, or we need to fetch it.
        });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingUserId(null);
        setFormData({ name: '', email: '', password: 'password123', role: 'analyst', country: '' });
    };

    const handleFormSubmit = async () => {
        if (!formData.name || !formData.email) {
            alert('Please fill in all fields');
            return;
        }

        try {
            let response;
            if (isEditing && editingUserId) {
                // UPDATE USER
                response = await fetch(`http://localhost:5000/api/admin/users/${editingUserId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        name: formData.name,
                        role: formData.role
                    })
                });
            } else {
                // CREATE USER
                response = await fetch('http://localhost:5000/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password || 'password123',
                        name: formData.name,
                        role: formData.role,
                        country: formData.country
                    })
                });
            }

            if (response.ok) {
                fetchUsers();
                handleCancelEdit(); // Reset form
                alert(isEditing ? 'User updated successfully' : 'User added successfully');
            } else {
                const data = await response.json();
                alert(`Failed to ${isEditing ? 'update' : 'add'} user: ${data.error}`);
            }
        } catch (error) {
            console.error("Error saving user:", error);
            alert("Error saving user");
        }
    };

    const deleteUser = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setUsers(prev => prev.filter(u => u.id !== id));
            } else {
                alert("Failed to delete user");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };


    const handleResetPassword = async (email: string) => {
        if (!window.confirm(`Send password reset email to ${email}?`)) return;
        try {
            await resetPassword(email);
            alert(`Password reset email sent to ${email}`);
        } catch (error) {
            console.error("Error sending reset email:", error);
            alert("Failed to send reset email");
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return '#ef4444';
            case 'analyst': return '#3b82f6';
            case 'viewer': return '#8b5cf6';
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
                                                background: '#10b981',
                                            }}
                                        ></div>
                                        <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 500 }}>
                                            Active
                                        </span>
                                    </div>

                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                        Joined: {user.joinDate}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => handleEditClick(user)}
                                            style={{
                                                padding: '0.4rem 0.6rem',
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                            }}
                                            title="Edit User"
                                        >
                                            {/* @ts-ignore */}
                                            <FaPen size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleResetPassword(user.email)}
                                            style={{
                                                padding: '0.4rem 0.6rem',
                                                background: '#f59e0b',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                            }}
                                            title="Reset Password"
                                        >
                                            {/* @ts-ignore */}
                                            <FaKey size={12} />
                                        </button>
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
                                            title="Delete User"
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

                {/* Add/Edit User Panel */}
                <div className="content-panel glass-panel" style={{ height: 'fit-content', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        {/* @ts-ignore */}
                        <FaPlus size={16} />
                        <h3 style={{ margin: 0 }}>{isEditing ? 'Edit User' : 'Add New User'}</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Full name"
                                className="glass-input"
                                style={{ width: '100%', marginTop: '0.25rem' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="user@example.com"
                                className="glass-input"
                                style={{ width: '100%', marginTop: '0.25rem' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Role</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                                className="glass-input"
                                style={{ width: '100%', marginTop: '0.25rem' }}
                            >
                                <option value="viewer">Viewer</option>
                                <option value="analyst">Analyst</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleFormSubmit}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: 'linear-gradient(135deg, rgba(47, 94, 154, 1) 0%, rgba(47, 94, 154, 0.9) 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    marginTop: '0.5rem',
                                    transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 4px 12px rgba(47, 94, 154, 0.3)',
                                }}
                            >
                                {isEditing ? 'Update User' : 'Add User'}
                            </button>
                            {isEditing && (
                                <button
                                    onClick={handleCancelEdit}
                                    style={{
                                        padding: '0.75rem',
                                        background: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        marginTop: '0.5rem',
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border-soft)' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Total Users:</span>
                            <strong>{users.length}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersPage;