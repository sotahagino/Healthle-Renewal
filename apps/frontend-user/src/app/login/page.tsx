"use client"

import { useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('パスワードが一致しません')
        }
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
      
      const returnUrl = localStorage.getItem('returnUrl')
      if (returnUrl) {
        localStorage.removeItem('returnUrl')
        window.location.href = returnUrl
      } else {
        window.location.href = '/mypage'
      }
    } catch (error) {
      console.error('Authentication error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FBFA] to-white">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-3 pb-8">
            <CardTitle className="text-3xl font-bold text-center text-[#4C9A84]">
              {isSignUp ? '新規会員登録' : 'ログイン'}
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              {isSignUp 
                ? 'アカウントを作成して、Healthleの全機能をご利用ください'
                : 'メールアドレスとパスワードでログインしてください'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    メールアドレス
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    パスワード
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8文字以上の英数字"
                      className="h-11 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <Icons.eyeOff className="h-5 w-5" />
                      ) : (
                        <Icons.eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      パスワード（確認）
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="パスワードを再入力"
                        className="h-11 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <Icons.eyeOff className="h-5 w-5" />
                        ) : (
                          <Icons.eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="text-sm">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-[#4C9A84] hover:bg-[#3A8B73] text-white font-medium text-base"
                disabled={loading}
              >
                {loading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {loading ? '処理中...' : (isSignUp ? '登録する' : 'ログイン')}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">または</span>
                </div>
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[#4C9A84] font-medium hover:text-[#3A8B73]"
                >
                  {isSignUp ? 'アカウントをお持ちの方はこちら' : '新規会員登録はこちら'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

