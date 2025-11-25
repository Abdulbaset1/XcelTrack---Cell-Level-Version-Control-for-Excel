import React from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import Footer from '../components/Footer';

const Landing: React.FC = () => {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)',
      }}
    >
      {/* Updated Navbar - Only shows Sign In/Sign Up */}
      <nav className="bg-transparent px-6 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-xl shadow-lg border border-white/20">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm0 2v16h12V10h-6V4H6zm8 4h4l-4-4v4z" />
                <path d="M8 12h8v2H8v-2zm0 4h8v2H8v-2zm0 4h5v2H8v-2z" fill="white" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">
                XcelTrack
              </span>
              <span className="text-xs text-blue-200 -mt-1">Version Control</span>
            </div>
          </Link>

          {/* Only Auth Buttons - No Profile/Settings */}
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-blue-100 hover:text-white transition-colors px-4 py-2 font-medium"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors font-semibold border border-white/20 backdrop-blur-sm"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Rest of the landing page content */}
      <HeroSection />
      <FeaturesSection />

      {/* CTA Section */}
      <section className="py-20 bg-transparent">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to transform your spreadsheet workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teams already using XcelTrack for better collaboration and version control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 border border-white/20"
            >
              Get started for free
            </Link>
            <button className="bg-white/5 hover:bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl text-lg font-semibold transition-all backdrop-blur-sm">
              Contact sales
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;