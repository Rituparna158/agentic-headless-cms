import { Outlet } from 'react-router-dom';
import { SkipLink, MAIN_CONTENT_ID } from '../ui/SkipLink';
import { Sidebar } from '../Sidebar/Sidebar';

export const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <SkipLink />
      <Sidebar />
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="flex-1 overflow-y-auto bg-background focus:outline-none"
      >
        <Outlet />
      </main>
    </div>
  );
};
