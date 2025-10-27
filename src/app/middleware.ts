import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
   // Skip auth for public routes
  const publicRoutes = ['/api/health', '/api/setup'];
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    console.log("Skipping auth for public route:", request.nextUrl.pathname);
    return NextResponse.next();
  }

  // Protect API routes that require authentication
  const protectedRoutes = ['/api/events', '/api/services', '/api/admin'];
  if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    const apiKey = request.headers.get('x-api-key');
    
    console.log("Checking API key for protected route:", request.nextUrl.pathname);
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
      console.log("Unauthorized access attempt to:", request.nextUrl.pathname);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log("API key valid for:", request.nextUrl.pathname);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/events',
    '/api/events/:path*',     // Protect all events API routes
    '/api/services/:path*',   // Protect all services API routes 
    '/api/admin/:path*',      // Protect admin routes
    // Add more protected routes as needed
  ]
};
