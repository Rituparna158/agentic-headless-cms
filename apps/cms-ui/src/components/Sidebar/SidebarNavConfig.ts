import { Globe, Image as ImageIcon, ShieldCheck, Users } from 'lucide-react';
import type { NavItem } from '../../types/navigation.types';

export type { NavItem };

export const sidebarNavConfig: NavItem[] = [
  {
    title: 'All Websites',
    href: '/',
    icon: Globe,
  },
  {
    title: 'Central Media Bank',
    href: '/media',
    icon: ImageIcon,
    requiredCapability: 'manage_media',
  },
  {
    title: 'Users & Roles',
    href: '/users',
    icon: Users,
    requiredCapability: 'manage_users',
    subItems: [
      { title: 'All Users', href: '/users' },
      { title: 'Roles & Permissions', href: '/users/roles' },
    ],
  },
  {
    title: 'Security & IT Ops',
    href: '/security',
    icon: ShieldCheck,
    requiredCapability: 'manage_settings',
    subItems: [
      { title: 'Security Overview', href: '/security' },
      { title: 'MFA Reset Requests', href: '/security?tab=mfa' },
      { title: 'Audit Trail', href: '/audit-logs' },
    ],
  },
];
