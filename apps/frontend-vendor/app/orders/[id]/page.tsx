'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface OrderDetails {
  id: string
  order_id: string
  status: string
  total_amount: number
  commission_rate: number | null
  customer_email: string
  shipping_name: string
  shipping_address: string
  shipping_phone: string
  created_at: string
  updated_at: string
  product: {
    name: string
  }
}

export default function OrderDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: vendorData, error: vendorError } = await supabase
          .from('vendor_users')
          .select('vendor_id')
          .eq('user_id', user.id)
          .single()

        if (vendorError) throw vendorError
        if (!vendorData) {
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('vendor_orders')
          .select(`
            id,
            order_id,
            status,
            total_amount,
            commission_rate,
            customer_email,
            shipping_name,
            shipping_address,
            shipping_phone,
            created_at,
            updated_at,
            product_id
          `)
          .eq('id', params.id)
          .eq('vendor_id', vendorData.vendor_id)
          .single()

        if (error) {
          console.error('Supabase error:', error)
          throw new Error('注文情報の取得に失敗しました')
        }
        
        if (!data) {
          throw new Error('注文が見つかりません')
        }

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('id, name')
          .eq('id', data.product_id)
          .single()

        if (productError) {
          console.error('Product fetch error:', productError)
          throw new Error('商品情報の取得に失敗しました')
        }

        const formattedData: OrderDetails = {
          ...data,
          product: productData || { name: '商品情報なし' }
        }

        setOrder(formattedData)
        setStatus(data.status)
      } catch (error) {
        console.error('Error fetching order details:', error)
        toast({
          title: 'エラー',
          description: '注文情報の取得に失敗しました',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [supabase, params.id, toast, router])

  const handleUpdate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_users')
        .select('vendor_id')
        .eq('user_id', user.id)
        .single()

      if (vendorError) throw vendorError
      if (!vendorData) return

      const { error } = await supabase
        .from('vendor_orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .eq('vendor_id', vendorData.vendor_id)

      if (error) throw error

      toast({
        title: '更新完了',
        description: '注文情報を更新しました',
      })
    } catch (error) {
      console.error('Error updating order:', error)
      toast({
        title: 'エラー',
        description: '注文情報の更新に失敗しました',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <div>読み込み中...</div>
  }

  if (!order) {
    return <div>注文が見つかりません</div>
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button asChild variant="ghost">
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            注文一覧に戻る
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>注文詳細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">注文情報</h3>
                  <p>注文ID: {order.order_id}</p>
                  <p>注文日時: {new Date(order.created_at).toLocaleString('ja-JP')}</p>
                  <p>商品名: {order.product.name}</p>
                  <p>金額: ¥{order.total_amount.toLocaleString()}</p>
                  {order.commission_rate && (
                    <p>手数料率: {order.commission_rate}%</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">配送先・顧客情報</h3>
                  <p>氏名: {order.shipping_name}</p>
                  <p>メールアドレス: {order.customer_email}</p>
                  {order.shipping_phone && <p>電話番号: {order.shipping_phone}</p>}
                  <p>住所: {order.shipping_address}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">ステータス管理</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label>ステータス</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="ステータスを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="準備中">準備中</SelectItem>
                        <SelectItem value="発送済み">発送済み</SelectItem>
                        <SelectItem value="キャンセル">キャンセル</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleUpdate}>更新</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

