'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import PharmacyForm from '@/app/pharmacy/_components/PharmacyForm'

export default function PharmacySettingsPage() {
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
        .from('vendors')
        .update({
          vendor_name: data.vendor_name,
          email: data.email,
          phone: data.phone,
          postal_code: data.postal_code,
          prefecture: data.prefecture,
          city: data.city,
          address_line1: data.address_line1,
          address_line2: data.address_line2,
          business_hours: data.business_hours,
          consultation_hours: data.consultation_hours,
          license_number: data.license_number,
          owner_name: data.owner_name,
          description: data.description,
          images: data.images,
        })
        .eq('id', vendorId)

      if (error) throw error

      router.push('/pharmacy')
    } catch (error) {
      console.error('Error updating pharmacy:', error)
      throw error
    }
  }

  return (
    <PharmacyForm
      mode="edit"
      onSubmit={handleSubmit}
    />
  )
} 