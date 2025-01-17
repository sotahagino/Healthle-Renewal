'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import BasicInfoForm from '../_components/forms/BasicInfoForm'
import LicenseForm from '../_components/forms/LicenseForm'
import ProfessionalsForm from '../_components/forms/ProfessionalsForm'
import BusinessForm from '../_components/forms/BusinessForm'
import ConsultationForm from '../_components/forms/ConsultationForm'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PharmacySettingsPage() {
  const { user, vendorId, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [currentData, setCurrentData] = useState<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 認証状態のロードが完了し、かつユーザーが存在しない場合はホームにリダイレクト
        if (!authLoading && !user) {
          router.push('/')
          return
        }

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

          // vendor_emergency_contacts テーブルのデータを取得
          const { data: emergencyContactsData, error: emergencyContactsError } = await supabase
            .from('vendor_emergency_contacts')
            .select('*')
            .eq('vendor_id', vendorId)

          if (emergencyContactsError) {
            console.error('Emergency contacts fetch error:', emergencyContactsError)
            throw new Error('相談応需情報の取得に失敗しました')
          }

          // 通常時と緊急時の相談応需情報を分離
          const normalContact = emergencyContactsData?.find(contact => contact.type === 'normal')
          const emergencyContact = emergencyContactsData?.find(contact => contact.type === 'emergency')

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

          // vendor_business_hours テーブルのデータを取得
          const { data: businessHoursData, error: businessHoursError } = await supabase
            .from('vendor_business_hours')
            .select('*')
            .eq('vendor_id', vendorId)

          if (businessHoursError) {
            console.error('Business hours data fetch error:', businessHoursError)
            throw new Error('営業時間情報の取得に失敗しました')
          }

          // 営業時間データを種別ごとに分類
          const storeHours = businessHoursData?.filter(hours => hours.type === 'store')
            .reduce((acc, hours) => ({
              ...acc,
              [hours.weekday]: {
                start: hours.start_time,
                end: hours.end_time,
                breakStart: hours.break_start_time,
                breakEnd: hours.break_end_time,
                is_holiday: hours.is_holiday,
              }
            }), {})

          const onlineOrderHours = businessHoursData?.find(hours => hours.type === 'online_order')
          const onlineSalesHours = businessHoursData?.filter(hours => hours.type === 'online_sales')
            .reduce((acc, hours) => ({
              ...acc,
              [hours.weekday]: {
                start: hours.start_time,
                end: hours.end_time,
                is_holiday: hours.is_holiday,
              }
            }), {})

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
            store_hours: {
              store: storeHours || {
                '月': { start: '09:00', end: '17:00' },
                '火': { start: '09:00', end: '17:00' },
                '水': { start: '09:00', end: '17:00' },
                '木': { start: '09:00', end: '17:00' },
                '金': { start: '09:00', end: '17:00' },
                '土': { start: '09:00', end: '17:00' },
                '日': { start: '09:00', end: '17:00' },
                '祝': { start: '09:00', end: '17:00' },
              },
              online_order: onlineOrderHours ? {
                type: onlineOrderHours.start_time === '00:00' && onlineOrderHours.end_time === '24:00' ? '24hours' : 'business_hours',
                start: onlineOrderHours.start_time,
                end: onlineOrderHours.end_time,
              } : { type: '24hours', start: '00:00', end: '24:00' },
              online_sales: onlineSalesHours || {
                '月': { start: '09:00', end: '17:00' },
                '火': { start: '09:00', end: '17:00' },
                '水': { start: '09:00', end: '17:00' },
                '木': { start: '09:00', end: '17:00' },
                '金': { start: '09:00', end: '17:00' },
                '土': { start: '09:00', end: '17:00' },
                '日': { start: '09:00', end: '17:00' },
                '祝': { start: '09:00', end: '17:00' },
              },
            },
            consultation_info: {
              normal: {
                phone: normalContact?.phone || '',
                email: normalContact?.email || '',
                hours: normalContact?.available_hours?.hours || '平日 9:00～18:00',
              },
              emergency: {
                phone: emergencyContact?.phone || '',
                email: emergencyContact?.email || '',
                hours: emergencyContact?.available_hours?.hours || '24時間対応',
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
  }, [supabase, user, vendorId, authLoading, router])

  // 認証状態のロード中は読み込み中表示
  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold">店舗情報設定</h1>
          </div>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  // vendorIdが取得できない場合はエラーメッセージを表示
  if (!vendorId) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold">店舗情報設定</h1>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>店舗情報が見つかりません。システム管理者にお問い合わせください。</p>
        </div>
      </div>
    )
  }

  // データ取得が完了していない場合はローディング表示
  if (!currentData) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold">店舗情報設定</h1>
          </div>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Toaster />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">店舗情報設定</h1>
        </div>
      </div>
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="license">許可情報</TabsTrigger>
          <TabsTrigger value="professionals">専門家情報</TabsTrigger>
          <TabsTrigger value="business">営業情報</TabsTrigger>
          <TabsTrigger value="consultation">相談応需情報</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <BasicInfoForm
            initialData={currentData}
            vendorId={vendorId}
          />
        </TabsContent>

        <TabsContent value="license">
          <LicenseForm
            initialData={currentData}
            vendorId={vendorId}
          />
        </TabsContent>

        <TabsContent value="professionals">
          <ProfessionalsForm
            initialData={currentData}
            vendorId={vendorId}
          />
        </TabsContent>

        <TabsContent value="business">
          <BusinessForm
            initialData={currentData}
            vendorId={vendorId}
          />
        </TabsContent>

        <TabsContent value="consultation">
          <ConsultationForm
            initialData={currentData}
            vendorId={vendorId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 