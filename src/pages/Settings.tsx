import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { toggleTheme, isDark } = useTheme();
  const { showToast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (key: any, value: any) => {
    updateSettings({ [key]: value });
  };

  const handleSave = () => {
    setShowSuccess(true);
    showToast("Settings saved successfully", "success");
    setTimeout(() => setShowSuccess(false), 3000);
  };


  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="relative z-0">
        {/* Header Navigation */}
        {/* Glassmorphism Card - Dark blue shadow on hover */}
        <div className="bg-white/90 backdrop-blur-lg border border-white/60 rounded-2xl shadow-xl p-8 hover:shadow-[0_20px_50px_rgba(30,64,175,0.4)] transition-all duration-300">
          {/* Header Navigation */}
          <div className="mb-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 text-[#535F80] hover:text-[#051747] transition-all duration-300 font-medium hover:scale-105 hover:shadow-sm px-3 py-2 rounded-lg -ml-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#051747] mb-2">Settings</h1>
              <p className="text-[#535F80]">Manage your XcelTrack preferences and configurations</p>
            </div>
            {showSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg flex items-center animate-fade-in-down">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Settings Saved!
              </div>
            )}
          </div>

          <div className="space-y-10">
            {/* Appearance Settings */}
            <section>
              <h2 className="text-xl font-bold text-[#051747] mb-6 flex items-center border-b-2 border-gray-300 pb-3">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                Appearance
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#051747]">Dark Mode</p>
                    <p className="text-sm text-[#535F80]">Switch between light and dark themes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isDark}
                      onChange={toggleTheme}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </section>

            {/* Version Control Settings */}
            <section>
              <h2 className="text-xl font-bold text-[#051747] mb-6 flex items-center border-b-2 border-gray-300 pb-3">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Version Control
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#535F80] mb-2">Auto-save Interval (minutes)</label>
                  <input
                    type="number"
                    value={settings.autoSaveInterval}
                    onChange={(e) => handleChange('autoSaveInterval', e.target.value)}
                    className="w-full bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-2 text-[#051747] focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#535F80] mb-2">Difference Highlight Color</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={settings.diffHighlightColor}
                      onChange={(e) => handleChange('diffHighlightColor', e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer"
                    />
                    <span className="text-sm font-mono text-[#051747]">{settings.diffHighlightColor}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications Settings */}
            <section>
              <h2 className="text-xl font-bold text-[#051747] mb-6 flex items-center border-b-2 border-gray-300 pb-3">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#051747]">Email Alerts</p>
                    <p className="text-sm text-[#535F80]">Receive emails when files are modified</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.emailAlerts}
                      onChange={(e) => handleChange('emailAlerts', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#051747]">Weekly Digest</p>
                    <p className="text-sm text-[#535F80]">Get a summary of your activity every week</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.weeklyDigest}
                      onChange={(e) => handleChange('weeklyDigest', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </section>

            {/* Security Settings */}
            <section>
              <h2 className="text-xl font-bold text-[#051747] mb-6 flex items-center border-b-2 border-gray-300 pb-3">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Security & Privacy
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#051747]">Two-Factor Authentication</p>
                    <p className="text-sm text-[#535F80]">Add an extra layer of security to your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => handleChange('twoFactorAuth', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#051747]">Public Profile</p>
                    <p className="text-sm text-[#535F80]">Allow others to view your profile</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.publicProfile}
                      onChange={(e) => handleChange('publicProfile', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t-2 border-gray-300">
              <button
                onClick={handleSave}
                className="btn-watch-demo shadow-lg px-8 py-3"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default Settings;