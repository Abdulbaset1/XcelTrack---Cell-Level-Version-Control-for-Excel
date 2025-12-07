import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="bg-white/30 backdrop-blur-xl shadow-lg border-b border-white/40 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Hamburger Menu Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-sapphire-50 transition-all hover:shadow-[0_10px_30px_rgba(37,99,235,0.4)]"
          aria-label="Toggle Sidebar"
        >
          <svg className="w-6 h-6 text-[#051747]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isSidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search files..."
              className="bg-white border border-sapphire-100 text-[#051747] px-4 py-2 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-sapphire-500 focus:bg-white transition-all placeholder-sapphire-300 hover:shadow-[0_10px_30px_rgba(37,99,235,0.4)]"
            />
            <div className="absolute right-3 top-2 text-sapphire-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Notifications - Bell Icon */}
          <button className="relative p-2 text-[#535F80] hover:text-sapphire-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-sapphire-50 transition-all hover:shadow-[0_10px_30px_rgba(37,99,235,0.4)]"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md">
                <span className="font-semibold text-sm">AJ</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[#051747]">Alex Johnson</p>
                <p className="text-xs text-[#535F80]">Admin</p>
              </div>
              <svg className="w-4 h-4 text-[#535F80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-sapphire-100 py-2 z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-[#535F80] hover:bg-sapphire-50 hover:text-[#051747] transition-colors"
                >
                  Your Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-[#535F80] hover:bg-sapphire-50 hover:text-[#051747] transition-colors"
                >
                  Settings
                </Link>
                <hr className="my-2 border-sapphire-100" />
                <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;