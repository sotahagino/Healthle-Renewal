"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, User, ChevronRight, Edit, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

// Mock order history
const mockOrders = [
  { id: "HL-12345", date: "2023年12月15日", total: 5980, status: "発送済み" },
  { id: "HL-12344", date: "2023年11月20日", total: 3980, status: "配達完了" },
  { id: "HL-12343", date: "2023年10月5日", total: 2980, status: "配達完了" },
]

interface UserProfile {
  name: string
  email: string
  created_at: string
  gender?: string
  birth_year?: string
  birth_month?: string
  birth_day?: string
  postal_code?: string
  prefecture?: string
  city?: string
  address?: string
  phone_number?: string
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

export default function MyPage() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState("orders")
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
  }, [user, loading, router])

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) return

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          console.log('No active session, redirecting to login')
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          if (error.code === 'PGRST301') {
            // JWTが期限切れの場合は一度だけリフレッシュを試みる
            try {
              const { data: { session: refreshedSession }, error: refreshError } = 
                await supabase.auth.refreshSession()
              
              if (refreshError || !refreshedSession) {
                console.log('Session refresh failed, redirecting to login')
                router.push('/login')
                return
              }

              // リフレッシュ成功後に再度プロフィールを取得
              const { data: refreshedData, error: refreshedError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()

              if (refreshedError) {
                console.error('Error fetching profile after refresh:', refreshedError)
                setLoadingProfile(false)
                return
              }

              if (refreshedData) {
                setProfile(refreshedData)
                return
              }
            } catch (refreshError) {
              console.error('Error refreshing session:', refreshError)
              router.push('/login')
              return
            }
          }
          setLoadingProfile(false)
          return
        }

        if (data) {
          setProfile(data)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setLoadingProfile(false)
      }
    }

    if (user) {
      fetchUserProfile()
    } else {
      setLoadingProfile(false)
    }
  }, [user, router])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
        <SiteHeader />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#4C9A84]">読み込み中...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#333333]">マイページ</h1>
        <Card className="max-w-4xl mx-auto bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-[#4C9A84] rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                {profile.name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#333333]">{profile.name}</h2>
                <p className="text-[#666666]">{profile.email}</p>
                <p className="text-sm text-[#666666]">会員登録日: {formatDate(profile.created_at)}</p>
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders" className="text-[#4C9A84]">注文履歴</TabsTrigger>
                <TabsTrigger value="profile" className="text-[#4C9A84]">プロフィール</TabsTrigger>
              </TabsList>
              <TabsContent value="orders">
                <h3 className="text-lg font-semibold mb-4 text-[#4C9A84]">注文履歴</h3>
                {mockOrders.map((order) => (
                  <Card key={order.id} className="mb-4">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-[#333333]">注文番号: {order.id}</p>
                          <p className="text-sm text-[#666666]">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#4C9A84]">¥{order.total.toLocaleString()}</p>
                          <p className="text-sm text-[#666666]">{order.status}</p>
                        </div>
                      </div>
                      <Link href={`/orders/${order.id}`} passHref>
                        <Button variant="link" className="text-[#4C9A84] p-0 h-auto">
                          詳細を見る
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="profile">
                <h3 className="text-lg font-semibold mb-4 text-[#4C9A84]">プロフィール情報</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-[#666666]">氏名</p>
                        <p className="font-semibold text-[#333333]">{profile.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">性別</p>
                        <p className="font-semibold text-[#333333]">{profile.gender || '未設定'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">生年月日</p>
                        <p className="font-semibold text-[#333333]">
                          {profile.birth_year ? `${profile.birth_year}年${profile.birth_month}月${profile.birth_day}日` : '未設定'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">メールアドレス</p>
                        <p className="font-semibold text-[#333333]">{profile.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">電話番号</p>
                        <p className="font-semibold text-[#333333]">{profile.phone_number || '未設定'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">郵便番号</p>
                        <p className="font-semibold text-[#333333]">{profile.postal_code || '未設定'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">住所</p>
                        <p className="font-semibold text-[#333333]">
                          {profile.prefecture && profile.city && profile.address 
                            ? `${profile.prefecture}${profile.city}${profile.address}`
                            : '未設定'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">会員登録日</p>
                        <p className="font-semibold text-[#333333]">{formatDate(profile.created_at)}</p>
                      </div>
                    </div>
                    <Link href="/profile/edit" passHref>
                      <Button className="mt-6 bg-[#4C9A84] hover:bg-[#3A8B73] text-white">
                        <Edit className="mr-2 h-4 w-4" />
                        プロフィールを編集
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="mt-8 flex justify-end">
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}

