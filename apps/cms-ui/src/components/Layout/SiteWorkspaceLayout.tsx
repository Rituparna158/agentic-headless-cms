import { Outlet } from 'react-router-dom';
import { SkipLink, MAIN_CONTENT_ID } from '../ui/SkipLink';
import { SiteWorkspaceSidebar } from '../Sidebar/SiteWorkspaceSidebar';

export const SiteWorkspaceLayout = () => {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <SkipLink />
      <SiteWorkspaceSidebar />
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="flex-1 overflow-y-auto bg-background flex flex-col focus:outline-none"
      >
        <Outlet />
      </main>
    </div>
  );
};
