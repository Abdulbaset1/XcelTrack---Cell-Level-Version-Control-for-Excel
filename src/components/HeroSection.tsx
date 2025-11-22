import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-20">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Where <span className="text-blue-400">Excel</span> meets<br />
          <span className="text-purple-400">Version Control</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          XcelTrack brings powerful version control to your spreadsheets. 
          Track changes, collaborate seamlessly, and never lose your work again.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link
            to="/signup"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors w-full sm:w-auto text-center"
          >
            Sign up for free
          </Link>
          <button className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors w-full sm:w-auto">
            Watch demo →
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="w-12 h-12 bg-blue-500 rounded-lg mb-4 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Cell-Level Tracking</h3>
            <p className="text-gray-400">Track changes at individual cell level with complete history</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="w-12 h-12 bg-green-500 rounded-lg mb-4 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Team Collaboration</h3>
            <p className="text-gray-400">Work together seamlessly with real-time collaboration features</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="w-12 h-12 bg-purple-500 rounded-lg mb-4 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Merge</h3>
            <p className="text-gray-400">Automatically resolve conflicts and merge changes intelligently</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;