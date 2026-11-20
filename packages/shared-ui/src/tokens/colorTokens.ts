export const COLOR_CODES = {
  dark: {
    canvas: '#09090b',
    sidebar: '#121316', // Deep Obsidian Slate
    sidebarSurface: '#17181D',
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
    canvasWarm: '#FDFBF7', // Warm Sand White for Page Editor & Article Studio
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
    statusLiveBg: '#DCFCE7',
    statusLiveText: '#15803D',
    statusLiveBorder: '#BBF7D0',
    statusDraftBg: '#FEF3C7',
    statusDraftText: '#B45309',
    statusDraftBorder: '#FDE68A',
    statusStagingBg: '#EEF2FF',
    statusStagingText: '#4338CA',
    statusStagingBorder: '#C7D2FE',
    statusDangerBg: '#FEE2E2',
    statusDangerText: '#B91C1C',
    statusDangerBorder: '#FECACA',
  },
} as const;

/**
 * Master Blueprint Color Tokens for Non-Tech First Headless CMS
 */
export const CMS_COLOR_TOKENS = {
  // Navigation / Sidebar
  sidebarNav: '#121316', // Deep Obsidian Slate
  sidebarSurface: '#17181D', // Obsidian Surface Card
  activePill: '#27272A', // Carbon Muted
  hoverState: '#27272A', // Carbon Muted
  mutedTypography: '#A1A1AA', // Muted text

  // Primary Actions
  primaryCarbon: '#18181B', // Deep Carbon
  primaryIndigo: '#4F46E5', // Indigo 600
  focusRing: '#6366F1', // Indigo 500 Focus Outline

  // Content Canvas
  canvasWarmWhite: '#FDFBF7', // Warm Sand White
  canvasBorder: '#E5E0D8',
  canvasText: '#1C1917',

  // Semantic Status Badges
  status: {
    live: {
      text: '#15803D', // Forest Green Text
      bg: '#DCFCE7', // Mint Soft Background
      border: '#BBF7D0',
      darkText: '#34d399',
      darkBg: 'rgba(16, 185, 129, 0.1)',
      darkBorder: 'rgba(16, 185, 129, 0.2)',
    },
    draft: {
      text: '#B45309', // Warm Amber Text
      bg: '#FEF3C7', // Honey Soft Background
      border: '#FDE68A',
      darkText: '#fbbf24',
      darkBg: 'rgba(245, 158, 11, 0.1)',
      darkBorder: 'rgba(245, 158, 11, 0.2)',
    },
    staging: {
      text: '#4338CA', // Indigo Text
      bg: '#EEF2FF', // Lavender Soft Background
      border: '#C7D2FE',
      darkText: '#818CF8',
      darkBg: 'rgba(67, 56, 202, 0.15)',
      darkBorder: 'rgba(99, 102, 241, 0.25)',
    },
    danger: {
      text: '#B91C1C', // Crimson Text
      bg: '#FEE2E2', // Blush Soft Background
      border: '#FECACA',
      darkText: '#f87171',
      darkBg: 'rgba(185, 28, 28, 0.15)',
      darkBorder: 'rgba(239, 68, 68, 0.25)',
    },
  },
} as const;

/**
 * Semantic theme class tokens for Workspace Sidebar, Badges, and Canvas
 */
export const CMS_THEME_CLASSES = {
  sidebar: {
    aside:
      'flex flex-col h-full bg-[#121316] text-[#A1A1AA] transition-all duration-300 ease-in-out border-r border-zinc-800',
    topBar:
      'flex items-center justify-between h-14 px-3 border-b border-zinc-800/80 shrink-0',
    backButton:
      'flex items-center gap-2 text-xs font-medium text-[#A1A1AA] hover:text-white px-2 py-1.5 rounded-md hover:bg-[#27272A]/70 transition-colors overflow-hidden',
    collapseToggle:
      'p-1.5 rounded-md hover:bg-[#27272A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] text-[#A1A1AA] hover:text-zinc-100 ml-auto shrink-0',
    siteCard: 'p-3 border-b border-zinc-800/70 bg-[#17181D]/80 shrink-0',
    siteTitle:
      'text-xs font-semibold uppercase tracking-wider text-zinc-100 truncate',
    siteDomain: 'text-[11px] text-[#A1A1AA] truncate',
    sectionHeader:
      'px-2 text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1.5',
    devSectionHeader:
      'px-2 text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1.5 flex items-center gap-1.5',
    navItemActive:
      'flex items-center justify-between px-2.5 py-2 rounded-md text-sm transition-colors bg-[#27272A] text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#6366F1]',
    navItemInactive:
      'flex items-center justify-between px-2.5 py-2 rounded-md text-sm transition-colors text-[#A1A1AA] hover:text-zinc-100 hover:bg-[#27272A]/50 focus:outline-none focus:ring-2 focus:ring-[#6366F1]',
    counterBadge:
      'text-[11px] text-[#A1A1AA] bg-zinc-800/80 px-1.5 py-0.5 rounded-full font-mono',
    footer: 'p-3 border-t border-zinc-800/80 shrink-0',
    userRow: 'flex items-center gap-2.5 mb-2.5 px-1',
    userAvatar:
      'w-7 h-7 rounded-full bg-[#27272A] text-zinc-200 flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-zinc-700',
    logoutButton:
      'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs text-[#A1A1AA] hover:text-zinc-100 hover:bg-[#27272A]/70 transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] disabled:opacity-50',
  },
  badges: {
    live: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/50',
    draft:
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/50',
    staging:
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE] dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800/50',
    danger:
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/50',
  },
  canvas: {
    warmSand: 'bg-[#FDFBF7] text-[#1C1917] border-[#E5E0D8]',
    articleColumn:
      'max-w-[920px] mx-auto py-12 px-8 bg-[#FDFBF7] text-[#1C1917]',
  },
  buttons: {
    primary:
      'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#6366F1]',
    indigo:
      'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#6366F1]',
    secondary:
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#44403C] hover:text-[#1C1917] hover:bg-[#F5F0E6] text-xs font-medium border border-[#D6CFC2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] disabled:opacity-50 disabled:pointer-events-none dark:bg-transparent dark:text-zinc-300 dark:hover:text-white dark:hover:bg-[#27272A] dark:border-zinc-800',
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
