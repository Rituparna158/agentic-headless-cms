import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Menu, LogOut } from 'lucide-react';
import { sidebarNavConfig } from './SidebarNavConfig';
import { useAuthStore } from '../../features/auth/store/auth.store';
export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.clearAuth);
  // Extract user capabilities from permissions
  const userCapabilities =
    user?.permissions
      ?.filter((p) => p.action === 'manage')
      ?.map((p) => (p.condition as Record<string, string>)?.capability)
      ?.filter(Boolean) || [];
  // Super admins bypass capability checks
  const isSuperAdmin = user?.roles?.some((roleName: string) =>
    roleName.toLowerCase().includes('admin'),
  );
  // Filter navigation items
  const filteredNavConfig = sidebarNavConfig.filter((item) => {
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
      <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 bg-zinc-100 rounded-md flex items-center justify-center shrink-0">
              <span className="text-zinc-950 font-bold text-lg">A</span>
            </div>
            <span className="font-semibold text-zinc-100 text-lg tracking-tight">
              Agentic
            </span>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-md hover:bg-zinc-800 transition-colors focus:outline-none ml-auto shrink-0"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} className="text-zinc-400 hover:text-zinc-100" />
        </button>
      </div>
      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden custom-scrollbar">
        <ul className="space-y-1 px-3">
          {filteredNavConfig.map((item) => {
            const active = hasActiveChild(item);
            const isExpanded = expandedItems[item.title];
            return (
              <li key={item.title}>
                {item.subItems ? (
                  <div>
                    <button
                      onClick={() => toggleExpanded(item.title)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                        active
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'hover:bg-zinc-800/50 hover:text-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && (
                          <item.icon
                            size={20}
                            className={`shrink-0 ${active ? 'text-zinc-100' : 'text-zinc-400'}`}
                          />
                        )}
                        {!isCollapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <span className="shrink-0 text-zinc-500">
                          {isExpanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </span>
                      )}
                    </button>
                    {/* Submenu */}
                    {!isCollapsed && isExpanded && (
                      <ul className="mt-1 mb-2 space-y-1">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.title}>
                            <NavLink
                              to={subItem.href}
                              className={({ isActive }) =>
                                `block pl-11 pr-3 py-2 rounded-md text-sm transition-colors ${
                                  isActive
                                    ? 'text-zinc-100 bg-zinc-800/50 font-medium'
                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                                }`
                              }
                            >
                              {subItem.title}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
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
                    {!isCollapsed && (
                      <span className="truncate">{item.title}</span>
                    )}
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Footer / User Area */}
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
