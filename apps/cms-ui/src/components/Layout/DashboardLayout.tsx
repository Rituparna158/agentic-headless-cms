import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';

export const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
};
