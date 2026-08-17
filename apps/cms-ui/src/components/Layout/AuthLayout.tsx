import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';

export const AuthLayout = () => {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  // If the user is already authenticated, don't let them see the login page
  if (status === 'authenticated') {
    if (user && user.roles.length === 0) {
      if (location.pathname !== '/access-denied') {
        return (
          <Navigate
            to="/access-denied?message=Your account has been created successfully, but you do not have any roles assigned yet."
            replace
          />
        );
      }
      // Let them stay on /access-denied to view the message
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <div className="hidden w-full bg-zinc-950 md:flex md:w-1/2 lg:w-2/3 items-center justify-center p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-start max-w-xl mx-auto space-y-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-zinc-900 font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Agentic CMS
            </h1>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            Manage your content with unprecedented speed.
          </h2>
          <p className="text-lg text-zinc-400 max-w-lg">
            Experience a minimalist, high-performance headless CMS built for
            modern teams and seamless workflows.
          </p>

          <div className="pt-12 mt-auto text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Agentic Systems Inc. All rights
            reserved.
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-6 md:w-1/2 lg:w-1/3 bg-background">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
