import { NextResponse, type NextRequest } from 'next/server';

const legacyHtmlRedirects: Record<string, string> = {
  '/ops.html': '/ops',
  '/ops-login.html': '/ops-login'
};

export function proxy(request: NextRequest) {
  const destination = legacyHtmlRedirects[request.nextUrl.pathname];

  if (!destination) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = destination;
  redirectUrl.search = request.nextUrl.search;

  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: ['/ops.html', '/ops-login.html']
};
