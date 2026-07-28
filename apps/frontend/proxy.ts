import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIES } from '@repo/shared-types';

const AUTH_ROUTES = ['/login', '/accept-invite'];

//it only confirms a session cookie exists.

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(AUTH_COOKIES.NAME);
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
