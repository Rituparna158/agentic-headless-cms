import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';

export const DashboardLayout = () => {
  // In a real app, you would get this from your auth store
  const userRole: 'admin' | 'editor' | 'viewer' = 'admin';

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <Sidebar userRole={userRole} />
      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
};
