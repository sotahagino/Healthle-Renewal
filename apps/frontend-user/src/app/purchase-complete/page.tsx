'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function PurchaseCompletePage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('メールアドレスとパスワードは必須です')
      return
    }

    try {
      // セッションIDを取得
      const sessionId = searchParams.get('session_id')
      
      // メールアドレスを保存
      if (sessionId) {
        await fetch('/api/orders/update-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            session_id: sessionId,
            email: email 
          })
        })
      }

      // アカウント作成
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signUpError) throw signUpError

      // 成功メッセージを表示
      alert('アカウントが作成されました。確認メールをご確認ください。')
    } catch (error) {
      console.error('Signup error:', error)
      setError(error instanceof Error ? error.message : 'アカウント作成に失敗しました')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FBFA] via-white to-[#F8FBFA] py-12">
      <div className="container mx-auto px-4 max-w-lg">
        <h1 className="text-2xl font-bold text-[#2D3748] mb-8">ご購入ありがとうございます</h1>
        <p className="text-[#4A5568] mb-4">ご注文の確認メールをお送りしましたので、ご確認ください。</p>
        <p className="text-[#4A5568] mb-8">注文番号: {searchParams.get('order_id')}</p>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#2D3748] mb-6">アカウント登録のご案内</h2>
          <p className="text-[#4A5568] mb-4">アカウントを登録すると、以下のサービスがご利用いただけます：</p>
          <ul className="list-disc list-inside text-[#4A5568] mb-6">
            <li>注文履歴の確認</li>
            <li>配送状況の追跡</li>
            <li>過去の相談内容等の確認</li>
          </ul>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4A5568] mb-1">
                  メールアドレス
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4A5568] mb-1">
                  パスワード
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                  placeholder="8文字以上の英数字"
                  required
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
              >
                アカウントを作成
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 