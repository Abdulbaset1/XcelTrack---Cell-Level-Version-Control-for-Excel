import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  getWorkbooks,
  uploadWorkbook,
  downloadWorkbook,
  getUserCommits,
  getRegisteredUsers,
  addWorkbookCollaborator,
  deleteWorkbook,
  RegisteredUser,
} from '../services/api';
import FileUploadModal from '../components/FileUploadModal';
import SkeletonLoader from '../components/SkeletonLoader';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [files, setFiles] = useState<any[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [selectedFileForMenu, setSelectedFileForMenu] = useState<any | null>(null);
  const [selectedFileForShare, setSelectedFileForShare] = useState<any | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [collaboratorQuery, setCollaboratorQuery] = useState('');
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [isDeletingFileId, setIsDeletingFileId] = useState<number | null>(null);

  const fetchFiles = React.useCallback(async () => {
    if (user) {
      setLoading(true);
      setError(null);
      try {
        const data = await getWorkbooks(user.uid);
        setFiles(data);
      } catch (error: any) {
        console.error("Failed to fetch workbooks", error);
        setError(error.message || "Failed to load workbooks. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  const fetchRecentActivity = React.useCallback(async () => {
    if (!user) return;
    try {
      const response = await getUserCommits(user.uid, 5, 0);
      setRecentActivity(response.commits || []);
    } catch (activityError) {
      console.warn('Failed to fetch recent activity:', activityError);
    }
  }, [user]);

  const fetchRegisteredUsers = React.useCallback(async () => {
    try {
      const users = await getRegisteredUsers();
      setRegisteredUsers(users);
    } catch (usersError: any) {
      console.warn('Failed to fetch users for collaboration:', usersError);
      showToast(usersError.message || 'Failed to load users', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchFiles();
    fetchRecentActivity();

    const intervalId = window.setInterval(() => {
      fetchFiles();
      fetchRecentActivity();
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchFiles, fetchRecentActivity]);

  useEffect(() => {
    if (selectedFileForShare && registeredUsers.length === 0) {
      fetchRegisteredUsers();
    }
  }, [selectedFileForShare, registeredUsers.length, fetchRegisteredUsers]);

  const quickStats = {
    totalFiles: files.length,
    activeCollaborations: files.filter((file) => !file.is_owner || (file.collaborator_count || 0) > 0).length,
    storageUsed: '2.3 GB',
    lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const handleFileSelect = async (file: File) => {
    if (!user) return;
    try {
      const response = await uploadWorkbook(file, user.uid);
      if (response.workbook) {
        navigate(`/editor/${response.workbook.id}`);
      }
    } catch (error: any) {
      console.error("Upload failed", error);
      showToast(error.message || "Failed to upload workbook", "error");
    }
    setIsUploadModalOpen(false);
  };

  const handleDownload = async (e: React.MouseEvent, fileId: string, fileName: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      showToast(`Preparing download for ${fileName}...`, 'info');
      await downloadWorkbook(fileId, fileName);
      showToast('Download started successfully', 'success');
    } catch (err) {
      console.error('Download failed:', err);
      showToast('Failed to download workbook', 'error');
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, file: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    if (!file.is_owner) {
      showToast('Only the file owner can delete this workbook', 'warning');
      return;
    }

    const shouldDelete = window.confirm(`Delete "${file.name}"? This cannot be undone.`);
    if (!shouldDelete) return;

    try {
      setIsDeletingFileId(file.id);
      await deleteWorkbook(file.id, user.uid);
      showToast('Workbook deleted successfully', 'success');
      setSelectedFileForMenu(null);
      await fetchFiles();
      await fetchRecentActivity();
    } catch (deleteError: any) {
      console.error('Delete workbook failed:', deleteError);
      showToast(deleteError.message || 'Failed to delete workbook', 'error');
    } finally {
      setIsDeletingFileId(null);
    }
  };

  const handleOpenCollaboratorModal = async (e: React.MouseEvent, file: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (!file.is_owner) {
      showToast('Only the file owner can add collaborators', 'warning');
      return;
    }

    setSelectedFileForShare(file);
    setSelectedFileForMenu(null);
    if (registeredUsers.length === 0) {
      await fetchRegisteredUsers();
    }
  };

  const handleAddCollaborator = async (collaboratorId: string) => {
    if (!selectedFileForShare || !user) return;

    try {
      setIsAddingCollaborator(true);
      await addWorkbookCollaborator(selectedFileForShare.id, user.uid, collaboratorId);
      showToast('Collaborator added successfully', 'success');
      setSelectedFileForShare(null);
      setCollaboratorQuery('');
      await fetchFiles();
    } catch (addError: any) {
      console.error('Add collaborator failed:', addError);
      showToast(addError.message || 'Failed to add collaborator', 'error');
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const searchTerm = collaboratorQuery.trim().toLowerCase();
  const filteredUsers = searchTerm.length === 0
    ? []
    : registeredUsers.filter((registeredUser) => {
      const name = (registeredUser.name || '').toLowerCase();
      const email = (registeredUser.email || '').toLowerCase();
      const role = (registeredUser.role || '').toLowerCase();

      if (registeredUser.firebase_uid === user?.uid) return false;
      if (role === 'admin') return false;

      return name.includes(searchTerm) || email.includes(searchTerm);
    });



  // Styles updated for Light Sapphire Theme with Tilted Background Effect
  const cardStyle = "bg-[var(--bg-card)] backdrop-blur-lg border border-[var(--border-color)] rounded-2xl shadow-xl overflow-visible transition-all duration-300 hover:shadow-[0_20px_50px_var(--shadow-color)]";

  return (
    <div className="relative min-h-[calc(100vh-6rem)] rounded-3xl overflow-hidden">
      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Welcome Section */}

        <div className="relative group/card">
          {/* Tilted Dark Background - Subtle */}
          <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

          <div className={`${cardStyle} p-8 mb-8`}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-[var(--text-primary)]">Welcome back, {user?.name || 'User'}! 👋</h1>
                <p className="text-[var(--text-secondary)] text-lg">
                  Ready to continue working on your spreadsheets? Here's what's happening today.
                </p>
              </div>

            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Stats */}
          <div className="lg:col-span-2">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="relative group/card">
                {/* Tilted Dark Background - Subtle */}
                <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

                <div className={`${cardStyle} p-6 hover:shadow-[0_25px_60px_rgba(59,130,246,0.5)]`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[var(--text-secondary)] text-sm font-medium">Total Files</p>
                      <p className="text-3xl font-bold text-[var(--text-primary)]">{quickStats.totalFiles}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group/card">
                {/* Tilted Dark Background - Subtle */}
                <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

                <div className={`${cardStyle} p-6 hover:shadow-[0_25px_60px_rgba(59,130,246,0.5)]`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#535F80] text-sm font-medium">Active Collaborations</p>
                      <p className="text-3xl font-bold text-[#051747]">{quickStats.activeCollaborations}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center border border-purple-200">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group/card">
                {/* Tilted Dark Background - Subtle */}
                <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

                <div className={`${cardStyle} p-6 hover:shadow-[0_25px_60px_rgba(59,130,246,0.5)]`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#535F80] text-sm font-medium">Storage Used</p>
                      <p className="text-3xl font-bold text-[#051747]">{quickStats.storageUsed}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center border border-indigo-200">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group/card">
                {/* Tilted Dark Background - Subtle */}
                <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

                <div className={`${cardStyle} p-6 hover:shadow-[0_25px_60px_rgba(59,130,246,0.5)]`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#535F80] text-sm font-medium">Last Login</p>
                      <p className="text-3xl font-bold text-[#051747]">{quickStats.lastLogin}</p>
                    </div>
                    <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center border border-pink-200">
                      <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Files */}
            <div className="relative group/card">
              {/* Tilted Dark Background - Subtle */}
              <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

              <div className={`${cardStyle} p-8`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#051747]">Recent Files</h2>
                  <Link
                    to="/files"
                    className="text-sapphire-600 hover:text-sapphire-800 font-semibold text-sm transition-colors"
                  >
                    View all →
                  </Link>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    // Skeleton Loaders
                    [1, 2, 3].map((n) => (
                      <div key={n} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl bg-white">
                        <div className="flex items-center space-x-4 flex-1">
                          <SkeletonLoader width="40px" height="40px" borderRadius="8px" />
                          <div className="space-y-2 flex-1">
                            <SkeletonLoader width="60%" height="16px" />
                            <SkeletonLoader width="30%" height="12px" />
                          </div>
                        </div>
                        <SkeletonLoader width="50px" height="16px" className="ml-4" />
                      </div>
                    ))
                  ) : error ? (
                    <div className="text-center py-8 bg-red-50 rounded-xl border border-red-100">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-red-800 font-medium mb-4">{error}</p>
                      <button
                        onClick={fetchFiles}
                        className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm shadow-sm"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : files.length > 0 ? (
                    files.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => navigate(`/editor/${file.id}`)}
                        className="hover-card relative flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl transition-all group cursor-pointer block hover:border-blue-200 hover:bg-blue-50/30"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors border border-blue-200">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-[#051747] group-hover:text-sapphire-700 transition-colors">
                              {file.name}
                            </p>
                            <p className="text-sm text-[#535F80]">
                              Modified {new Date(file.updated_at).toLocaleDateString()}
                              {file.is_owner ? '' : ` • Shared by ${file.owner_name || 'Owner'}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-[#535F80]">{file.size || 'N/A'}</span>
                          <button
                            onClick={(e) => handleDownload(e, file.id, file.name)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download as Excel"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedFileForMenu(file);
                            }}
                            className="text-[#535F80] hover:text-[#051747] transition-colors"
                            title="More actions"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Empty State
                    <div className="text-center py-12 px-4">
                      <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-[#051747] mb-1">No spreadsheets yet</h3>
                      <p className="text-[#535F80] text-sm mb-6 max-w-xs mx-auto">
                        Quickly get started by creating a new spreadsheet or uploading an existing file.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          onClick={() => navigate('/editor')}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all text-sm"
                        >
                          New Spreadsheet
                        </button>
                        <button
                          onClick={() => setIsUploadModalOpen(true)}
                          className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 text-[#051747] rounded-lg font-semibold hover:bg-gray-50 transition-all text-sm"
                        >
                          Upload File
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="relative group/card">
              {/* Tilted Dark Background - Subtle */}
              <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

              <div className={`${cardStyle} p-6`}>
                <h3 className="text-lg font-semibold text-[#051747] mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/editor')}
                    className="btn-watch-demo w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>New Spreadsheet</span>
                  </button>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="btn-watch-demo w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload File</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity Preview */}
            <div className="relative group/card">
              {/* Tilted Dark Background - Subtle */}
              <div className="absolute inset-0 bg-gray-400 rounded-2xl transform rotate-1 translate-y-1 translate-x-1 -z-10"></div>

              <div className={`${cardStyle} p-6`}>
                <h3 className="text-lg font-semibold text-[#051747] mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, 3).map((activity) => (
                      <div key={activity.id} className="hover-card flex items-center space-x-3 text-sm p-3 border-2 border-gray-300 rounded-xl">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-[#051747]">{activity.workbook_name || activity.message || 'Workbook updated'}</p>
                          <p className="text-[#535F80]">{new Date(activity.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-[#535F80] p-2">No recent activity yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedFileForShare && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#051747]">Add Collaborator</h3>
              <button
                onClick={() => {
                  setSelectedFileForShare(null);
                  setCollaboratorQuery('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[#535F80] mb-3">File: {selectedFileForShare.name}</p>

            <input
              type="text"
              value={collaboratorQuery}
              onChange={(e) => setCollaboratorQuery(e.target.value)}
              placeholder="Search registered users by name or email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="mt-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {searchTerm.length === 0 ? (
                <div className="px-3 py-4 text-sm text-[#535F80]">Type a name or email to search registered users.</div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.slice(0, 20).map((registeredUser) => (
                  <div key={registeredUser.firebase_uid} className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#051747]">{registeredUser.name || 'Unnamed User'}</p>
                      <p className="text-xs text-[#535F80]">{registeredUser.email}</p>
                    </div>
                    <button
                      onClick={() => handleAddCollaborator(registeredUser.firebase_uid)}
                      disabled={isAddingCollaborator}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isAddingCollaborator ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-[#535F80]">No matching user found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedFileForMenu && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#051747]">File Actions</h3>
              <button
                onClick={() => setSelectedFileForMenu(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[#535F80] mb-4">{selectedFileForMenu.name}</p>

            <div className="space-y-2">
              <button
                onClick={(e) => handleOpenCollaboratorModal(e, selectedFileForMenu)}
                className="w-full text-left px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#051747]"
              >
                Add collaborator
              </button>
              <button
                onClick={(e) => handleDeleteFile(e, selectedFileForMenu)}
                disabled={!selectedFileForMenu.is_owner || isDeletingFileId === selectedFileForMenu.id}
                className="w-full text-left px-4 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 disabled:text-gray-400 disabled:hover:bg-red-50"
              >
                {isDeletingFileId === selectedFileForMenu.id ? 'Deleting...' : 'Delete file'}
              </button>
              {!selectedFileForMenu.is_owner && (
                <p className="text-xs text-[#535F80]">Only owner can add collaborators or delete this file.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileSelect={handleFileSelect}
      />
    </div>
  );
};

export default Dashboard;


