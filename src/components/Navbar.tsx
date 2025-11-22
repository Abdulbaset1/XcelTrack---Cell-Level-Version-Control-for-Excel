import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);

  return (
    <nav className="bg-gray-900 text-white px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
            <span className="text-xl font-bold">XcelTrack</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Product Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIsProductOpen(true)}
              onMouseLeave={() => setIsProductOpen(false)}
            >
              <button className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors">
                <span>Product</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isProductOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white text-gray-900 rounded-lg shadow-xl border border-gray-200 py-2">
                  <a href="#" className="block px-4 py-2 hover:bg-gray-100">Features</a>
                  <a href="#" className="block px-4 py-2 hover:bg-gray-100">Mobile App</a>
                  <a href="#" className="block px-4 py-2 hover:bg-gray-100">Security</a>
                  <a href="#" className="block px-4 py-2 hover:bg-gray-100">Updates</a>
                </div>
              )}
            </div>

            {/* Solutions Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIsSolutionsOpen(true)}
              onMouseLeave={() => setIsSolutionsOpen(false)}
            >
              <button className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors">
                <span>Solutions</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isSolutionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white text-gray-900 rounded-lg shadow-xl border border-gray-200 py-2">
                  <a href="#" className="block px-4 py-2 hover:bg-gray-100">For Teams</a>
                  <a href="#" className="block px-4 py-2 hover:bg-gray-100">For Enterprises</a>
                  <a href="#" className="block px-4 py-2 hover:bg-gray-100">For Startups</a>
                </div>
              )}
            </div>

            <a href="#" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Documentation</a>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="hidden md:block relative">
            <input
              type="text"
              placeholder="Search XcelTrack..."
              className="bg-gray-800 text-white px-4 py-2 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-2 text-gray-400">
              /
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;