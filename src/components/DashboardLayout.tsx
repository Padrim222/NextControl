import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from '@/components/AppSidebar';

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <AppSidebar />
      <main className="ml-60 min-h-screen">
        <div className="px-8 py-8 max-w-[1200px]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
