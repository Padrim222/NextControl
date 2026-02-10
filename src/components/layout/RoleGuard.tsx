import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: UserRole[];
    fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!user || !allowedRoles.includes(user.role)) {
        if (fallback) {
            return <>{fallback}</>;
        }

        // Redirect to appropriate dashboard based on role
        const roleRoutes: Record<UserRole, string> = {
            admin: '/admin',
            seller: '/seller',
            closer: '/closer',
            client: '/client',
        };

        return <Navigate to={roleRoutes[user?.role || 'client']} replace />;
    }

    return <>{children}</>;
}
