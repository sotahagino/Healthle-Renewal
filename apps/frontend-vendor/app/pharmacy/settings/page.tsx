'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import PharmacyForm, { PharmacyFormValues } from '../_components/PharmacyForm'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'

export default function PharmacySettingsPage() {
  const { user, vendorId } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [currentData, setCurrentData] = useState<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) {
          setLoading(false)
          return
        }

        // vendorIdが未設定の場合、vendor_staffsテーブルを確認
        if (!vendorId) {
          const { data: staffData, error: staffError } = await supabase
            .from('vendor_staffs')
            .select('vendor_id')
            .eq('user_id', user.id)
            .single()

          if (staffError && staffError.code !== 'PGRST116') {
            console.error('Staff fetch error:', staffError)
            throw new Error('スタッフ情報の取得に失敗しました')
          }

          // スタッフ情報が見つからない場合、新しいvendorを作成
          if (!staffData) {
            const { data: newVendor, error: vendorError } = await supabase
              .from('vendors')
              .insert({})
              .select()
              .single()

            if (vendorError) {
              console.error('Vendor creation error:', vendorError)
              throw new Error('店舗情報の作成に失敗しました')
            }

            // vendor_staffsテーブルに登録
            const { error: newStaffError } = await supabase
              .from('vendor_staffs')
              .insert({
                user_id: user.id,
                vendor_id: newVendor.id,
                role: 'owner'
              })

            if (newStaffError) {
              console.error('Staff creation error:', newStaffError)
              throw new Error('スタッフ情報の作成に失敗しました')
            }
          }
        }

        // 現在のデータを取得
        if (vendorId) {
          // vendors テーブルのデータを取得
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', vendorId)
            .single()

          if (vendorError) {
            console.error('Vendor data fetch error:', vendorError)
            throw new Error('店舗情報の取得に失敗しました')
          }

          // vendor_licenses テーブルのデータを取得
          const { data: licenseData, error: licenseError } = await supabase
            .from('vendor_licenses')
            .select('*')
            .eq('vendor_id', vendorId)
            .single()

          if (licenseError && licenseError.code !== 'PGRST116') {
            console.error('License data fetch error:', licenseError)
            throw new Error('許可情報の取得に失敗しました')
          }

          // vendor_online_sales_notifications テーブルのデータを取得
          const { data: notificationData, error: notificationError } = await supabase
            .from('vendor_online_sales_notifications')
            .select('*')
            .eq('vendor_id', vendorId)
            .single()

          if (notificationError && notificationError.code !== 'PGRST116') {
            console.error('Notification data fetch error:', notificationError)
            throw new Error('特定販売届出情報の取得に失敗しました')
          }

          // vendor_professionals テーブルのデータを取得
          const { data: professionalsData, error: professionalsError } = await supabase
            .from('vendor_professionals')
            .select('*')
            .eq('vendor_id', vendorId)

          if (professionalsError) {
            console.error('Professionals data fetch error:', professionalsError)
            throw new Error('専門家情報の取得に失敗しました')
          }

          // 管理者と一般の専門家を分離
          const managerData = professionalsData?.find(prof => prof.is_manager)
          const otherProfessionals = professionalsData?.filter(prof => !prof.is_manager)

          // データを結合
          const combinedData = {
            ...vendorData,
            pharmacy_license: licenseData ? {
              type: licenseData.license_type,
              number: licenseData.license_number,
              issue_date: licenseData.issue_date,
              expiration_date: licenseData.valid_until,
              holder_name: licenseData.license_holder_name,
              issuer: licenseData.issuing_authority,
            } : undefined,
            handling_categories: licenseData?.handling_categories || [],
            online_notification: notificationData ? {
              notification_date: notificationData.notification_date,
              notification_office: notificationData.notification_authority,
            } : undefined,
            pharmacist_manager: managerData ? {
              qualification: managerData.qualification_type,
              name: managerData.name,
              license_number: managerData.registration_number,
              registration_prefecture: managerData.registration_prefecture,
              duties: managerData.responsibilities?.[0] || '',
              work_hours: managerData.work_schedule?.hours || '',
              staff_type: managerData.staff_type,
              uniform_info: managerData.uniform_info,
            } : undefined,
            professionals: otherProfessionals ? otherProfessionals.map(prof => ({
              qualification: prof.qualification_type,
              name: prof.name,
              license_number: prof.registration_number,
              registration_prefecture: prof.registration_prefecture,
              duties: prof.responsibilities?.[0] || '',
              work_hours: prof.work_schedule?.hours || '',
              staff_type: prof.staff_type,
              uniform_info: prof.uniform_info,
            })) : [],
            store_hours: vendorData.store_hours || {
              online_order: '24時間365日',
              store: '平日 9:00～18:00',
              online_sales: '平日 9:00～18:00',
            },
            consultation_info: vendorData.consultation_info || {
              normal: {
                phone: '',
                email: '',
                hours: '平日 9:00～18:00',
              },
              emergency: {
                phone: '',
                email: '',
                hours: '24時間対応',
              },
            },
          }

          setCurrentData(combinedData)
        }
      } catch (error) {
        console.error('Data fetch error:', error)
        toast.error(error instanceof Error ? error.message : '予期せぬエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, vendorId, supabase])

  const handleSubmit = async (data: Partial<PharmacyFormValues>) => {
    setLoading(true)
    setError('')

    try {
      if (!vendorId) throw new Error('店舗IDが見つかりません')

      // 専門家情報の保存
      if (data.pharmacist_manager || data.professionals) {
        // 既存の専門家情報を削除
        const { error: deleteError } = await supabase
          .from('vendor_professionals')
          .delete()
          .eq('vendor_id', vendorId)

        if (deleteError) throw deleteError

        // 管理者情報を保存
        if (data.pharmacist_manager) {
          const managerData = {
            vendor_id: vendorId,
            is_manager: true,
            qualification_type: data.pharmacist_manager.qualification,
            name: data.pharmacist_manager.name,
            license_number: data.pharmacist_manager.license_number,
            registration_prefecture: data.pharmacist_manager.registration_prefecture,
            responsibilities: [data.pharmacist_manager.duties],
            work_schedule: { hours: data.pharmacist_manager.work_hours },
            staff_type: data.pharmacist_manager.staff_type,
            uniform_info: data.pharmacist_manager.uniform_info,
          }
          const { error: managerError } = await supabase
            .from('vendor_professionals')
            .insert(managerData)

          if (managerError) throw managerError
        }

        // その他の専門家情報を保存
        if (data.professionals && data.professionals.length > 0) {
          const professionalsData = data.professionals.map(prof => ({
            vendor_id: vendorId,
            is_manager: false,
            qualification_type: prof.qualification,
            name: prof.name,
            license_number: prof.license_number,
            registration_prefecture: prof.registration_prefecture,
            responsibilities: [prof.duties],
            work_schedule: { hours: prof.work_hours },
            staff_type: prof.staff_type,
            uniform_info: prof.uniform_info,
          }))

          const { error: professionalsError } = await supabase
            .from('vendor_professionals')
            .insert(professionalsData)

          if (professionalsError) throw professionalsError
        }

        toast.success('専門家情報を保存しました', { duration: 3000 })
      }
    } catch (err) {
      console.error('Vendor save error:', err)
      setError('店舗情報の保存に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>読み込み中...</div>
  }

  if (!user) {
    return <div>ログインが必要です</div>
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <PharmacyForm mode="edit" onSubmit={handleSubmit} initialData={currentData} />
    </>
  )
} 