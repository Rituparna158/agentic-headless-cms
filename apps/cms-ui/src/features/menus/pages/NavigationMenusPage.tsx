import { isPageEntry } from '@/lib/entryKinds';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Compass,
  Plus,
  Save,
  GripVertical,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  IndentIncrease,
  IndentDecrease,
  CornerDownRight,
  X,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { findMenusEntry, menusApi, readMenus } from '../api/menus.api';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import { useCmsToast } from '@/hooks/useCmsToast';
import { postsApi, extractArrayPayload } from '../../posts/api/posts.api';
import type { PageEntry } from '@/types/content.types';
import type {
  MenuItem,
  MenuDefinition,
  StoredMenus,
} from '../types/menus.types';
import {
  MAX_MENU_DEPTH as MAX_DEPTH,
  DEFAULT_MENUS,
  getMenuStorageKey as storageKey,
} from '../constants/menus.constants';

const readStored = (siteId: string): StoredMenus | null => {
  try {
    const raw = window.localStorage.getItem(storageKey(siteId));
    return raw ? (JSON.parse(raw) as StoredMenus) : null;
  } catch {
    return null;
  }
};

/** Clamp every item's depth so no item is nested deeper than its predecessor allows. */
const normalizeDepths = (items: MenuItem[]): MenuItem[] =>
  items.map((item, i) => {
    const maxAllowed =
      i === 0 ? 0 : Math.min(MAX_DEPTH, items[i - 1]!.depth + 1);
    return item.depth > maxAllowed ? { ...item, depth: maxAllowed } : item;
  });

export const NavigationMenusPage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const toast = useCmsToast();

  const stored = useMemo(() => (siteId ? readStored(siteId) : null), [siteId]);

  const [menus, setMenus] = useState<MenuDefinition[]>(
    stored?.menus?.length ? stored.menus : DEFAULT_MENUS,
  );
  const [activeMenu, setActiveMenu] = useState<string>(
    (stored?.menus?.[0] ?? DEFAULT_MENUS[0]!).id,
  );
  const [itemsByMenu, setItemsByMenu] = useState<Record<string, MenuItem[]>>(
    stored?.items ?? {},
  );
  const [hasSeeded, setHasSeeded] = useState<boolean>(Boolean(stored));
  const [isDirty, setIsDirty] = useState(false);

  const [isCreatingMenu, setIsCreatingMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const menuItems = itemsByMenu[activeMenu] ?? [];

  const updateItems = useCallback(
    (updater: (prev: MenuItem[]) => MenuItem[]) => {
      setItemsByMenu((prev) => ({
        ...prev,
        [activeMenu]: normalizeDepths(updater(prev[activeMenu] ?? [])),
      }));
      setIsDirty(true);
    },
    [activeMenu],
  );

  // Query real pages from this site's collection
  const { data: rawPages, isLoading: isPagesLoading } = useQuery({
    queryKey: ['collection-pages', siteId],
    queryFn: () => postsApi.listPagesForCollection(siteId || ''),
    enabled: Boolean(siteId),
    staleTime: 5 * 60 * 1000,
  });

  const availablePages = useMemo(() => {
    const list = extractArrayPayload<PageEntry>(rawPages);
    // Only real pages can be linked: menus, tags, shared sections, redirects,
    // posts and visitor messages share the collection but are not pages
    return list.filter(isPageEntry).map((p) => ({
      id: p.id,
      title: p.title || (p.data?.title as string) || 'Untitled Page',
      path: p.slug ? (p.slug.startsWith('/') ? p.slug : `/${p.slug}`) : '/',
    }));
  }, [rawPages]);

  const queryClient = useQueryClient();
  const menusEntry = useMemo(
    () => findMenusEntry(extractArrayPayload<PageEntry>(rawPages)),
    [rawPages],
  );
  const [loadedFromServer, setLoadedFromServer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Menus saved on the website take over from anything kept in this browser
  useEffect(() => {
    if (loadedFromServer || isPagesLoading) return;
    const saved = readMenus(menusEntry);
    if (saved) {
      setMenus(saved.menus.length ? saved.menus : DEFAULT_MENUS);
      setActiveMenu((saved.menus[0] ?? DEFAULT_MENUS[0]!).id);
      setItemsByMenu(saved.items);
      setHasSeeded(true);
    }
    setLoadedFromServer(true);
  }, [menusEntry, isPagesLoading, loadedFromServer]);

  const [selectedPageIds, setSelectedPageIds] = useState<
    Record<string, boolean>
  >({});

  // Seed the primary menu from real pages once, when there is nothing saved yet
  useEffect(() => {
    if (hasSeeded || availablePages.length === 0) return;
    setItemsByMenu((prev) => ({
      ...prev,
      'header-primary': availablePages.slice(0, 5).map((p) => ({
        id: p.id,
        label: p.title,
        path: p.path,
        depth: 0,
      })),
    }));
    setHasSeeded(true);
  }, [availablePages, hasSeeded]);

  const [customLabel, setCustomLabel] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  const handleAddSelectedPages = () => {
    const pagesToAdd = availablePages.filter((p) => selectedPageIds[p.id]);
    if (!pagesToAdd.length) return;
    updateItems((prev) => [
      ...prev,
      ...pagesToAdd.map((p) => ({
        id: `${p.id}-${Date.now()}`,
        label: p.title,
        path: p.path,
        depth: 0,
      })),
    ]);
    setSelectedPageIds({});
  };

  const handleAddCustomLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLabel.trim() || !customUrl.trim()) return;
    updateItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        label: customLabel.trim(),
        path: customUrl.trim(),
        isCustom: true,
        depth: 0,
      },
    ]);
    setCustomLabel('');
    setCustomUrl('');
  };

  /** Removing a parent also lifts its children so they are never silently lost. */
  const handleDeleteItem = (id: string) => {
    updateItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      const removedDepth = prev[idx]!.depth;
      const next = prev.filter((i) => i.id !== id);
      for (let j = idx; j < next.length && next[j]!.depth > removedDepth; j++) {
        next[j] = { ...next[j]!, depth: next[j]!.depth - 1 };
      }
      return next;
    });
  };

  const handleChangeDepth = (id: string, delta: 1 | -1) => {
    updateItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, depth: Math.max(0, Math.min(MAX_DEPTH, i.depth + delta)) }
          : i,
      ),
    );
  };

  /** Move an item together with its nested children as one block. */
  const moveBlock = (id: string, targetId: string) => {
    updateItems((prev) => {
      const from = prev.findIndex((i) => i.id === id);
      const to = prev.findIndex((i) => i.id === targetId);
      if (from === -1 || to === -1 || from === to) return prev;

      let end = from + 1;
      while (end < prev.length && prev[end]!.depth > prev[from]!.depth) end++;
      const block = prev.slice(from, end);
      if (to >= from && to < end) return prev; // dropped inside its own block

      const rest = [...prev.slice(0, from), ...prev.slice(end)];
      let insertAt = rest.findIndex((i) => i.id === targetId);
      if (to > from) insertAt += 1; // dragging down lands after the target
      rest.splice(insertAt, 0, ...block);
      return rest;
    });
  };

  const handleMoveStep = (id: string, direction: -1 | 1) => {
    const idx = menuItems.findIndex((i) => i.id === id);
    const target = menuItems[idx + direction];
    if (!target) return;
    moveBlock(id, target.id);
  };

  const handleEditItem = (
    id: string,
    patch: Partial<Pick<MenuItem, 'label' | 'path'>>,
  ) => {
    updateItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateMenu = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMenuName.trim();
    if (!name) return;
    const id = `${
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'menu'
    }-${Date.now()}`;
    setMenus((prev) => [...prev, { id, name }]);
    setItemsByMenu((prev) => ({ ...prev, [id]: [] }));
    setActiveMenu(id);
    setNewMenuName('');
    setIsCreatingMenu(false);
    setIsDirty(true);
    toast.show({
      title: 'Menu created',
      message: `"${name}" is ready. Add pages or custom links to build it.`,
      type: 'success',
    });
  };

  const handleSave = async () => {
    if (!siteId) return;
    setIsSaving(true);
    try {
      await menusApi.save(siteId, menusEntry, { menus, items: itemsByMenu });
      await queryClient.invalidateQueries({
        queryKey: ['collection-pages', siteId],
      });
      setIsDirty(false);
      toast.show({
        title: 'Menu saved',
        message: 'Your menus are saved and published with the website.',
        type: 'success',
      });
    } catch {
      toast.show({
        title: 'Could not save',
        message: 'The menus were not saved. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="px-8 py-5 border-b border-border bg-card/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/" className="hover:text-foreground transition-colors">
              Websites
            </Link>
            <span>/</span>
            <span className="capitalize">{siteId}</span>
            <span>/</span>
            <span className="text-foreground font-medium">
              Navigation Menus
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary" />
            Navigation Menus
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure header, footer, and mobile navigation link hierarchies for
            this site.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              Unsaved changes
            </span>
          )}
          <button
            type="button"
            className={`${CMS_THEME_CLASSES.buttons.primary} disabled:opacity-50`}
            disabled={!isDirty || isSaving}
            onClick={handleSave}
          >
            <Save size={14} />
            <span>Save Menu</span>
          </button>
        </div>
      </header>

      {/* Selector Bar */}
      <div className="px-8 py-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <label
            htmlFor="menu-select"
            className="font-medium text-muted-foreground"
          >
            Select a menu to edit:
          </label>
          <select
            id="menu-select"
            value={activeMenu}
            onChange={(e) => setActiveMenu(e.target.value)}
            className="bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {isCreatingMenu ? (
          <form onSubmit={handleCreateMenu} className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={newMenuName}
              onChange={(e) => setNewMenuName(e.target.value)}
              placeholder="Menu name, e.g. Sidebar Links"
              aria-label="New menu name"
              className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-56"
            />
            <button
              type="submit"
              disabled={!newMenuName.trim()}
              className={`${CMS_THEME_CLASSES.buttons.primary} text-xs disabled:opacity-40`}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingMenu(false);
                setNewMenuName('');
              }}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted"
              aria-label="Cancel creating menu"
            >
              <X size={14} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreatingMenu(true)}
            className="text-primary hover:underline font-medium flex items-center gap-1"
          >
            <Plus size={13} />
            <span>Create New Menu</span>
          </button>
        )}
      </div>

      {/* Main Builder Grid */}
      <div className="flex-1 overflow-hidden grid grid-cols-12">
        {/* Left Column: Add Menu Items */}
        <div className="col-span-12 md:col-span-4 border-r border-border p-6 overflow-y-auto space-y-6 bg-card/20">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Add Pages to Menu
            </h2>
            {isPagesLoading ? (
              <div className="p-4 border border-border rounded-lg bg-card text-center text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                Loading website pages...
              </div>
            ) : availablePages.length === 0 ? (
              <div className="p-4 border border-border rounded-lg bg-card text-center text-xs text-muted-foreground">
                No published pages in this site yet.
              </div>
            ) : (
              <div className="space-y-2 border border-border rounded-lg p-3 bg-card max-h-48 overflow-y-auto">
                {availablePages.map((page) => (
                  <label
                    key={page.id}
                    className="flex items-center gap-2 text-xs text-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!selectedPageIds[page.id]}
                      onChange={(e) =>
                        setSelectedPageIds((prev) => ({
                          ...prev,
                          [page.id]: e.target.checked,
                        }))
                      }
                      className="rounded border-border"
                    />
                    <span className="truncate">
                      {page.title}{' '}
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({page.path})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            <button
              type="button"
              disabled={!Object.values(selectedPageIds).some(Boolean)}
              onClick={handleAddSelectedPages}
              className={`mt-2.5 w-full ${CMS_THEME_CLASSES.buttons.secondary} justify-center disabled:opacity-40`}
            >
              <Plus size={13} />
              <span>Add Selected Pages to Menu</span>
            </button>
          </div>

          <form
            onSubmit={handleAddCustomLink}
            className="border-t border-border pt-5"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Custom Web Link
            </h2>
            <div className="space-y-3 border border-border rounded-lg p-3 bg-card">
              <div>
                <label
                  htmlFor="custom-link-label"
                  className="block text-[11px] font-medium text-muted-foreground mb-1"
                >
                  Link Label
                </label>
                <input
                  id="custom-link-label"
                  type="text"
                  placeholder="e.g. Client Portal, Docs"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label
                  htmlFor="custom-link-url"
                  className="block text-[11px] font-medium text-muted-foreground mb-1"
                >
                  URL / Target
                </label>
                <input
                  id="custom-link-url"
                  type="text"
                  placeholder="https://app.acme.com"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!customLabel.trim() || !customUrl.trim()}
              className={`mt-2.5 w-full ${CMS_THEME_CLASSES.buttons.secondary} justify-center disabled:opacity-40`}
            >
              <Plus size={13} />
              <span>Add Custom Link</span>
            </button>
          </form>
        </div>

        {/* Center / Right Canvas: Menu Structure */}
        <div className="col-span-12 md:col-span-8 p-6 overflow-y-auto bg-muted/10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Menu Structure
                </h2>
                <p className="text-xs text-muted-foreground">
                  Drag to reorder. Use the indent buttons to nest a link under
                  the one above it.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {menuItems.length} active link
                {menuItems.length === 1 ? '' : 's'}
              </span>
            </div>

            {menuItems.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
                <Compass className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <h3 className="text-sm font-semibold text-foreground">
                  No links added to this menu
                </h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Select pages from the left column or add custom links.
                </p>
              </div>
            ) : (
              <ul className="space-y-2" aria-label="Menu structure">
                {menuItems.map((item, index) => {
                  const isExpanded = expandedIds.has(item.id);
                  const isDropTarget =
                    dragOverId === item.id && dragId !== item.id;
                  return (
                    <li
                      key={item.id}
                      style={{ marginLeft: item.depth * 28 }}
                      draggable
                      onDragStart={(e) => {
                        setDragId(item.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverId !== item.id) setDragOverId(item.id);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragId) moveBlock(dragId, item.id);
                        setDragId(null);
                        setDragOverId(null);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setDragOverId(null);
                      }}
                      className={`rounded-lg border bg-card shadow-xs transition-all ${
                        dragId === item.id ? 'opacity-40' : ''
                      } ${
                        isDropTarget
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between p-3 gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <GripVertical
                            size={16}
                            className="text-muted-foreground cursor-grab shrink-0"
                            aria-hidden
                          />
                          {item.depth > 0 && (
                            <CornerDownRight
                              size={13}
                              className="text-muted-foreground shrink-0"
                              aria-hidden
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {item.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">
                              {item.path}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="hidden sm:inline text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono mr-1">
                            {item.isCustom ? 'Custom Link' : 'Page'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMoveStep(item.id, -1)}
                            disabled={index === 0}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                            title="Move up"
                            aria-label={`Move ${item.label} up`}
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStep(item.id, 1)}
                            disabled={index === menuItems.length - 1}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                            title="Move down"
                            aria-label={`Move ${item.label} down`}
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChangeDepth(item.id, -1)}
                            disabled={item.depth === 0}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                            title="Move out (un-nest)"
                            aria-label={`Un-nest ${item.label}`}
                          >
                            <IndentDecrease size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChangeDepth(item.id, 1)}
                            disabled={
                              index === 0 ||
                              item.depth >= MAX_DEPTH ||
                              item.depth > (menuItems[index - 1]?.depth ?? 0)
                            }
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                            title="Nest under the link above"
                            aria-label={`Nest ${item.label} under the link above`}
                          >
                            <IndentIncrease size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleExpanded(item.id)}
                            aria-expanded={isExpanded}
                            className="ml-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors flex items-center gap-1"
                          >
                            Details
                            <ChevronDown
                              size={12}
                              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remove link"
                            aria-label={`Remove ${item.label}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border px-4 py-3 bg-muted/20 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-b-lg">
                          <div>
                            <label
                              htmlFor={`label-${item.id}`}
                              className="block text-[11px] font-medium text-muted-foreground mb-1"
                            >
                              Navigation Label
                            </label>
                            <input
                              id={`label-${item.id}`}
                              type="text"
                              value={item.label}
                              onChange={(e) =>
                                handleEditItem(item.id, {
                                  label: e.target.value,
                                })
                              }
                              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`path-${item.id}`}
                              className="block text-[11px] font-medium text-muted-foreground mb-1"
                            >
                              {item.isCustom ? 'URL / Target' : 'Page path'}
                            </label>
                            <input
                              id={`path-${item.id}`}
                              type="text"
                              value={item.path}
                              readOnly={!item.isCustom}
                              onChange={(e) =>
                                handleEditItem(item.id, {
                                  path: e.target.value,
                                })
                              }
                              className="w-full text-xs font-mono px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring read-only:opacity-60"
                            />
                            {!item.isCustom && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Change a page&apos;s URL from Pages &amp;
                                Sitemap.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
