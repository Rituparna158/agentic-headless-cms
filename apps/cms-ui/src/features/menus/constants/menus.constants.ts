import type { MenuDefinition } from '../types/menus.types';

export const MAX_MENU_DEPTH = 2;

export const DEFAULT_MENUS: MenuDefinition[] = [
  { id: 'header-primary', name: 'Header Primary Navigation' },
  { id: 'footer-links', name: 'Footer Legal & Resources' },
  { id: 'mobile-nav', name: 'Mobile Slide-out Menu' },
];

export const getMenuStorageKey = (siteId: string) => `cms-ui:menus:${siteId}`;
