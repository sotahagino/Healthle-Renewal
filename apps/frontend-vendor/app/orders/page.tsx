'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'
import { DataTable } from './data-table'
import { columns } from './columns'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  order_id: string
  status: string
  total_amount: number
  created_at: string
  customer_email: string
  shipping_name: string
  shipping_address: string
  shipping_phone: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated, vendorId } = useAuth()
  const supabase = createClientComponentClient()

  const fetchOrders = async () => {
    if (!isAuthenticated || !vendorId) {
      console.log('Not authenticated or no vendor ID')
      return
    }

    try {
      console.log('Fetching orders for vendor:', vendorId)
      const { data: orderData, error: orderError } = await supabase
        .from('vendor_orders')
        .select(`
          id,
          order_id,
          status,
          total_amount,
          created_at,
          customer_email,
          shipping_name,
          shipping_address,
          shipping_phone
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })

      console.log('Order query result:', { orderData, orderError })

      if (orderError) {
        console.error('Order fetch error:', orderError)
        return
      }

      if (orderData) {
        setOrders(orderData)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [isAuthenticated, vendorId])

  if (loading) {
    return <div>読み込み中...</div>
  }

  if (!isAuthenticated) {
    return <div>認証が必要です</div>
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            ホームへ戻る
          </Link>
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-4">注文一覧</h1>
      <DataTable columns={columns} data={orders} />
    </div>
  )
}

