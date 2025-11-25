import React from 'react';

interface UserData {
  name: string;
  email: string;
  jobTitle: string;
  company: string;
  joinDate: string;
  bio: string;
}

interface Stats {
  excelFiles: number;
  collaborations: number;
  revisions: number;
  storageUsed: string;
}

interface ProfileCardProps {
  userData: UserData;
  stats: Stats;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ userData, stats }) => {
  return (
    <div className="bg-[rgba(255,255,255,0.15)] backdrop-blur-lg border border-[rgba(255,255,255,0.3)] rounded-2xl shadow-2xl text-white p-8">
      {/* Profile Header */}
      <div className="text-center mb-8">
        {/* Profile Photo */}
        <div className="relative inline-block mb-6">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20">
            <span className="text-3xl font-bold text-white">
              {userData.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-white shadow-lg"></div>
        </div>

        {/* User Name - Bigger than others */}
        <h1 className="text-3xl font-bold mb-2 text-white">
          {userData.name}
        </h1>

        <p className="text-blue-100 mb-1">{userData.jobTitle}</p>
        <p className="text-blue-200 text-sm">{userData.company}</p>
        <p className="text-blue-300 text-sm mt-2">Member since {userData.joinDate}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 rounded-lg p-4 text-center backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
          <div className="text-2xl font-bold text-white">{stats.excelFiles}</div>
          <div className="text-blue-200 text-sm">Excel Files</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 text-center backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
          <div className="text-2xl font-bold text-white">{stats.collaborations}</div>
          <div className="text-blue-200 text-sm">Collaborations</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 text-center backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
          <div className="text-2xl font-bold text-white">{stats.revisions}</div>
          <div className="text-blue-200 text-sm">Revisions</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 text-center backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
          <div className="text-2xl font-bold text-white">{stats.storageUsed}</div>
          <div className="text-blue-200 text-sm">Storage Used</div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">About</h3>
        <p className="text-blue-100 text-sm leading-relaxed">
          {userData.bio}
        </p>
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
            <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-blue-100 text-sm">{userData.email}</span>
        </div>
      </div>

      {/* Upgrade Banner */}
      <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-center shadow-lg border border-white/10">
        <p className="text-white font-semibold text-sm mb-2">Upgrade to Pro</p>
        <p className="text-blue-100 text-xs mb-3">Get unlimited storage and advanced features</p>
        <button className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
          Upgrade Now
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;