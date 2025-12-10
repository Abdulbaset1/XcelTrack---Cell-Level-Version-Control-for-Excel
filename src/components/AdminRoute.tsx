import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
    children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen text-white">Loading...</div>;
    }

    // Check if user is logged in and has Admin role
    // Role check is case-insensitive to handle 'admin', 'Admin', etc.
    if (!user || user.role?.toLowerCase() !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;
