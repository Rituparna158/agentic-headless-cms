import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ExternalLink, Link2, Sparkles, Unlink } from 'lucide-react';
import type { SectionMenuConnectorProps } from '../types/sectionMenuConnector.types';
import {
  DATA_CMS_MENU_REGEX,
  STATIC_LINKS_CONTAINER_REGEX,
} from '../constants/sectionMenuConnector.constants';

export const SectionMenuConnector: React.FC<SectionMenuConnectorProps> = ({
  secHtml,
  onHtmlChange,
  secRole,
  siteId,
  availableMenus,
}) => {
  const currentMenuId = useMemo(() => {
    const match = DATA_CMS_MENU_REGEX.exec(secHtml);
    return match ? match[1] : null;
  }, [secHtml]);

  const defaultSuggested = useMemo(() => {
    if (secRole === 'footer') return 'footer-links';
    return 'header-primary';
  }, [secRole]);

  const [selectedMenuToAttach, setSelectedMenuToAttach] = useState<string>(
    currentMenuId || defaultSuggested,
  );

  const activeMenuObj = useMemo(() => {
    if (!currentMenuId) return null;
    return (
      availableMenus.find((m) => m.id === currentMenuId) || {
        id: currentMenuId,
        name: currentMenuId,
      }
    );
  }, [currentMenuId, availableMenus]);

  const hasStaticLinks = useMemo(() => {
    return !currentMenuId && STATIC_LINKS_CONTAINER_REGEX.test(secHtml);
  }, [currentMenuId, secHtml]);

  const handleSwitchMenu = (newMenuId: string) => {
    if (!currentMenuId) return;
    const updated = secHtml.replace(
      DATA_CMS_MENU_REGEX,
      `data-cms-menu="${newMenuId}"`,
    );
    onHtmlChange(updated);
  };

  const handleDisconnect = () => {
    const updated = secHtml.replace(/\s*data-cms-menu=["'][^"']+["']/, '');
    onHtmlChange(updated);
  };

  const handleConnectMenu = () => {
    const targetMenu = selectedMenuToAttach || defaultSuggested;

    // Check if HTML already has static links container (e.g. <div id="..."><a href="...">...</a></div>)
    if (STATIC_LINKS_CONTAINER_REGEX.test(secHtml)) {
      const updated = secHtml.replace(
        STATIC_LINKS_CONTAINER_REGEX,
        (match, tag) => {
          // If the tag doesn't have data-cms-menu, inject it and clear inner static links
          const openTag = match.slice(0, match.indexOf('>') + 1);
          const closeTag = `</${tag}>`;
          const openTagWithMenu = openTag.includes('data-cms-menu')
            ? openTag
            : openTag.replace(/>$/, ` data-cms-menu="${targetMenu}">`);
          return `${openTagWithMenu}${closeTag}`;
        },
      );
      onHtmlChange(updated);
      return;
    }

    // If there is an existing <nav> or <header> tag without menu, attach it
    if (
      /<nav(\s+[^>]*)?>/i.test(secHtml) &&
      !DATA_CMS_MENU_REGEX.test(secHtml)
    ) {
      const updated = secHtml.replace(/<nav(\s+[^>]*)?>/i, (m) =>
        m.replace(/>$/, ` data-cms-menu="${targetMenu}">`),
      );
      onHtmlChange(updated);
      return;
    }

    // Otherwise append or prepend a clean navigation element
    const navSnippet = `<nav data-cms-menu="${targetMenu}"></nav>`;
    if (secHtml.includes('</header>')) {
      onHtmlChange(secHtml.replace('</header>', `  ${navSnippet}\n</header>`));
    } else if (secHtml.includes('</footer>')) {
      onHtmlChange(secHtml.replace('</footer>', `  ${navSnippet}\n</footer>`));
    } else {
      onHtmlChange(secHtml ? `${secHtml}\n${navSnippet}` : navSnippet);
    }
  };

  const insertSnippet = (snippet: string) => {
    onHtmlChange(secHtml ? `${secHtml}\n${snippet}` : snippet);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Navigation Menu Connection
          </span>
        </div>
        {siteId && (
          <Link
            to={`/sites/${siteId}/menus`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            <span>Open Menu Builder</span>
            <ExternalLink size={11} />
          </Link>
        )}
      </div>

      {currentMenuId ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected: {activeMenuObj?.name}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Dynamic links from <code>{currentMenuId}</code> will automatically
              hydrate inside this section.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              aria-label="Switch navigation menu"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground"
              value={currentMenuId}
              onChange={(e) => handleSwitchMenu(e.target.value)}
            >
              {availableMenus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleDisconnect}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-rose-600 rounded-lg hover:bg-muted transition-colors"
              title="Remove dynamic menu binding"
            >
              <Unlink size={12} />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs">
          <p className="text-muted-foreground">
            No dynamic menu is connected to this section yet. Choose a menu to
            display navigation links automatically without hardcoding HTML.
          </p>

          {hasStaticLinks && (
            <div className="flex items-center justify-between p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px]">
              <span>
                Detected static <code>&lt;a&gt;</code> links. Connecting will
                replace them with your live dynamic menu.
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <select
              aria-label="Select menu to connect"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground"
              value={selectedMenuToAttach}
              onChange={(e) => setSelectedMenuToAttach(e.target.value)}
            >
              {availableMenus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleConnectMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 transition-opacity"
            >
              <Link2 size={13} />
              <span>Connect Dynamic Menu</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Insert Helpers */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1 mr-1">
          <Sparkles size={11} className="text-amber-500" />
          <span>Quick Elements:</span>
        </span>
        <button
          type="button"
          onClick={() => insertSnippet('<div data-cms-site="logo"></div>')}
          className="px-2 py-0.5 rounded border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors"
        >
          + Logo Element
        </button>
        <button
          type="button"
          onClick={() =>
            insertSnippet('<nav data-cms-menu="header-primary"></nav>')
          }
          className="px-2 py-0.5 rounded border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors"
        >
          + Header Menu
        </button>
        <button
          type="button"
          onClick={() =>
            insertSnippet('<nav data-cms-menu="footer-links"></nav>')
          }
          className="px-2 py-0.5 rounded border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors"
        >
          + Footer Menu
        </button>
      </div>
    </div>
  );
};
