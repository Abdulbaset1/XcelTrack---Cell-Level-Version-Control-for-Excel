import React, { useState } from 'react';

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
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="group [perspective:1000px]">
      <div className={`relative transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>

        {/* FRONT FACE */}
        <div className="relative [backface-visibility:hidden]">
          <div className="relative group/card h-full">
            {/* Tilted Gray Background */}
            <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

            <div className="bg-white backdrop-blur-lg border border-white/60 rounded-2xl shadow-xl p-8 h-full">
              {/* Profile Header */}
              <div className="text-center mb-8">
                {/* Profile Photo */}
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                    <span className="text-3xl font-bold text-white">
                      {userData.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-white shadow-lg"></div>
                </div>

                {/* User Name */}
                <h1 className="text-3xl font-bold mb-2 text-[#051747]">
                  {userData.name}
                </h1>

                <p className="text-[#535F80] font-medium mb-1">{userData.jobTitle}</p>
                <p className="text-[#535F80] text-sm">{userData.company}</p>
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

              {/* Bio Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#051747] mb-3">About</h3>
                <p className="text-[#535F80] text-sm leading-relaxed">
                  {userData.bio}
                </p>
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
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsFlipped(true)}
                  className="btn-watch-demo w-full shadow-sm !py-2 !text-sm whitespace-nowrap"
                >
                  Contact Me
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <button className="btn-watch-demo w-full shadow-sm bg-white text-[#051747] border-gray-200 hover:text-white !py-2 !text-sm">
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <div className="h-full w-full bg-[#ADD8E6] rounded-2xl shadow-2xl p-8 flex flex-col justify-center items-center text-center border-4 border-white/50 relative overflow-hidden">

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 bg-white/40 hover:bg-white/60 rounded-full flex items-center justify-center transition-colors z-20"
            >
              <svg className="w-5 h-5 text-[#051747]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Decorative Background Elements - Adjusted for light theme */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -ml-32 -mb-32"></div>

            {/* Content */}
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white/40 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-sm border border-white/50 shadow-sm">
                <span className="text-3xl font-bold text-[#051747]">
                  {userData.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-[#051747] mb-2">Get in Touch</h2>
              <p className="text-[#535F80] mb-8 text-sm font-medium">Connect with me for collaborations</p>

              <div className="space-y-4 w-full">
                <a href={`mailto:${userData.email}`} className="flex items-center justify-center space-x-3 bg-white/60 hover:bg-white/80 p-3 rounded-xl transition-all duration-300 border border-white/40 group/item shadow-sm hover:scale-105 hover:shadow-md">
                  <svg className="w-5 h-5 text-[#051747] group-hover/item:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[#051747] text-sm font-semibold">{userData.email}</span>
                </a>

                <div className="flex items-center justify-center space-x-3 bg-white/60 p-3 rounded-xl border border-white/40 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md cursor-default">
                  <svg className="w-5 h-5 text-[#051747]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[#051747] text-sm font-semibold">San Francisco, CA</span>
                </div>
              </div>

              <div className="mt-8 flex justify-center space-x-4">
                {/* LinkedIn */}
                <button className="w-10 h-10 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center transition-all duration-300 border border-white/40 shadow-sm group/icon hover:scale-125 hover:shadow-md">
                  <svg className="w-5 h-5 text-[#051747] group-hover/icon:text-[#0077b5] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </button>

                {/* GitHub */}
                <button className="w-10 h-10 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center transition-all duration-300 border border-white/40 shadow-sm group/icon hover:scale-125 hover:shadow-md">
                  <svg className="w-5 h-5 text-[#051747] group-hover/icon:text-black transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </button>

                {/* Twitter/X */}
                <button className="w-10 h-10 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center transition-all duration-300 border border-white/40 shadow-sm group/icon hover:scale-125 hover:shadow-md">
                  <svg className="w-4 h-4 text-[#051747] group-hover/icon:text-black transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
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