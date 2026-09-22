import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'budget_auth';
const SALT = ':budget-planner-salt-v1';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(request: NextRequest) {
  const serverPassword = process.env.AUTH_PASSWORD;

  // If no password is configured, bypass authentication
  if (!serverPassword) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Allow static files, Next.js internals, and login page
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(COOKIE_NAME);
  const expectedToken = await hashPassword(serverPassword);

  if (authCookie && authCookie.value === expectedToken) {
    return NextResponse.next();
  }

  // If unauthenticated:
  // For API requests, return 401 Unauthorized
  if (pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For page requests, redirect to /login
  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
