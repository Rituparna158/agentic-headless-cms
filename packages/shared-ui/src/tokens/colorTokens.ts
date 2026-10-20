export const COLOR_CODES = {
  dark: {
    canvas: '#09090b',
    sidebar: '#0c0c0e',
    drawer: '#0e0e11',
    drawerHeader: '#121216',
    card: '#18181b',
    cardMuted: 'rgba(24, 24, 27, 0.4)',
    border: '#27272a',
    borderSubtle: 'rgba(39, 39, 42, 0.6)',
    textPrimary: '#f4f4f5',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    accent: '#6366f1',
    accentHover: '#4f46e5',
    accentBg: 'rgba(79, 70, 229, 0.15)',
    accentBorder: 'rgba(99, 102, 241, 0.3)',
    accentText: '#a5b4fc',
    statusLiveBg: 'rgba(16, 185, 129, 0.1)',
    statusLiveText: '#34d399',
    statusLiveBorder: 'rgba(16, 185, 129, 0.2)',
    statusDraftBg: 'rgba(245, 158, 11, 0.1)',
    statusDraftText: '#fbbf24',
    statusDraftBorder: 'rgba(245, 158, 11, 0.2)',
  },
  light: {
    canvas: '#ffffff',
    sidebar: '#f8f8f9',
    drawer: '#ffffff',
    drawerHeader: '#fafafa',
    card: '#ffffff',
    cardMuted: '#f4f4f5',
    border: '#e4e4e7',
    borderSubtle: 'rgba(228, 228, 231, 0.4)',
    textPrimary: '#09090b',
    textSecondary: '#71717a',
    textMuted: '#a1a1aa',
    accent: '#18181b',
    accentHover: '#27272a',
    accentBg: '#f4f4f5',
    accentBorder: '#e4e4e7',
    accentText: '#18181b',
    statusLiveBg: 'rgba(16, 185, 129, 0.1)',
    statusLiveText: '#059669',
    statusLiveBorder: 'rgba(16, 185, 129, 0.2)',
    statusDraftBg: 'rgba(245, 158, 11, 0.1)',
    statusDraftText: '#d97706',
    statusDraftBorder: 'rgba(245, 158, 11, 0.2)',
  },
} as const;

/**
 * Semantic class mapping helper tokens for Master-Detail views in the dark palette
 */
export const THEME_CLASSES = {
  layout: {
    pageContainer:
      'flex flex-col h-full bg-[#09090b] text-zinc-100 animate-in fade-in duration-300',
    pageHeader: 'px-6 py-6 border-b border-zinc-800/80 bg-[#09090b]',
    splitContainer: 'flex-1 flex overflow-hidden',
    masterSidebar:
      'w-64 border-r border-zinc-800 bg-[#0c0c0e] flex flex-col shrink-0',
    masterSidebarHeader:
      'p-4 flex items-center justify-between border-b border-zinc-800/80',
    masterSidebarTitle:
      'text-xs font-bold text-zinc-400 uppercase tracking-wider',
    detailPanel: 'flex-1 flex flex-col overflow-hidden bg-[#09090b]',
    detailHeader:
      'flex items-center justify-between p-6 border-b border-zinc-800/80 bg-[#09090b]',
    detailBody: 'flex-1 overflow-y-auto p-6 space-y-6',
    emptyState: 'flex-1 flex items-center justify-center text-zinc-500 text-sm',
  },
  list: {
    itemActive:
      'w-full text-left px-3 py-2.5 text-xs rounded-xl transition-all flex items-center justify-between bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 font-semibold shadow-xs',
    itemInactive:
      'w-full text-left px-3 py-2.5 text-xs rounded-xl transition-all flex items-center justify-between border border-transparent hover:bg-zinc-900/80 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200',
    itemBadge:
      'text-xs text-zinc-400 font-mono ml-2 shrink-0 px-1.5 py-0.5 rounded bg-zinc-800/80',
  },
  table: {
    container:
      'rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl',
    table: 'w-full text-left text-xs',
    headerRow:
      'border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-medium',
    headerCell: 'py-3.5 px-4',
    bodyRow: 'hover:bg-zinc-800/40 transition-colors group cursor-pointer',
    bodyCell: 'py-3.5 px-4',
  },
  badges: {
    live: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    draft:
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20',
    counter:
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-mono',
  },
  buttons: {
    primary:
      'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all',
    secondary:
      'px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-medium border border-zinc-800 transition-colors',
    icon: 'p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors',
  },
} as const;
