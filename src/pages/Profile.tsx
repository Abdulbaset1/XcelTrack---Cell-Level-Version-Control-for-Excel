import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';

const Profile: React.FC = () => {
  const [userData, setUserData] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    jobTitle: 'Senior Data Analyst',
    company: 'TechCorp Inc.',
    joinDate: 'January 2023',
    bio: 'Data enthusiast passionate about spreadsheet automation and version control. Love working with Excel and exploring new data visualization techniques.',
  });

  const [stats, setStats] = useState({
    excelFiles: 47,
    collaborations: 23,
    revisions: 156,
    storageUsed: '2.3 GB'
  });

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, action: 'Updated', file: 'Q4 Financial Report.xlsx', time: '2 hours ago' },
    { id: 2, action: 'Shared', file: 'Team Budget Planning.xlsx', time: '1 day ago' },
    { id: 3, action: 'Created', file: 'Marketing Analysis Q1.xlsx', time: '3 days ago' },
    { id: 4, action: 'Commented', file: 'Sales Forecast 2024.xlsx', time: '1 week ago' },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Navigation */}
        <nav className="flex items-center justify-between mb-8">
          <Link 
            to="/dashboard" 
            className="flex items-center space-x-2 text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
              Edit Profile
            </button>
            <button className="border border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-6 py-2 rounded-lg font-semibold transition-colors">
              Settings
            </button>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <ProfileCard userData={userData} stats={stats} />
          </div>

          {/* Right Column - Details & Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <svg className="w-6 h-6 text-emerald-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                    {userData.name}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Email Address</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                    {userData.email}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Phone Number</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                    {userData.phone}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Location</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                    {userData.location}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Job Title</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                    {userData.jobTitle}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Company</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                    {userData.company}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-600 mb-2">Bio</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 min-h-[100px]">
                  {userData.bio}
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <svg className="w-6 h-6 text-emerald-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Activity
              </h2>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.action === 'Updated' ? 'bg-blue-100 text-blue-600' :
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
                        <p className="font-semibold text-gray-800">
                          {activity.action} <span className="text-emerald-600">{activity.file}</span>
                        </p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                    <button className="text-emerald-600 hover:text-emerald-700 transition-colors">
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
  );
};

export default Profile;