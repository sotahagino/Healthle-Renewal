'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ProductForm from '../../_components/ProductForm'

export default function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { isAuthenticated, vendorId } = useAuth()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: data.name,
          description: data.description,
          category: data.category,
          price: parseInt(data.price),
          image_url: data.image_url,
          status: data.status,
          purchase_limit: data.purchase_limit ? parseInt(data.purchase_limit) : null,
          stock_quantity: parseInt(data.stock_quantity),
          medicine_type: data.medicine_type,
          ingredients: data.ingredients,
          effects: data.effects,
          usage_instructions: data.usage_instructions,
          precautions: data.precautions,
          requires_questionnaire: data.requires_questionnaire,
          requires_pharmacist_consultation: data.requires_pharmacist_consultation,
          shipping_info: data.shipping_info,
        })
        .eq('id', params.id)
        .eq('vendor_id', vendorId)

      if (error) throw error

      router.push(`/products/${params.id}`)
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  return (
    <ProductForm
      mode="edit"
      productId={params.id}
      onSubmit={handleSubmit}
    />
  )
}

