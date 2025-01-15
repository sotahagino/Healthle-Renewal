"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Supabaseでログイン
      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Sign in error:', signInError)
        throw signInError
      }

      if (!session) {
        console.error('No session created')
        throw new Error('セッションの作成に失敗しました')
      }

      // スタッフ情報の取得
      const { data: staffRole, error: staffError } = await supabase
        .from('vendor_staff_roles')
        .select('vendor_id, role, status')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single()

      if (staffError) {
        console.error('Staff role fetch error:', staffError)
        throw new Error('薬局スタッフ情報の取得に失敗しました')
      }

      if (!staffRole) {
        console.error('No staff role found')
        throw new Error('このユーザーは薬局スタッフとして登録されていません')
      }

      if (staffRole.status !== 'active') {
        throw new Error('このアカウントは現在無効です')
      }

      // ユーザー情報をローカルストレージに保存
      localStorage.setItem('vendor_id', staffRole.vendor_id)
      localStorage.setItem('staff_role', staffRole.role)

      // ホームページにリダイレクト
      router.push('/')
      router.refresh() // 新しいセッション情報でページを更新
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">薬局スタッフログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}