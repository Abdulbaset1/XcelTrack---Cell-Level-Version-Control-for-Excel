import React, { useState } from 'react';
import { FaCamera, FaUser, FaEnvelope } from 'react-icons/fa';
// import { MdEdit } from 'react-icons/md'; // Removed as edit option is removed

interface AdminProfileData {
    id: string;
    username: string;
    email: string;
    department: string;
    profileImage: string;
    joinDate: string;
    lastLogin: string;
    role: string;
}

const AdminProfile: React.FC = () => {
    const [profile, setProfile] = useState<AdminProfileData>({
        id: 'admin001',
        username: 'Maleeha ',
        email: 'maleeha@xceltrack.com',
        department: 'IT Administration',
        profileImage: 'A',
        joinDate: '2024-01-15',
        lastLogin: '2025-12-07 14:23:15',
        role: 'System Administrator'
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                // For demo, use first letter of username if no actual image logic
                // In real app, this would be the base64 string
                setProfile({ ...profile, profileImage: profile.username.charAt(0).toUpperCase() });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="admin-profile-container">
            {/* Page Header */}
            <div className="profile-page-header">
                <div className="header-content">
                    <h1 className="page-title">Admin Profile</h1>
                    <p className="page-subtitle">Manage your profile picture and view details</p>
                </div>
            </div>

            <div className="profile-content">
                {/* Profile Picture Section */}
                <div className="profile-picture-section glass-panel">
                    <div className="picture-container">
                        <div className="profile-avatar large">
                            <span>{profile.profileImage}</span>
                        </div>
                        <label className="image-upload-label" title="Change Profile Picture">
                            {/* @ts-ignore */}
                            <FaCamera className="camera-icon" />
                            <input
                                type="file"
                                onChange={handleImageChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                    <div className="picture-info">
                        <h2 className="profile-name">{profile.username}</h2>
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
                <div className="profile-details-section glass-panel" style={{ gridColumn: '1 / -1' }}>
                    <h3 className="section-title">Profile Information</h3>

                    <div className="form-grid">
                        {/* Username */}
                        <div className="form-group">
                            <label className="form-label">
                                {/* @ts-ignore */}
                                <FaUser className="label-icon" />
                                Username
                            </label>
                            <div className="form-display">{profile.username}</div>
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label">
                                {/* @ts-ignore */}
                                <FaEnvelope className="label-icon" />
                                Email Address
                            </label>
                            <div className="form-display">{profile.email}</div>
                        </div>

                        {/* Department */}
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <div className="form-display">{profile.department}</div>
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
                </div>


            </div>
        </div>
    );
};

export default AdminProfile;