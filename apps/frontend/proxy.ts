import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIES } from '@repo/constants';

const AUTH_ROUTES = [
  '/login',
  '/accept-invite',
  '/forgot-password',
  '/reset-password',
];

//it only confirms a session cookie exists.

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(`${AUTH_COOKIES.PREFIX}headless_cms`);
  console.log(
    `[Next.js Middleware] Checking session for route ${request.nextUrl.pathname}. hasSession=${hasSession}, cookieName=${AUTH_COOKIES.PREFIX}headless_cms`,
  );
  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!hasSession && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
