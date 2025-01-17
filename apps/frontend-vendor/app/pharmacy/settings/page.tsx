'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import PharmacyForm from '../_components/PharmacyForm'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'

export default function PharmacySettingsPage() {
  const { user, vendorId } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [currentData, setCurrentData] = useState<any>(null)

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
            handling_categories: licenseData?.handling_categories || vendorData?.handling_categories || [],
            online_notification: notificationData ? {
              notification_date: notificationData.notification_date,
              notification_office: notificationData.notification_authority,
            } : undefined,
            professionals: professionalsData ? professionalsData.map((prof: any) => ({
              qualification: prof.qualification_type,
              name: prof.name,
              license_number: prof.registration_number,
              registration_prefecture: prof.registration_prefecture,
              duties: prof.responsibilities?.[0] || '',
              work_hours: prof.work_schedule,
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

  const handleSubmit = async (partialData: any) => {
    try {
      if (!user) {
        throw new Error('ログインが必要です')
      }

      if (!vendorId) {
        throw new Error('店舗情報が見つかりません')
      }

      // 保存開始のフィードバック
      toast.loading('保存中...')

      // 各テーブルのデータを分離
      const {
        pharmacy_license,
        professionals,
        store_hours,
        consultation_info,
        online_notification,
        handling_categories,
        ...vendorData
      } = partialData

      // vendors テーブルの更新
      const { error: vendorError } = await supabase
        .from('vendors')
        .upsert({
          id: vendorId,
          ...vendorData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })

      if (vendorError) {
        console.error('Vendor save error:', vendorError)
        throw new Error('店舗情報の保存に失敗しました')
      }

      // pharmacy_license が存在する場合、vendor_licenses テーブルを更新
      if (pharmacy_license) {
        // 既存のレコードを確認
        const { data: existingLicense } = await supabase
          .from('vendor_licenses')
          .select('*')
          .eq('vendor_id', vendorId)
          .single()

        const licenseData = {
          vendor_id: vendorId,
          license_type: pharmacy_license.type,
          license_number: pharmacy_license.number,
          issue_date: pharmacy_license.issue_date,
          valid_from: pharmacy_license.issue_date,
          valid_until: pharmacy_license.expiration_date,
          license_holder_name: pharmacy_license.holder_name,
          issuing_authority: pharmacy_license.issuer,
          handling_categories: handling_categories || [],
        }

        if (!existingLicense) {
          // 新規作成
          const { error: licenseError } = await supabase
            .from('vendor_licenses')
            .insert(licenseData)

          if (licenseError) {
            console.error('License save error:', licenseError)
            throw new Error('許可情報の保存に失敗しました')
          }
        } else {
          // 更新
          const { error: licenseError } = await supabase
            .from('vendor_licenses')
            .update(licenseData)
            .eq('vendor_id', vendorId)

          if (licenseError) {
            console.error('License save error:', licenseError)
            throw new Error('許可情報の保存に失敗しました')
          }
        }
      }

      // online_notification が存在する場合、vendor_online_sales_notifications テーブルを更新
      if (online_notification) {
        const { data: existingNotification } = await supabase
          .from('vendor_online_sales_notifications')
          .select('*')
          .eq('vendor_id', vendorId)
          .single()

        if (!existingNotification) {
          // 新規作成
          const { error: notificationError } = await supabase
            .from('vendor_online_sales_notifications')
            .insert({
              vendor_id: vendorId,
              notification_date: online_notification.notification_date,
              notification_authority: online_notification.notification_office,
            })

          if (notificationError) {
            console.error('Notification save error:', notificationError)
            throw new Error('特定販売届出情報の保存に失敗しました')
          }
        } else {
          // 更新
          const { error: notificationError } = await supabase
            .from('vendor_online_sales_notifications')
            .update({
              notification_date: online_notification.notification_date,
              notification_authority: online_notification.notification_office,
            })
            .eq('vendor_id', vendorId)

          if (notificationError) {
            console.error('Notification save error:', notificationError)
            throw new Error('特定販売届出情報の保存に失敗しました')
          }
        }
      }

      // professionals が存在する場合、vendor_professionals テーブルを更新
      if (professionals?.length > 0) {
        // 既存のプロフェッショナルを確認
        const { data: existingProfessionals } = await supabase
          .from('vendor_professionals')
          .select('*')
          .eq('vendor_id', vendorId)

        if (!existingProfessionals || existingProfessionals.length === 0) {
          // 新規作成
          const { error: professionalsError } = await supabase
            .from('vendor_professionals')
            .insert(
              professionals.map((prof: any) => ({
                vendor_id: vendorId,
                name: prof.name,
                qualification_type: prof.qualification,
                registration_number: prof.license_number,
                registration_prefecture: prof.registration_prefecture,
                responsibilities: [prof.duties],
                work_schedule: prof.work_hours,
              }))
            )

          if (professionalsError) {
            console.error('Professionals save error:', professionalsError)
            throw new Error('専門家情報の保存に失敗しました')
          }
        } else {
          // 既存のレコードを削除して新規作成
          const { error: deleteError } = await supabase
            .from('vendor_professionals')
            .delete()
            .eq('vendor_id', vendorId)

          if (deleteError) {
            console.error('Professionals delete error:', deleteError)
            throw new Error('専門家情報の更新に失敗しました')
          }

          const { error: professionalsError } = await supabase
            .from('vendor_professionals')
            .insert(
              professionals.map((prof: any) => ({
                vendor_id: vendorId,
                name: prof.name,
                qualification_type: prof.qualification,
                registration_number: prof.license_number,
                registration_prefecture: prof.registration_prefecture,
                responsibilities: [prof.duties],
                work_schedule: prof.work_hours,
              }))
            )

          if (professionalsError) {
            console.error('Professionals save error:', professionalsError)
            throw new Error('専門家情報の保存に失敗しました')
          }
        }
      }

      // 保存完了のフィードバック
      toast.dismiss()
      toast.success(
        `${
          pharmacy_license ? '許可情報' :
          professionals ? '専門家情報' :
          online_notification ? '営業情報' :
          consultation_info ? '相談応需情報' :
          '基本情報'
        }を保存しました`,
        {
          duration: 3000,
          position: 'top-center',
        }
      )

      router.refresh()
    } catch (error) {
      toast.dismiss()
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : '予期せぬエラーが発生しました', {
        duration: 5000,
        position: 'top-center',
      })
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