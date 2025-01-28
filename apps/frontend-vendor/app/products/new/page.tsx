'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import ProductForm from '../_components/ProductForm'
import { type ProductFormValues } from '../_components/ProductForm'

export default function NewProductPage() {
  const router = useRouter()
  const { isAuthenticated, vendorId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/vendor/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          vendor_id: vendorId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '商品の登録に失敗しました')
      }

      router.push('/products')
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProductForm
      mode="new"
      onSubmit={onSubmit}
    />
  )
}

