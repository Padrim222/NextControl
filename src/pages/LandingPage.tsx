import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

const roleRoutes: Record<UserRole, string> = {
    admin: '/admin',
    seller: '/seller',
    closer: '/closer',
    client: '/client',
    cs: '/cs',
};

export default function LandingPage() {
    const { isAuthenticated, user } = useAuth();

    if (isAuthenticated && user) {
        return <Navigate to={roleRoutes[user.role]} replace />;
    }

    // Sistema interno — redireciona direto para login
    return <Navigate to="/login" replace />;
}
