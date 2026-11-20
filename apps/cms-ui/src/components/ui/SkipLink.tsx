/** Lets keyboard users jump past the sidebar straight to the page content. */
export const MAIN_CONTENT_ID = 'main-content';

export const SkipLink = () => (
  <a
    href={`#${MAIN_CONTENT_ID}`}
    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
  >
    Skip to main content
  </a>
);
