import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicRoutes = ['/login', '/register', '/', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // API routes that need auth
  const isApiRoute = pathname.startsWith('/api/') && !pathname.startsWith('/api/auth');

  // If not authenticated and trying to access protected route
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated, redirect from login/register to dashboard
  if (token && (pathname === '/login' || pathname === '/register')) {
    const role = token.role as string;
    const dashboardUrl = new URL(`/${role.toLowerCase()}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Role-based access control
  if (token) {
    const role = token.role as string;

    // Admin routes
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/${role.toLowerCase()}/dashboard`, request.url));
    }

    // Doctor routes
    if (pathname.startsWith('/doctor') && role !== 'DOCTOR') {
      return NextResponse.redirect(new URL(`/${role.toLowerCase()}/dashboard`, request.url));
    }

    // Patient routes
    if (pathname.startsWith('/patient') && role !== 'PATIENT') {
      return NextResponse.redirect(new URL(`/${role.toLowerCase()}/dashboard`, request.url));
    }

    // API role checks
    if (isApiRoute) {
      if (pathname.startsWith('/api/admin') && role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (pathname.startsWith('/api/doctor') && role !== 'DOCTOR') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|icons).*)',
  ],
};
