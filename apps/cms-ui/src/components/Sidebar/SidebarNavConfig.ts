import {
  FileText,
  Files,
  MessageSquare,
  Tags,
  Image as ImageIcon,
  Users,
  Settings,
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
    subItems: [
      { title: 'All Pages', href: '/pages' },
      { title: 'Add New', href: '/pages/new' },
    ],
  },
  {
    title: 'Media',
    href: '/media',
    icon: ImageIcon,
  },
  {
    title: 'Comments',
    href: '/comments',
    icon: MessageSquare,
  },
  {
    title: 'Tags',
    href: '/tags',
    icon: Tags,
  },
  {
    title: 'Appearance',
    href: '/appearance',
    icon: LayoutTemplate,
    subItems: [
      { title: 'Themes', href: '/appearance/themes' },
      { title: 'Menus', href: '/appearance/menus' },
    ],
  },
  {
    title: 'Plugins',
    href: '/plugins',
    icon: Puzzle,
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    subItems: [
      { title: 'All Users', href: '/users' },
      { title: 'Add New', href: '/users/new' },
      { title: 'Roles', href: '/users/roles' },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    subItems: [
      { title: 'General', href: '/settings/general' },
      { title: 'Reading', href: '/settings/reading' },
      { title: 'Writing', href: '/settings/writing' },
    ],
  },
];
