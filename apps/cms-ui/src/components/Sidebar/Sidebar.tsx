import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  Tag,
  Globe,
  Search,
  LogOut,
  Moon,
} from 'lucide-react';
import { Avatar } from '@repo/shared-ui';

interface NavItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
  children?: { name: string; path: string; color?: string }[];
  roles?: ('admin' | 'editor' | 'viewer')[]; // Role-based rendering
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={18} />,
  },
  {
    name: 'View site',
    path: '/preview',
    icon: <Globe size={18} />,
  },
  {
    name: 'Posts',
    path: '/posts',
    icon: <FileText size={18} />,
    children: [
      { name: 'Drafts', path: '/posts/drafts' },
      { name: 'Scheduled', path: '/posts/scheduled' },
      { name: 'Published', path: '/posts/published' },
      {
        name: 'Newsletters',
        path: '/posts/newsletters',
        color: 'bg-purple-500',
      },
      { name: 'Paid-members only', path: '/posts/paid', color: 'bg-green-500' },
    ],
  },
  {
    name: 'Pages',
    path: '/pages',
    icon: <FileText size={18} />,
  },
  {
    name: 'Tags',
    path: '/tags',
    icon: <Tag size={18} />,
  },
  {
    name: 'Members',
    path: '/members',
    icon: <Users size={18} />,
  },
  {
    name: 'Settings (Admin)',
    path: '/settings',
    icon: <Settings size={18} />,
    roles: ['admin'], // Only admins see this
  },
];

import { useLogoutMutation } from '../../features/auth/hooks/useAuthMutations';

export const Sidebar = ({
  userRole = 'admin',
}: {
  userRole?: 'admin' | 'editor' | 'viewer';
}) => {
  const [expanded, setExpanded] = useState<string | null>('Posts');
  const { mutate: logout } = useLogoutMutation();

  const handleToggle = (name: string) => {
    setExpanded(expanded === name ? null : name);
  };

  return (
    <div className="w-[260px] h-screen bg-background text-text-secondary flex flex-col border-r border-border flex-shrink-0">
      {/* Header / Logo */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-text-muted flex items-center justify-center bg-primary/20 text-primary">
            <span className="font-bold text-sm">A</span>
          </div>
          <span
            className="text-text-primary font-semibold text-sm truncate max-w-[120px]"
            title="Agentic Headless CMS"
          >
            Agentic CMS
          </span>
        </div>
        <button className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
          <Search size={18} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
        <ul className="space-y-1">
          {navItems
            .filter((item) => !item.roles || item.roles.includes(userRole))
            .map((item) => (
              <li key={item.name}>
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer text-sm font-medium transition-colors"
                  onClick={() =>
                    item.children ? handleToggle(item.name) : undefined
                  }
                >
                  <div className="flex items-center gap-3">
                    {item.icon && (
                      <span className="text-text-muted">{item.icon}</span>
                    )}
                    <span
                      className={
                        item.name === 'Dashboard' ? 'text-text-primary' : ''
                      }
                    >
                      {item.name}
                    </span>
                  </div>
                  {item.name === 'Members' && (
                    <span className="text-xs text-text-muted">41,040</span>
                  )}
                  {item.children && (
                    <span className="text-text-muted text-lg leading-none">
                      {expanded === item.name ? '−' : '+'}
                    </span>
                  )}
                </div>

                {/* Nested Children */}
                {item.children && expanded === item.name && (
                  <ul className="mt-1 mb-2 ml-9 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.name}>
                        <NavLink
                          to={child.path}
                          className="flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-white/5 text-sm transition-colors text-text-secondary"
                        >
                          {child.name}
                          {child.color && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${child.color}`}
                            />
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
        </ul>
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src="https://i.pravatar.cc/150?img=3"
            alt="User Avatar"
            letters="JD"
            className="w-8 h-8"
          />
        </div>
        <div className="flex items-center gap-3 text-text-muted">
          <button
            onClick={() => void logout()}
            className="hover:text-text-primary transition-colors text-red-500/80 hover:text-red-500"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
          <div className="flex items-center bg-black/40 rounded-full p-0.5 border border-border">
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow"></div>
            <Moon size={14} className="mx-1" />
          </div>
        </div>
      </div>
    </div>
  );
};
