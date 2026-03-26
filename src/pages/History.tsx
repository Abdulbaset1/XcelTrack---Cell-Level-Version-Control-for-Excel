import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiFileText, FiChevronRight, FiActivity } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { getUserCommits } from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';

const History: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getUserCommits(user.uid);
        setCommits(data.commits);
      } catch (err) {
        console.error('Error fetching global history:', err);
        setError('Failed to load activity history. Please ensure the server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <SkeletonLoader width="40px" height="40px" className="rounded-full" />
          <SkeletonLoader width="250px" height="32px" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <SkeletonLoader width="100%" height="60px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 group">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform">
            {React.createElement(FiActivity as any, { className: "text-white text-2xl" })}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Global History</h1>
            <p className="text-[var(--text-secondary)] font-medium tracking-wide">Track your activity across all Excel files</p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-sm flex items-center space-x-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      ) : commits.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm px-6">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            {React.createElement(FiClock as any, { className: "text-gray-300 text-4xl" })}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No activity recorded... yet!</h3>
          <p className="text-gray-500 max-w-sm mx-auto font-medium">Start editing your workbooks to see your version history appear here in real-time.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-indigo-100 to-transparent rounded-full hidden sm:block"></div>

          <div className="space-y-8 relative">
            {commits.map((commit, index) => (
              <div
                key={commit.id}
                className="group relative sm:pl-20 animate-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Timeline Dot */}
                <div className="absolute left-6 top-6 w-5 h-5 bg-white border-4 border-blue-500 rounded-full z-10 hidden sm:block shadow-md group-hover:scale-125 transition-transform"></div>

                <div
                  onClick={() => navigate(`/editor/${commit.workbook_id}`)}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer transform hover:-translate-y-1"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {React.createElement(FiFileText as any, { size: 24 })}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {commit.message || 'Auto-save'}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-400 font-medium">
                          <span className="uppercase tracking-wider text-xs bg-gray-100 px-2 py-0.5 rounded-lg text-gray-600">
                            Workbook
                          </span>
                          <span className="text-gray-600">{commit.workbook_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:text-right">
                      <div className="flex flex-col sm:items-end">
                        <span className="text-sm font-bold text-gray-900">{formatDate(commit.timestamp)}</span>
                        <span className="text-xs text-gray-400 font-mono tracking-tighter uppercase">{commit.hash.substring(0, 8)}</span>
                      </div>
                      {React.createElement(FiChevronRight as any, { className: "ml-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" })}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {commit.changes_count || 0} Cell Changes
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blue-600 hover:underline">
                      Open in Editor &rarr;
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;