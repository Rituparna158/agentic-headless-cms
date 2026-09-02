import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Layers,
  ScrollText,
  Settings,
  ShieldCheck,
  SquareCheck,
  Webhook,
  Workflow,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Static placeholder count shown next to the label (e.g. pending approvals) — wired to real data once the content/workflow APIs exist. */
  badge?: number;
  /** When true, the navigation item is frozen/disabled and non-clickable. */
  disabled?: boolean;
  /** Optional badge label for disabled items. */
  disabledBadge?: string;
}

/** Primary navigation — content-authoring surfaces (SRS §4.1–4.7). */
export const primaryNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Content', href: '/content', icon: FileText },
  { label: 'Media', href: '/media', icon: ImageIcon },
  { label: 'Content-Types', href: '/content-types', icon: Layers },
  {
    label: 'Workflows',
    href: '/workflows',
    icon: Workflow,
    disabled: true,
    disabledBadge: 'Soon',
  },
  {
    label: 'Approvals',
    href: '/approvals',
    icon: SquareCheck,
    disabled: true,
    disabledBadge: 'Soon',
  },
  { label: 'Agents', href: '/agents', icon: Bot },
];

/** Secondary navigation — governance/administration surfaces (SRS §4.8–4.9). */
export const secondaryNavItems: NavItem[] = [
  { label: 'Audit Log', href: '/audit-log', icon: ScrollText },
  {
    label: 'Webhooks',
    href: '/webhooks',
    icon: Webhook,
    disabled: true,
    disabledBadge: 'Soon',
  },
  { label: 'Roles & Access', href: '/roles-access', icon: ShieldCheck },
  { label: 'Settings', href: '/settings', icon: Settings },
];
