import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-gradient-to-b from-emerald-800 to-green-900 text-white h-screen fixed left-0 top-0 shadow-2xl">
      {/* Logo Section */}
      <div className="p-6 border-b border-emerald-700">
        <Link to="/dashboard" className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm0 2v16h12V10h-6V4H6zm8 4h4l-4-4v4z"/>
              <path d="M8 12h8v2H8v-2zm0 4h8v2H8v-2zm0 4h5v2H8v-2z" fill="white"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-200 to-green-200 bg-clip-text text-transparent">
              XcelTrack
            </span>
            <span className="text-xs text-emerald-300 -mt-1">Dashboard</span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-emerald-600 shadow-lg transform scale-105'
                    : 'hover:bg-emerald-700/50 hover:translate-x-1'
                }`}
              >
                <div className={`${isActive(item.path) ? 'text-white' : 'text-emerald-300'}`}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
                {isActive(item.path) && (
                  <div className="ml-auto w-2 h-2 bg-green-400 rounded-full"></div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info Section */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-emerald-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">AJ</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">Alex Johnson</p>
            <p className="text-emerald-300 text-xs truncate">Senior Data Analyst</p>
          </div>
        </div>
      </div>
    </div>
  );
  
};


export default Sidebar;