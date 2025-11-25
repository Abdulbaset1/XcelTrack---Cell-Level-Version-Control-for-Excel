import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black/20 backdrop-blur-lg border-t border-white/10 text-white py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Company */}
          <div>
            <h4 className="font-bold mb-4 text-white">Product</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Security</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Team</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Enterprise</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Customer stories</a></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-bold mb-4 text-white">Platform</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Developer API</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Partners</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Atom</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Electron</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold mb-4 text-white">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Help</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Community Forum</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Training</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold mb-4 text-white">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Press</a></li>
            </ul>
          </div>

          {/* CTA Section */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <h4 className="font-bold mb-2 text-white">Try XcelTrack today</h4>
              <p className="text-blue-200 text-sm mb-4">
                Start collaborating on your spreadsheets with powerful version control.
              </p>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all inline-block shadow-lg"
              >
                Sign up free
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-lg shadow-lg border border-white/20 group-hover:scale-110 transition-transform"></div>
              <span className="text-lg font-bold text-white">XcelTrack</span>
            </Link>
            <span className="text-blue-200 text-sm">© 2024 XcelTrack, Inc.</span>
          </div>

          <div className="flex space-x-6">
            <a href="#" className="text-blue-200 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-blue-200 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-blue-200 hover:text-white transition-colors">Security</a>
            <a href="#" className="text-blue-200 hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;