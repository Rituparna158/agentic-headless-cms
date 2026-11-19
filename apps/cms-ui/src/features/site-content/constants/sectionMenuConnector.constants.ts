import type { MenuOption } from '../types/sectionMenuConnector.types';

export const DEFAULT_SECTION_MENUS: MenuOption[] = [
  { id: 'header-primary', name: 'Header Primary Navigation' },
  { id: 'footer-links', name: 'Footer Legal & Resources' },
  { id: 'mobile-nav', name: 'Mobile Slide-out Menu' },
];

export const DATA_CMS_MENU_REGEX = /data-cms-menu=["']([^"']+)["']/;
export const STATIC_LINKS_CONTAINER_REGEX =
  /<([a-z0-9]+)[^>]*>(\s*<a\s+[^>]*>.*?<\/a>\s*)+<\/\1>/is;
