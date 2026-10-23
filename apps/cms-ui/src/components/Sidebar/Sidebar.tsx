import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Menu, LogOut, Loader2 } from 'lucide-react';
import { sidebarNavConfig } from './SidebarNavConfig';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { useLogoutMutation } from '../../features/auth/hooks/useAuthMutations';
import { isUserAdmin } from '../../features/access/constants/access.constants';
export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending } = useLogoutMutation();
  // Extract user capabilities from permissions
  const userCapabilities =
    user?.permissions
      ?.filter((p) => p.action === 'manage')
      ?.map((p) => (p.condition as Record<string, string>)?.capability)
      ?.filter(Boolean) || [];
  // Super admins bypass capability checks via strict canonical role comparison
  const isSuperAdmin = isUserAdmin(user?.roles);
  // Filter navigation items
  const filteredNavConfig = sidebarNavConfig.filter((item) => {
    if (item.requiredRoles) {
      return (
        isSuperAdmin ||
        user?.roles?.some((roleName: string) =>
          item.requiredRoles!.includes(roleName.toLowerCase()),
        )
      );
    }
    if (!item.requiredCapability) return true;
    return isSuperAdmin || userCapabilities.includes(item.requiredCapability);
  });
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleExpanded = (title: string) => {
    // If sidebar is collapsed, expand it when clicking a nested menu
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };
  const isActive = (href: string) => location.pathname === href;
  const hasActiveChild = (item: (typeof sidebarNavConfig)[0]) => {
    if (isActive(item.href)) return true;
    return item.subItems?.some((sub) => isActive(sub.href)) ?? false;
  };
  return (
    <aside
      className={`flex flex-col h-full bg-zinc-950 text-zinc-300 transition-all duration-300 ease-in-out border-r border-zinc-800 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800 overflow-hidden">
        <div
          className={`flex items-center gap-2 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}
        >
          <div className="w-8 h-8 bg-zinc-100 rounded-md flex items-center justify-center shrink-0">
            <span className="text-zinc-950 font-bold text-lg">A</span>
          </div>
          <span className="font-semibold text-zinc-100 text-lg tracking-tight">
            Agentic
          </span>
        </div>
        <button
          type="button"
          onClick={toggleCollapse}
          className="p-2 rounded-md hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 ml-auto shrink-0"
          aria-label={
            isCollapsed
              ? 'Expand sidebar navigation'
              : 'Collapse sidebar navigation'
          }
          aria-expanded={!isCollapsed}
          aria-controls="sidebar-nav"
        >
          <Menu size={20} className="text-zinc-400 hover:text-zinc-100" />
        </button>
      </div>
      {/* Navigation Links */}
      <nav
        id="sidebar-nav"
        aria-label="Main Navigation"
        className="flex-1 overflow-y-auto py-4 overflow-x-hidden custom-scrollbar"
      >
        <ul className="space-y-1 px-3">
          {filteredNavConfig.map((item) => {
            const active = hasActiveChild(item);
            const isExpanded = expandedItems[item.title];
            const itemSlug = item.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-');
            const buttonId = `menu-toggle-${itemSlug}`;
            const submenuId = `submenu-${itemSlug}`;

            return (
              <li key={item.title}>
                {item.subItems ? (
                  <div>
                    <button
                      id={buttonId}
                      type="button"
                      onClick={() => toggleExpanded(item.title)}
                      aria-expanded={Boolean(!isCollapsed && isExpanded)}
                      aria-controls={submenuId}
                      aria-haspopup="true"
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 ${
                        active
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'hover:bg-zinc-800/50 hover:text-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {item.icon && (
                          <item.icon
                            size={20}
                            className={`shrink-0 ${active ? 'text-zinc-100' : 'text-zinc-400'}`}
                          />
                        )}
                        <span
                          className={`truncate transition-all duration-300 ease-in-out ${
                            isCollapsed
                              ? 'max-w-0 opacity-0 pointer-events-none'
                              : 'max-w-xs opacity-100'
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 text-zinc-500 transition-all duration-300 ease-in-out ${
                          isCollapsed
                            ? 'max-w-0 opacity-0 pointer-events-none'
                            : 'max-w-xs opacity-100'
                        }`}
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </span>
                    </button>
                    {/* Submenu */}
                    {!isCollapsed && isExpanded && (
                      <ul
                        id={submenuId}
                        role="region"
                        aria-labelledby={buttonId}
                        className="mt-1 mb-2 space-y-1 animate-fade-in"
                      >
                        {item.subItems.map((subItem) => {
                          const [path, search] = subItem.href.split('?');
                          const isSubActive = search
                            ? location.pathname === path &&
                              location.search === `?${search}`
                            : location.pathname === path && !location.search;

                          return (
                            <li key={subItem.title}>
                              <NavLink
                                to={subItem.href}
                                className={() =>
                                  `block pl-11 pr-3 py-2 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 ${
                                    isSubActive
                                      ? 'text-zinc-100 bg-zinc-800/50 font-medium'
                                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                                  }`
                                }
                              >
                                {subItem.title}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md transition-colors overflow-hidden focus:outline-none focus:ring-2 focus:ring-zinc-600 ${
                        isActive
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'hover:bg-zinc-800/50 hover:text-zinc-100'
                      }`
                    }
                  >
                    {item.icon && (
                      <item.icon
                        size={20}
                        className={`shrink-0 ${isActive(item.href) ? 'text-zinc-100' : 'text-zinc-400'}`}
                      />
                    )}
                    <span
                      className={`truncate transition-all duration-300 ease-in-out ${
                        isCollapsed
                          ? 'max-w-0 opacity-0 pointer-events-none'
                          : 'max-w-xs opacity-100'
                      }`}
                    >
                      {item.title}
                    </span>
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Footer / User Area */}
      <div className="p-4 border-t border-zinc-800 overflow-hidden">
        <button
          type="button"
          onClick={() => logout()}
          disabled={isPending}
          aria-label="Log out of application"
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 disabled:opacity-50 overflow-hidden ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          {isPending ? (
            <Loader2 size={20} className="shrink-0 animate-spin" />
          ) : (
            <LogOut size={20} className="shrink-0" />
          )}
          <span
            className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${
              isCollapsed
                ? 'max-w-0 opacity-0 pointer-events-none'
                : 'max-w-xs opacity-100'
            }`}
          >
            {isPending ? 'Logging out...' : 'Logout'}
          </span>
        </button>
      </div>
    </aside>
  );
};
