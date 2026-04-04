import { NextResponse } from 'next/server'

export function proxy(request) {
  const host = request.headers.get('host') || ''
  const path = request.nextUrl.pathname

  // Rutas de superadmin solo accesibles desde ops.itrustb2b.com
  const isAdminRoute = path.startsWith('/superadmin') || path.startsWith('/api/auth/totp')
  const isOpsSubdomain = host.startsWith('ops.')

  if (isAdminRoute && !isOpsSubdomain) {
    // Desde el dominio principal → 404
    return NextResponse.rewrite(new URL('/404', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/superadmin/:path*', '/api/auth/totp/:path*'],
}
