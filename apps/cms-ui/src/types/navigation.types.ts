import type { LucideIcon } from 'lucide-react';

export interface NavSubItem {
  title: string;
  href: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  requiredCapability?: string;
  requiredRoles?: string[];
}
