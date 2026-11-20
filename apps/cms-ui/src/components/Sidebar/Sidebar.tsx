import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Menu, LogOut, Loader2 } from 'lucide-react';
import { sidebarNavConfig } from './SidebarNavConfig';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { useLogoutMutation } from '../../features/auth/hooks/useAuthMutations';
import { userCan } from '@/lib/capabilities';
import { isUserAdmin } from '../../features/access/constants/access.constants';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending } = useLogoutMutation();

  const { sidebar: sbClasses } = CMS_THEME_CLASSES;

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
    return isSuperAdmin || userCan(user, item.requiredCapability);
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
      className={`${sbClasses.aside} ${isCollapsed ? 'w-[72px]' : 'w-64'}`}
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
          className={sbClasses.collapseToggle}
          aria-label={
            isCollapsed
              ? 'Expand sidebar navigation'
              : 'Collapse sidebar navigation'
          }
          aria-expanded={!isCollapsed}
          aria-controls="sidebar-nav"
        >
          <Menu size={20} className="text-[#A1A1AA] hover:text-zinc-100" />
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] ${
                        active
                          ? 'bg-[#27272A] text-zinc-100 font-medium'
                          : 'hover:bg-[#27272A]/50 text-[#A1A1AA] hover:text-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {item.icon && (
                          <item.icon
                            size={20}
                            className={`shrink-0 ${active ? 'text-zinc-100' : 'text-[#A1A1AA]'}`}
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
                                  `block pl-11 pr-3 py-2 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] ${
                                    isSubActive
                                      ? 'text-zinc-100 bg-[#27272A] font-medium'
                                      : 'text-[#A1A1AA] hover:text-zinc-200 hover:bg-[#27272A]/40'
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
                      `flex items-center gap-3 px-3 py-2 rounded-md transition-colors overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#6366F1] ${
                        isActive
                          ? 'bg-[#27272A] text-zinc-100 font-medium'
                          : 'hover:bg-[#27272A]/50 text-[#A1A1AA] hover:text-zinc-100'
                      }`
                    }
                  >
                    {item.icon && (
                      <item.icon
                        size={20}
                        className={`shrink-0 ${isActive(item.href) ? 'text-zinc-100' : 'text-[#A1A1AA]'}`}
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
      <div className={sbClasses.footer}>
        <button
          type="button"
          onClick={() => logout()}
          disabled={isPending}
          aria-label="Logout"
          className={sbClasses.logoutButton}
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
