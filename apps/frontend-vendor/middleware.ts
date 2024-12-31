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

    // vendor_idの確認
    const { data: vendorUser } = await supabase
      .from('vendor_users')
      .select('vendor_id')
      .eq('user_id', session.user.id)
      .single();

    if (!vendorUser?.vendor_id) {
      // vendor_idが見つからない場合、ログインページにリダイレクト
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // ログインページへのアクセス
  if (req.nextUrl.pathname === '/login') {
    if (session) {
      // セッションがある場合でも、vendor_idの確認
      const { data: vendorUser } = await supabase
        .from('vendor_users')
        .select('vendor_id')
        .eq('user_id', session.user.id)
        .single();

      if (vendorUser?.vendor_id) {
        // vendor_idが存在する場合はホーム画面にリダイレクト
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/', '/orders/:path*', '/login'],
}; 