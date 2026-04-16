import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isAuthLoading } = useAuth();

    if (isAuthLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0305] text-[#c9a84c]">
                <div className="text-sm uppercase tracking-[0.24em]">Carregando sessão...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
