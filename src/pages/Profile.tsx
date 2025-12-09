import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
    const { user, uploadProfilePicture } = useAuth();
    const [userData, setUserData] = useState({
        name: user?.name || 'User',
        email: user?.email || 'No Email',
        photoURL: user?.photoURL || null,
        joinDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Joining...',
    });

    useEffect(() => {
        if (user) {
            setUserData({
                name: user.name || 'User',
                email: user.email || 'No Email',
                photoURL: user.photoURL || null,
                joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Just joined'
            });
        }
    }, [user]);

    const [stats] = useState({
        excelFiles: 47,
        collaborations: 23,
        revisions: 156,
        storageUsed: '2.3 GB'
    });

    const [recentActivity] = useState([
        { id: 1, action: 'Updated', file: 'Q4 Financial Report.xlsx', time: '2 hours ago' },
        { id: 2, action: 'Shared', file: 'Team Budget Planning.xlsx', time: '1 day ago' },
        { id: 3, action: 'Created', file: 'Marketing Analysis Q1.xlsx', time: '3 days ago' },
        { id: 4, action: 'Commented', file: 'Sales Forecast 2024.xlsx', time: '1 week ago' },
    ]);

    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="relative z-0">
                {/* Glassmorphism Card */}
                <div className="bg-white/90 backdrop-blur-lg border border-white/60 rounded-2xl shadow-xl p-8 hover:shadow-[0_20px_50px_rgba(30,64,175,0.4)] transition-all duration-300">
                    {/* Header Navigation */}
                    <div className="flex items-center justify-between mb-8">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center space-x-2 text-[#535F80] hover:text-[#051747] transition-all duration-300 font-medium hover:scale-105 hover:shadow-sm px-3 py-2 rounded-lg -ml-3"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Back to Dashboard</span>
                        </Link>

                        <div className="flex items-center space-x-4">
                            <button className="btn-watch-demo shadow-lg">
                                Edit Profile
                            </button>
                            <button className="btn-watch-demo shadow-lg bg-white text-[#051747] border-gray-200 hover:text-white">
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
                                            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-3 text-[#051747] font-medium">
                                                {userData.name}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-[#535F80] mb-2">Email Address</label>
                                            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-3 text-[#051747] font-medium">
                                                {userData.email}
                                            </div>
                                        </div>
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

                                    <div className="space-y-4">
                                        {recentActivity.map((activity) => (
                                            <div key={activity.id} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-300 hover:border-blue-300 hover:shadow-md transition-all">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.action === 'Updated' ? 'bg-blue-100 text-blue-600' :
                                                        activity.action === 'Shared' ? 'bg-green-100 text-green-600' :
                                                            activity.action === 'Created' ? 'bg-purple-100 text-purple-600' :
                                                                'bg-orange-100 text-orange-600'
                                                        }`}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            {activity.action === 'Updated' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />}
                                                            {activity.action === 'Shared' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />}
                                                            {activity.action === 'Created' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />}
                                                            {activity.action === 'Commented' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />}
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