import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface SettingsState {
  // Version Control
  autoSaveInterval: string;
  diffHighlightColor: string;
  versionHistoryLimit: number;
  // Notifications
  emailAlerts: boolean;
  collaborationInvites: boolean;
  weeklyDigest: boolean;
  // Security
  twoFactorAuth: boolean;
  publicProfile: boolean;
}

const Settings: React.FC = () => {
  // Default settings
  const defaultSettings: SettingsState = {
    autoSaveInterval: '10',
    diffHighlightColor: '#3B82F6', // Blue-500
    versionHistoryLimit: 50,
    emailAlerts: true,
    collaborationInvites: true,
    weeklyDigest: false,
    twoFactorAuth: false,
    publicProfile: true,
  };

  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('xceltrack_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }, []);

  const handleChange = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('xceltrack_settings', JSON.stringify(settings));
    setShowSuccess(true);
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
            {/* Version Control Settings */}
            <section>
              <h2 className="text-xl font-bold text-[#051747] mb-6 flex items-center border-b-2 border-gray-300 pb-3">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Version Control
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#535F80]">Auto-Save Interval</label>
                  <select
                    value={settings.autoSaveInterval}
                    onChange={(e) => handleChange('autoSaveInterval', e.target.value)}
                    className="w-full bg-white border border-gray-300 text-[#051747] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                  >
                    <option value="5">Every 5 minutes</option>
                    <option value="10">Every 10 minutes</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="60">Every hour</option>
                  </select>
                  <p className="text-xs text-gray-500">How often to automatically save your Excel file versions.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#535F80]">Diff Highlight Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={settings.diffHighlightColor}
                      onChange={(e) => handleChange('diffHighlightColor', e.target.value)}
                      className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                    />
                    <span className="text-sm text-[#051747] font-medium">{settings.diffHighlightColor}</span>
                  </div>
                  <p className="text-xs text-gray-500">Color used to highlight cell changes in version comparison.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#535F80]">Version History Limit</label>
                  <input
                    type="number"
                    value={settings.versionHistoryLimit}
                    onChange={(e) => handleChange('versionHistoryLimit', parseInt(e.target.value))}
                    className="w-full bg-white border border-gray-300 text-[#051747] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    min="1"
                    max="5"
                  />
                  <p className="text-xs text-gray-500">Maximum number of versions to keep per file.</p>
                </div>
              </div>
            </section>

            {/* Notification Settings */}
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
                    <p className="text-sm text-[#535F80]">Receive emails when files are modified by collaborators</p>
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
                    <p className="font-medium text-[#051747]">Collaboration Invites</p>
                    <p className="text-sm text-[#535F80]">Get notified when someone invites you to a project</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.collaborationInvites}
                      onChange={(e) => handleChange('collaborationInvites', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#051747]">Weekly Digest</p>
                    <p className="text-sm text-[#535F80]">Receive a weekly summary of your activity</p>
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
                    <p className="text-sm text-[#535F80]">Allow others to view your profile and public stats</p>
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