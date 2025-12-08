import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  // const navigate = useNavigate();
  const { user } = useAuth();

  // Mock data - in real app, this would come from your backend
  const recentFiles = [
    { id: 1, name: 'Q4 Financial Report.xlsx', lastModified: '2 hours ago', size: '2.4 MB' },
    { id: 2, name: 'Team Budget Planning.xlsx', lastModified: '1 day ago', size: '1.8 MB' },
    { id: 3, name: 'Marketing Analysis Q1.xlsx', lastModified: '3 days ago', size: '3.1 MB' },
    { id: 4, name: 'Sales Forecast 2024.xlsx', lastModified: '1 week ago', size: '2.7 MB' },
  ];

  const quickStats = {
    totalFiles: 47,
    activeCollaborations: 5,
    storageUsed: '2.3 GB',
    lastLogin: '2 hours ago'
  };



  // Styles updated for Light Sapphire Theme with Tilted Background Effect
  const cardStyle = "bg-white backdrop-blur-lg border border-white/60 rounded-2xl shadow-xl overflow-visible transition-all duration-300 hover:shadow-[0_20px_50px_rgba(59,130,246,0.3)]";

  return (
    <div className="relative min-h-[calc(100vh-6rem)] rounded-3xl overflow-hidden">
      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Welcome Section */}
        <div className="relative group/card">
          {/* Tilted Dark Background - Subtle */}
          <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

          <div className={`${cardStyle} p-8 mb-8`}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-[#051747]">Welcome back, {user?.name || 'User'}! 👋</h1>
                <p className="text-[#535F80] text-lg">
                  Ready to continue working on your spreadsheets? Here's what's happening today.
                </p>
              </div>

            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Stats */}
          <div className="lg:col-span-2">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="relative group/card">
                {/* Tilted Dark Background - Subtle */}
                <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

                <div className={`${cardStyle} p-6 hover:shadow-[0_25px_60px_rgba(59,130,246,0.5)]`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#535F80] text-sm font-medium">Total Files</p>
                      <p className="text-3xl font-bold text-[#051747]">{quickStats.totalFiles}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group/card">
                {/* Tilted Dark Background - Subtle */}
                <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

                <div className={`${cardStyle} p-6 hover:shadow-[0_25px_60px_rgba(59,130,246,0.5)]`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#535F80] text-sm font-medium">Active Collaborations</p>
                      <p className="text-3xl font-bold text-[#051747]">{quickStats.activeCollaborations}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center border border-purple-200">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group/card">
                {/* Tilted Dark Background - Subtle */}
                <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

                <div className={`${cardStyle} p-6 hover:shadow-[0_25px_60px_rgba(59,130,246,0.5)]`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#535F80] text-sm font-medium">Storage Used</p>
                      <p className="text-3xl font-bold text-[#051747]">{quickStats.storageUsed}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center border border-indigo-200">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group/card">
                {/* Tilted Dark Background - Subtle */}
                <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

                <div className={`${cardStyle} p-6 hover:shadow-[0_25px_60px_rgba(59,130,246,0.5)]`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#535F80] text-sm font-medium">Last Login</p>
                      <p className="text-3xl font-bold text-[#051747]">{quickStats.lastLogin}</p>
                    </div>
                    <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center border border-pink-200">
                      <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Files */}
            <div className="relative group/card">
              {/* Tilted Dark Background - Subtle */}
              <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

              <div className={`${cardStyle} p-8`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#051747]">Recent Files</h2>
                  <Link
                    to="/files"
                    className="text-sapphire-600 hover:text-sapphire-800 font-semibold text-sm transition-colors"
                  >
                    View all →
                  </Link>
                </div>

                <div className="space-y-4">
                  {recentFiles.map((file) => (
                    <div key={file.id} className="hover-card flex items-center justify-between p-4 border-2 border-gray-300 rounded-xl transition-all group">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors border border-blue-200">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-[#051747] group-hover:text-sapphire-700 transition-colors">
                            {file.name}
                          </p>
                          <p className="text-sm text-[#535F80]">Modified {file.lastModified}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-[#535F80]">{file.size}</span>
                        <button className="text-[#535F80] hover:text-[#051747] transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="relative group/card">
              {/* Tilted Dark Background - Subtle */}
              <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

              <div className={`${cardStyle} p-6`}>
                <h3 className="text-lg font-semibold text-[#051747] mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="btn-watch-demo w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>New Spreadsheet</span>
                  </button>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log('File selected:', file.name);
                        // Handle file upload logic here
                      }
                    }}
                  />
                  <button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="btn-watch-demo w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload File</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity Preview */}
            <div className="relative group/card">
              {/* Tilted Dark Background - Subtle */}
              <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

              <div className={`${cardStyle} p-6`}>
                <h3 className="text-lg font-semibold text-[#051747] mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="hover-card flex items-center space-x-3 text-sm p-3 border-2 border-gray-300 rounded-xl">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-[#051747]">Updated Q4 Report</p>
                      <p className="text-[#535F80]">2 hours ago</p>
                    </div>
                  </div>
                  <div className="hover-card flex items-center space-x-3 text-sm p-3 border-2 border-gray-300 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center border border-purple-200">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-[#051747]">Shared Budget File</p>
                      <p className="text-[#535F80]">1 day ago</p>
                    </div>
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

export default Dashboard;


