import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    const publicPaths = [
      '/login',
      '/verify',
    ]

    const isPublic = publicPaths.some(path =>
      pathname.startsWith(path))

    // Allow public paths without token
    if (isPublic) {
      // If already authenticated and
      // hitting /login, redirect to dashboard
      if (token && pathname === '/login') {
        return NextResponse.redirect(
          new URL('/dashboard', req.url))
      }
      return NextResponse.next()
    }

    // If no token on protected route,
    // redirect to login
    if (!token) {
      return NextResponse.redirect(
        new URL('/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized() {
        // Always return true — let the
        // middleware function above handle
        // the logic
        return true
      }
    }
  }
)

// CRITICAL: exclude NextAuth API routes,
// static files, and images from middleware
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|uploads).*)',
  ]
}
