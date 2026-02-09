import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from '@/components/AppSidebar';

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
