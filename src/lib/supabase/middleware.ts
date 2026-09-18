import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '@/types/database';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const urlStr = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const keyStr = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured = Boolean(
    urlStr &&
      keyStr &&
      !urlStr.includes('mock.supabase.co') &&
      keyStr !== 'mock-key'
  );

  let userRole: string | null = null;
  let isAuthenticated = false;
  const pathname = request.nextUrl.pathname;

  const requiresAuth = pathname.startsWith('/admin');

  // Fallback kiểm tra cookie auth_role (dành cho chế độ offline/dev)
  const authRoleCookie = request.cookies.get('auth_role')?.value;
  if (authRoleCookie) {
    userRole = authRoleCookie;
    isAuthenticated = true;
  }

  if (isConfigured && requiresAuth && !isAuthenticated) {
    try {
      const supabase = createServerClient<Database>(
        urlStr!,
        keyStr!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              supabaseResponse = NextResponse.next({
                request,
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        isAuthenticated = true;
        userRole =
          user.user_metadata?.role ||
          (user.app_metadata?.role as string) ||
          'athlete';
      }
    } catch (err) {
      console.warn('Middleware Supabase auth error:', err);
    }
  }

  // Kiểm tra bảo vệ tuyến đường quản trị (/admin/*)
  if (requiresAuth) {
    if (!isAuthenticated) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (userRole !== 'organizer' && userRole !== 'admin') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
