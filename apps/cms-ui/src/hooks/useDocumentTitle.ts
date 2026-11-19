import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTE_TITLES, APP_TITLE } from './constants/documentTitle.constants';

/** Resolves the page title for a pathname (longest matching prefix wins). */
export const resolveDocumentTitle = (pathname: string): string => {
  const match = ROUTE_TITLES.filter(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  ).sort((a, b) => b[0].length - a[0].length)[0];
  return match ? `${match[1]} · ${APP_TITLE}` : APP_TITLE;
};

/** Keeps document.title in sync with the route so screen readers announce navigation. */
export const useDocumentTitle = (): void => {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = resolveDocumentTitle(pathname);
  }, [pathname]);
};
