import React from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import Footer from '../components/Footer';
import ParallaxBackground from '../components/ParallaxBackground';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen text-[#051747] bg-sapphire-50 relative overflow-hidden">
      <ParallaxBackground />

      {/* Updated Navbar - Only shows Sign In/Sign Up */}
      <nav className="bg-sapphire-50/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 border-b border-sapphire-900/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="XcelTrack Logo" className="w-10 h-10 rounded-xl shadow-lg border border-white/20" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#051747]">
                XcelTrack
              </span>
              <span className="text-xs text-[#535F80] -mt-1">Version Control</span>
            </div>
          </Link>

          {/* Only Auth Buttons - No Profile/Settings */}
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-[#535F80] hover:text-[#051747] transition-colors px-4 py-2 font-medium"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="group relative overflow-hidden bg-sapphire-600 hover:bg-sapphire-900 text-white px-6 py-2 rounded-lg transition-all font-semibold shadow-lg"
            >
              <span className="relative z-10">Sign up</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent ease-in-out" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Rest of the landing page content */}
      <HeroSection />
      <FeaturesSection />

      {/* CTA Section */}
      <section className="pt-20 bg-transparent relative z-20">
        <div className="bg-white pt-20 pb-20 px-10 w-full text-center shadow-2xl">
          <h2 className="text-4xl font-bold mb-6 text-[#051747] max-w-2xl mx-auto">
            Ready to transform your spreadsheet workflow?
          </h2>
          <p className="text-xl text-[#535F89] mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using XcelTrack for better collaboration and version control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="group relative overflow-hidden bg-sapphire-600 hover:bg-sapphire-900 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto text-center"
            >
              <span className="relative z-10">Get started for free</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent ease-in-out" />
            </Link>
            <button className="btn-watch-demo w-full sm:w-auto shadow-sm">
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