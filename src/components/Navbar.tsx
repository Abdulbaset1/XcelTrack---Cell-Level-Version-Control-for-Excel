import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSun, FiMoon, FiBell } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface NavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  return (
    <nav className="bg-[var(--bg-navbar)] backdrop-blur-xl shadow-lg border-b border-[var(--border-color)] px-6 py-4 sticky top-0 z-40">
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
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-[#535F80] hover:text-blue-600 hover:bg-blue-50 transition-all rounded-lg"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>

          {/* Notifications - Bell Icon */}
          <button
            className="relative p-2 text-[#535F80] hover:text-sapphire-600 transition-colors"
            aria-label="Notifications"
          >
            <FiBell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-sapphire-50 transition-all hover:shadow-[0_10px_30px_rgba(37,99,235,0.4)]"
              aria-label="User Profile Menu"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-semibold text-sm">{user?.name ? getInitials(user.name) : 'U'}</span>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[#051747]">{user?.name || 'User'}</p>
                <p className="text-xs text-[#535F80]">Member</p>
              </div>
              <svg className="w-4 h-4 text-[#535F80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-sapphire-100 py-2 z-50">
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                >
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