import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { FaCamera, FaUser, FaEnvelope } from 'react-icons/fa';
import { getProfileSummary } from '../services/api';
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
    const { user } = useAuth();
    const { showToast } = useToast();
    const [summaryUser, setSummaryUser] = React.useState<{
        uid: string;
        email: string;
        name: string;
        role: string;
        created_at: string;
    } | null>(null);

    React.useEffect(() => {
        const loadProfile = async () => {
            if (!user?.uid) return;
            try {
                const response = await getProfileSummary(user.uid, user.uid);
                setSummaryUser(response.user);
            } catch (error: any) {
                showToast(error?.message || 'Failed to load admin profile', 'error');
            }
        };

        loadProfile();
    }, [user?.uid, showToast]);

    // We can show a loading state if user is strictly null, but generally this page is protected.
    // However, to be safe:
    if (!user) return null;

    // Determine initials for avatar
    const initials = user.displayName
        ? user.displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U';

    const profileData: AdminProfileData = {
        id: summaryUser?.uid || user.uid,
        username: summaryUser?.name || user.displayName || 'Admin User',
        email: summaryUser?.email || user.email || '',
        department: 'Administration',
        profileImage: initials,
        joinDate: summaryUser?.created_at
            ? new Date(summaryUser.created_at).toLocaleDateString()
            : user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
        lastLogin: 'Not available',
        role: summaryUser?.role || user.role || 'Admin'
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Implement upload logic later if needed
        alert("Profile picture update not yet connected to storage.");
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
                            <span>{profileData.profileImage}</span>
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
                        <h2 className="profile-name">{profileData.username}</h2>
                        <p className="profile-role">{profileData.role}</p>
                        <div className="profile-meta">
                            <span className="meta-item">
                                <strong>ID:</strong> {profileData.id}
                            </span>
                            <span className="meta-item">
                                <strong>Joined:</strong> {profileData.joinDate}
                            </span>
                            <span className="meta-item">
                                <strong>Last Login:</strong> {profileData.lastLogin}
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
                            <div className="form-display">{profileData.username}</div>
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label">
                                {/* @ts-ignore */}
                                <FaEnvelope className="label-icon" />
                                Email Address
                            </label>
                            <div className="form-display">{profileData.email}</div>
                        </div>

                        {/* Department */}
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <div className="form-display">{profileData.department}</div>
                        </div>

                        {/* Role */}
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <div className="form-display read-only">{profileData.role}</div>
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