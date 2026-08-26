import {
  FileText,
  Files,
  MessageSquare,
  Tags,
  Image as ImageIcon,
  Users,
  Settings,
  ShieldCheck,
  Puzzle,
  LayoutTemplate,
  LayoutDashboard,
  LucideIcon,
} from 'lucide-react';
export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  subItems?: { title: string; href: string }[];
  requiredCapability?: string;
  requiredRoles?: string[];
}
export const sidebarNavConfig: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Posts',
    href: '/posts',
    icon: FileText,
    requiredCapability: 'manage_content',
    subItems: [
      { title: 'All Posts', href: '/posts' },
      { title: 'Add New', href: '/posts/new' },
      { title: 'Categories', href: '/posts/categories' },
    ],
  },
  {
    title: 'Pages',
    href: '/pages',
    icon: Files,
    requiredCapability: 'manage_content',
    subItems: [
      { title: 'All Pages', href: '/pages' },
      { title: 'Add New', href: '/pages/new' },
    ],
  },
  {
    title: 'Media',
    href: '/media',
    icon: ImageIcon,
    requiredCapability: 'manage_media',
  },
  {
    title: 'Comments',
    href: '/comments',
    icon: MessageSquare,
    requiredCapability: 'manage_content',
  },
  {
    title: 'Tags',
    href: '/tags',
    icon: Tags,
    requiredCapability: 'manage_content',
  },
  {
    title: 'Appearance',
    href: '/appearance',
    icon: LayoutTemplate,
    requiredCapability: 'manage_appearance',
    subItems: [
      { title: 'Themes', href: '/appearance/themes' },
      { title: 'Menus', href: '/appearance/menus' },
    ],
  },
  {
    title: 'Plugins',
    href: '/plugins',
    icon: Puzzle,
    requiredCapability: 'manage_plugins',
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    requiredCapability: 'manage_users',
    subItems: [
      { title: 'All Users', href: '/users' },
      { title: 'Roles', href: '/users/roles' },
    ],
  },
  {
    title: 'MFA Requests',
    href: '/users/mfa-requests',
    icon: ShieldCheck,
    requiredRoles: ['admin', 'support'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    requiredCapability: 'manage_settings',
    subItems: [
      { title: 'General', href: '/settings/general' },
      { title: 'Reading', href: '/settings/reading' },
      { title: 'Writing', href: '/settings/writing' },
    ],
  },
  {
    title: 'Security',
    href: '/security',
    icon: ShieldCheck,
    subItems: [{ title: 'MFA Integration', href: '/security' }],
  },
];
