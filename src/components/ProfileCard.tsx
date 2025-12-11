import React, { useState } from 'react';

interface UserData {
  name: string;
  email: string;
  joinDate: string;
  photoURL: string | null;
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
  onUploadPicture: (file: File) => Promise<void>;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ userData, stats, onUploadPicture }) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        await onUploadPicture(e.target.files[0]);
      } catch (error) {
        console.error("Failed to upload picture", error);
        // Could show an error toast here
      }
    }
  };

  return (
    <div className="group">
      <div className="relative transition-all duration-700">

        {/* FRONT FACE */}
        <div className="relative">
          <div className="relative group/card h-full">
            {/* Tilted Gray Background */}
            <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

            <div className="bg-white backdrop-blur-lg border border-white/60 rounded-2xl shadow-xl p-8 h-full">
              {/* Profile Header */}
              <div className="text-center mb-8">
                {/* Profile Photo */}
                <div className="relative inline-block mb-6 group/photo">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white overflow-hidden relative">
                    {userData.photoURL ? (
                      <img src={userData.photoURL} alt={userData.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {userData.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}

                    {/* Upload Overlay */}
                    <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 cursor-pointer">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-white shadow-lg"></div>
                </div>

                {/* User Name */}
                <h1 className="text-3xl font-bold mb-2 text-[#051747]">
                  {userData.name}
                </h1>

                <p className="text-blue-500 text-sm mt-2 font-medium">Member since {userData.joinDate}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-300">
                  <div className="text-2xl font-bold text-[#051747]">{stats.excelFiles}</div>
                  <div className="text-[#535F80] text-sm font-medium">Excel Files</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center border-2 border-purple-300">
                  <div className="text-2xl font-bold text-[#051747]">{stats.collaborations}</div>
                  <div className="text-[#535F80] text-sm font-medium">Collaborations</div>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4 text-center border-2 border-indigo-300">
                  <div className="text-2xl font-bold text-[#051747]">{stats.revisions}</div>
                  <div className="text-[#535F80] text-sm font-medium">Revisions</div>
                </div>
                <div className="bg-pink-50 rounded-xl p-4 text-center border-2 border-pink-300">
                  <div className="text-2xl font-bold text-[#051747]">{stats.storageUsed}</div>
                  <div className="text-[#535F80] text-sm font-medium">Storage Used</div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-[#535F80] text-sm font-medium">{userData.email}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div>
                <button className="btn-watch-demo w-full shadow-sm bg-white text-[#051747] border-gray-200 hover:text-white !py-2 !text-sm">
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileCard;