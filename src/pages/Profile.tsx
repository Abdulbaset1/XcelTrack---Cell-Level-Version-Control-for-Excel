import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getProfileSummary, updateProfileDetails } from '../services/api';

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { user, uploadProfilePicture } = useAuth();
    const { showToast } = useToast();
    const [userData, setUserData] = useState({
        name: user?.name || 'User',
        email: user?.email || 'No Email',
        photoURL: user?.photoURL || null,
        joinDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Joining...',
    });
    const [isLoadingProfileData, setIsLoadingProfileData] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        if (user) {
            setUserData({
                name: user.name || 'User',
                email: user.email || 'No Email',
                photoURL: user.photoURL || null,
                joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Just joined'
            });
            setEditName(user.name || user.displayName || '');
        }
    }, [user]);

    const [stats, setStats] = useState({
        excelFiles: 0,
        collaborations: 0,
        revisions: 0,
        storageUsed: '0 B',
        storageLimit: '500 MB',
        storageUsedBytes: 0,
        storageLimitBytes: 500 * 1024 * 1024,
        storageUsagePercent: 0,
    });

    const [recentActivity, setRecentActivity] = useState<Array<{ id: number; action: string; file: string; time: string }>>([]);

    const formatBytes = (bytes: number) => {
        if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let value = bytes;
        let unitIndex = 0;
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex += 1;
        }
        return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
    };

    const formatRelativeTime = (timestamp: string) => {
        const t = new Date(timestamp).getTime();
        if (!Number.isFinite(t)) return 'Just now';
        const diffMs = Date.now() - t;
        const diffMin = Math.max(1, Math.floor(diffMs / 60000));
        if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `${diffH} hour${diffH === 1 ? '' : 's'} ago`;
        const diffD = Math.floor(diffH / 24);
        if (diffD < 7) return `${diffD} day${diffD === 1 ? '' : 's'} ago`;
        const diffW = Math.floor(diffD / 7);
        return `${diffW} week${diffW === 1 ? '' : 's'} ago`;
    };

    const fetchLiveProfileData = async () => {
        if (!user?.uid) return;

        setIsLoadingProfileData(true);
        try {
            const response = await getProfileSummary(user.uid, user.uid);

            setUserData((prev) => ({
                ...prev,
                name: response.user.name || prev.name,
                email: response.user.email || prev.email,
                joinDate: response.user.created_at
                    ? new Date(response.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : prev.joinDate,
            }));

            setStats({
                excelFiles: response.stats.excelFiles,
                collaborations: response.stats.collaborations,
                revisions: response.stats.revisions,
                storageUsed: formatBytes(response.stats.storageUsedBytes),
                storageLimit: formatBytes(response.stats.storageLimitBytes),
                storageUsedBytes: response.stats.storageUsedBytes,
                storageLimitBytes: response.stats.storageLimitBytes,
                storageUsagePercent: response.stats.storageUsagePercent,
            });

            setRecentActivity((response.recentActivity || []).map((item) => ({
                id: item.id,
                action: item.action,
                file: item.file,
                time: formatRelativeTime(item.timestamp),
            })));
        } catch (error: any) {
            showToast(error?.message || 'Failed to fetch profile data', 'error');
        } finally {
            setIsLoadingProfileData(false);
        }
    };

    useEffect(() => {
        if (!user?.uid) return;

        fetchLiveProfileData();
        const intervalId = window.setInterval(fetchLiveProfileData, 30000);
        return () => window.clearInterval(intervalId);
    }, [user?.uid]);

    const handleSaveProfile = async () => {
        if (!user?.uid) return;
        const normalizedName = editName.trim();

        if (!normalizedName) {
            showToast('Name cannot be empty', 'warning');
            return;
        }

        setIsSavingProfile(true);
        try {
            await updateProfileDetails(user.uid, { user_id: user.uid, name: normalizedName });
            setUserData((prev) => ({ ...prev, name: normalizedName }));
            setIsEditingProfile(false);
            showToast('Profile updated successfully', 'success');
            await fetchLiveProfileData();
        } catch (error: any) {
            showToast(error?.message || 'Failed to update profile', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="relative z-0">
                {/* Glassmorphism Card */}
                <div className="bg-[var(--bg-card)] backdrop-blur-lg border border-[var(--border-color)] rounded-2xl shadow-xl p-8 hover:shadow-[0_20px_50px_var(--shadow-color)] transition-all duration-300">
                    {/* Header Navigation */}
                    <div className="flex items-center justify-between mb-8">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center space-x-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-300 font-medium hover:scale-105 hover:shadow-sm px-3 py-2 rounded-lg -ml-3"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Back to Dashboard</span>
                        </Link>

                        <div className="flex items-center space-x-4">
                            <button
                                className="btn-watch-demo shadow-lg"
                                onClick={() => setIsEditingProfile((prev) => !prev)}
                            >
                                {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                            </button>
                            <button
                                className="btn-watch-demo shadow-lg bg-white text-[#051747] border-gray-200 hover:text-white"
                                onClick={() => navigate('/settings')}
                            >
                                Settings
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Profile Card */}
                        <div className="lg:col-span-1">
                            <ProfileCard userData={userData} stats={stats} onUploadPicture={uploadProfilePicture} />
                        </div>

                        {/* Right Column - Details & Activity */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Personal Information Section */}
                            <div className="relative group/card">
                                <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>
                                <div className="bg-white/90 backdrop-blur-lg border border-white/60 rounded-2xl shadow-xl p-8 hover:shadow-[0_25px_60px_rgba(59,130,246,0.5)] hover:bg-blue-100 transition-all duration-300">
                                    <h2 className="text-2xl font-bold text-[#051747] mb-6 flex items-center">
                                        <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Personal Information
                                    </h2>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-[#535F80] mb-2">Full Name</label>
                                            {isEditingProfile ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(event) => setEditName(event.target.value)}
                                                    className="w-full bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-3 text-[#051747] font-medium focus:outline-none focus:border-blue-500"
                                                />
                                            ) : (
                                                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-3 text-[#051747] font-medium">
                                                    {userData.name}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-[#535F80] mb-2">Email Address</label>
                                            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-3 text-[#051747] font-medium">
                                                {userData.email}
                                            </div>
                                        </div>

                                        {isEditingProfile && (
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={handleSaveProfile}
                                                    disabled={isSavingProfile}
                                                    className="btn-watch-demo shadow-lg"
                                                >
                                                    {isSavingProfile ? 'Saving...' : 'Save Profile'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity Section */}
                            <div className="relative group/card">
                                <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>
                                <div className="bg-white/90 backdrop-blur-lg border border-white/60 rounded-2xl shadow-xl p-8 hover:shadow-[0_25px_60px_rgba(59,130,246,0.5)] hover:bg-blue-100 transition-all duration-300">
                                    <h2 className="text-2xl font-bold text-[#051747] mb-6 flex items-center">
                                        <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Recent Activity
                                    </h2>

                                    {isLoadingProfileData && (
                                        <p className="text-sm text-[#535F80] mb-4">Refreshing live activity...</p>
                                    )}

                                    <div className="space-y-4">
                                        {recentActivity.length === 0 && !isLoadingProfileData && (
                                            <div className="p-4 bg-white rounded-lg border-2 border-gray-300 text-[#535F80]">
                                                No activity found yet.
                                            </div>
                                        )}
                                        {recentActivity.map((activity) => (
                                            <div key={activity.id} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-300 hover:border-blue-300 hover:shadow-md transition-all">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.action === 'Updated' ? 'bg-blue-100 text-blue-600' :
                                                        activity.action === 'Reverted' ? 'bg-red-100 text-red-600' :
                                                            activity.action === 'Created' ? 'bg-purple-100 text-purple-600' :
                                                                'bg-green-100 text-green-600'
                                                        }`}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            {activity.action === 'Updated' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />}
                                                            {activity.action === 'Created' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />}
                                                            {activity.action === 'Reverted' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11a4 4 0 110 8H9m0 0l3-3m-3 3l3 3" />}
                                                            {activity.action !== 'Updated' && activity.action !== 'Created' && activity.action !== 'Reverted' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />}
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[#051747]">
                                                            {activity.action} <span className="text-blue-600">{activity.file}</span>
                                                        </p>
                                                        <p className="text-sm text-[#535F80]">{activity.time}</p>
                                                    </div>
                                                </div>
                                                <button className="text-[#535F80] hover:text-[#051747] transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;