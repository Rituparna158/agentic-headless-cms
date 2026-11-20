/** Flat list + depth keeps drag-reorder and nesting simple and predictable. */
export interface MenuItem {
  id: string;
  label: string;
  path: string;
  isCustom?: boolean;
  depth: number;
}

export interface MenuDefinition {
  id: string;
  name: string;
}

export interface StoredMenus {
  menus: MenuDefinition[];
  items: Record<string, MenuItem[]>;
}

// Aliases for backward compatibility
export type StoredMenuItem = MenuItem;
export type StoredMenuDefinition = MenuDefinition;
