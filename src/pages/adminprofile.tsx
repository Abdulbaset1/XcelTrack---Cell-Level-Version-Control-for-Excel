import React, { useState } from 'react';
import { FaSave, FaCamera, FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';

interface AdminProfileData {
    id: string;
    username: string;
    email: string;
    phone: string;
    department: string;
    profileImage: string;
    joinDate: string;
    lastLogin: string;
    role: string;
}

const AdminProfile: React.FC = () => {
    const [profile, setProfile] = useState<AdminProfileData>({
        id: 'admin001',
        username: 'Admin User',
        email: 'admin@xceltrack.com',
        phone: '+1-234-567-8900',
        department: 'IT Administration',
        profileImage: 'A',
        joinDate: '2024-01-15',
        lastLogin: '2025-12-07 14:23:15',
        role: 'System Administrator'
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<AdminProfileData>(profile);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditData({ ...editData, [name]: value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                // For demo, use first letter of username
                setEditData({ ...editData, profileImage: editData.username.charAt(0).toUpperCase() });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = () => {
        if (!editData.username.trim()) {
            setErrorMessage('Username cannot be empty');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }
        if (!editData.email.includes('@')) {
            setErrorMessage('Invalid email address');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        setProfile(editData);
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleCancel = () => {
        setEditData(profile);
        setIsEditing(false);
    };

    return (
        <div className="admin-profile-container">
            {/* Page Header */}
            <div className="profile-page-header">
                <div className="header-content">
                    <h1 className="page-title">Admin Profile</h1>
                    <p className="page-subtitle">Manage your profile information and settings</p>
                </div>
                {!isEditing && (
                    <button
                        className="edit-profile-btn neu-button"
                        onClick={() => setIsEditing(true)}
                    >
                        {/* @ts-ignore */}
                        <MdEdit className="btn-icon" />
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Messages */}
            {successMessage && <div className="success-message">{successMessage}</div>}
            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <div className="profile-content">
                {/* Profile Picture Section */}
                <div className="profile-picture-section glass-panel">
                    <div className="picture-container">
                        <div className="profile-avatar large">
                            <span>{editData.profileImage}</span>
                        </div>
                        {isEditing && (
                            <label className="image-upload-label">
                                {/* @ts-ignore */}
                                <FaCamera className="camera-icon" />
                                <input
                                    type="file"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                            </label>
                        )}
                    </div>
                    <div className="picture-info">
                        <h2 className="profile-name">{editData.username}</h2>
                        <p className="profile-role">{profile.role}</p>
                        <div className="profile-meta">
                            <span className="meta-item">
                                <strong>ID:</strong> {profile.id}
                            </span>
                            <span className="meta-item">
                                <strong>Joined:</strong> {profile.joinDate}
                            </span>
                            <span className="meta-item">
                                <strong>Last Login:</strong> {profile.lastLogin}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Profile Details Section */}
                <div className="profile-details-section glass-panel">
                    <h3 className="section-title">Profile Information</h3>

                    <div className="form-grid">
                        {/* Username */}
                        <div className="form-group">
                            <label className="form-label">
                                {/* @ts-ignore */}
                                <FaUser className="label-icon" />
                                Username
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="username"
                                    value={editData.username}
                                    onChange={handleInputChange}
                                    className="form-input glass-input"
                                    placeholder="Enter username"
                                />
                            ) : (
                                <div className="form-display">{profile.username}</div>
                            )}
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label">
                                {/* @ts-ignore */}
                                <FaEnvelope className="label-icon" />
                                Email Address
                            </label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    name="email"
                                    value={editData.email}
                                    onChange={handleInputChange}
                                    className="form-input glass-input"
                                    placeholder="Enter email"
                                />
                            ) : (
                                <div className="form-display">{profile.email}</div>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="form-group">
                            <label className="form-label">
                                {/* @ts-ignore */}
                                <FaPhone className="label-icon" />
                                Phone Number
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    name="phone"
                                    value={editData.phone}
                                    onChange={handleInputChange}
                                    className="form-input glass-input"
                                    placeholder="Enter phone number"
                                />
                            ) : (
                                <div className="form-display">{profile.phone}</div>
                            )}
                        </div>

                        {/* Department */}
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="department"
                                    value={editData.department}
                                    onChange={handleInputChange}
                                    className="form-input glass-input"
                                    placeholder="Enter department"
                                />
                            ) : (
                                <div className="form-display">{profile.department}</div>
                            )}
                        </div>

                        {/* Role */}
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <div className="form-display read-only">{profile.role}</div>
                        </div>

                        {/* Status */}
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <div className="form-display">
                                <span className="status-badge active">Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {isEditing && (
                        <div className="action-buttons">
                            <button
                                className="save-btn neu-button primary"
                                onClick={handleSaveProfile}
                            >
                                {/* @ts-ignore */}
                                <FaSave className="btn-icon" />
                                Save Changes
                            </button>
                            <button
                                className="cancel-btn neu-button secondary"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Account Activity Section */}
                <div className="profile-activity-section glass-panel">
                    <h3 className="section-title">Account Activity</h3>
                    <div className="activity-grid">
                        <div className="activity-item">
                            <span className="activity-label">Total Login</span>
                            <span className="activity-value">247</span>
                        </div>
                        <div className="activity-item">
                            <span className="activity-label">Last Login</span>
                            <span className="activity-value">2 hours ago</span>
                        </div>
                        <div className="activity-item">
                            <span className="activity-label">Files Managed</span>
                            <span className="activity-value">1,256</span>
                        </div>
                        <div className="activity-item">
                            <span className="activity-label">System Changes</span>
                            <span className="activity-value">89</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;