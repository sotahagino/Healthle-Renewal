import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 認証が必要なパスの場合
  if (req.nextUrl.pathname.startsWith('/orders') || req.nextUrl.pathname === '/') {
    if (!session) {
      // 未認証の場合、ログインページにリダイレクト
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // vendor_staff_rolesの確認
    const { data: staffRole } = await supabase
      .from('vendor_staff_roles')
      .select('vendor_id, role, status')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    if (!staffRole?.vendor_id || staffRole.status !== 'active') {
      // vendor_idが見つからないか、アカウントが無効な場合、ログインページにリダイレクト
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // ログインページへのアクセス
  if (req.nextUrl.pathname === '/login') {
    if (session) {
      // セッションがある場合、vendor_staff_rolesの確認
      const { data: staffRole } = await supabase
        .from('vendor_staff_roles')
        .select('vendor_id, role, status')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();

      if (staffRole?.vendor_id && staffRole.status === 'active') {
        // アクティブなスタッフの場合はホーム画面にリダイレクト
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 