'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

const licenseSchema = z.object({
  pharmacy_license: z.object({
    type: z.string().min(1, '許可区分を入力してください'),
    number: z.string().min(1, '許可番号を入力してください'),
    issue_date: z.string().min(1, '発行年月日を入力してください'),
    expiration_date: z.string().min(1, '有効期限を入力してください'),
    holder_name: z.string().min(1, '許可証の名義人を入力してください'),
    issuer: z.string().min(1, '許可証発行自治体名を入力してください'),
  }),
  handling_categories: z.array(z.string()).min(1, '取扱医薬品区分を1つ以上選択してください'),
  online_notification: z.object({
    notification_date: z.string().default(''),
    notification_office: z.string().default(''),
  }).default({}),
})

export type LicenseFormValues = z.infer<typeof licenseSchema>

const HANDLING_CATEGORIES = [
  '要指導医薬品',
  '第一類医薬品',
  '第二類医薬品',
  '第三類医薬品',
  '医療用医薬品',
]

interface LicenseFormProps {
  initialData?: Partial<LicenseFormValues>
  vendorId: string
}

export default function LicenseForm({ initialData, vendorId }: LicenseFormProps) {
  const supabase = createClientComponentClient()
  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseSchema),
    defaultValues: initialData || {
      pharmacy_license: {
        type: '',
        number: '',
        issue_date: '',
        expiration_date: '',
        holder_name: '',
        issuer: '',
      },
      handling_categories: [],
      online_notification: {
        notification_date: '',
        notification_office: '',
      },
    }
  })

  const onSubmit = async (data: LicenseFormValues) => {
    try {
      console.log('Submitting data:', data) // デバッグ用ログ

      // 許可情報の更新
      const licenseData = {
        vendor_id: vendorId,
        license_type: data.pharmacy_license.type,
        license_number: data.pharmacy_license.number,
        issue_date: data.pharmacy_license.issue_date,
        valid_until: data.pharmacy_license.expiration_date,
        license_holder_name: data.pharmacy_license.holder_name,
        issuing_authority: data.pharmacy_license.issuer,
        handling_categories: data.handling_categories,
      }

      console.log('License data to be inserted:', licenseData) // デバッグ用ログ

      const { data: existingLicense, error: fetchError } = await supabase
        .from('vendor_licenses')
        .select()
        .eq('vendor_id', vendorId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing license:', fetchError)
        throw fetchError
      }

      let licenseError
      if (existingLicense) {
        // 既存のデータがある場合は更新
        const { error } = await supabase
          .from('vendor_licenses')
          .update(licenseData)
          .eq('vendor_id', vendorId)
        licenseError = error
      } else {
        // 新規データの場合は挿入
        const { error } = await supabase
          .from('vendor_licenses')
          .insert(licenseData)
        licenseError = error
      }

      if (licenseError) {
        console.error('License update/insert error:', licenseError)
        throw licenseError
      }

      // オンライン販売届出情報の更新
      if (data.online_notification.notification_date || data.online_notification.notification_office) {
        const notificationData = {
          vendor_id: vendorId,
          notification_date: data.online_notification.notification_date,
          notification_authority: data.online_notification.notification_office,
        }

        console.log('Notification data to be inserted:', notificationData) // デバッグ用ログ

        const { data: existingNotification, error: fetchNotificationError } = await supabase
          .from('vendor_online_sales_notifications')
          .select()
          .eq('vendor_id', vendorId)
          .single()

        if (fetchNotificationError && fetchNotificationError.code !== 'PGRST116') {
          console.error('Error fetching existing notification:', fetchNotificationError)
          throw fetchNotificationError
        }

        let notificationError
        if (existingNotification) {
          // 既存のデータがある場合は更新
          const { error } = await supabase
            .from('vendor_online_sales_notifications')
            .update(notificationData)
            .eq('vendor_id', vendorId)
          notificationError = error
        } else {
          // 新規データの場合は挿入
          const { error } = await supabase
            .from('vendor_online_sales_notifications')
            .insert(notificationData)
          notificationError = error
        }

        if (notificationError) {
          console.error('Notification update/insert error:', notificationError)
          throw notificationError
        }
      }

      toast.success('許可情報を保存しました')
    } catch (error) {
      console.error('Error updating license info:', error)
      toast.error('許可情報の保存に失敗しました')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">薬局開設許可証</h3>
          <FormField
            control={form.control}
            name="pharmacy_license.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>許可区分 *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pharmacy_license.number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>許可番号 *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pharmacy_license.issue_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>発行年月日 *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pharmacy_license.expiration_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>有効期限 *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pharmacy_license.holder_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>許可証の名義人 *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pharmacy_license.issuer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>許可証発行自治体名 *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">取扱医薬品区分</h3>
          <div className="grid grid-cols-2 gap-4">
            {HANDLING_CATEGORIES.map((category) => (
              <FormField
                key={category}
                control={form.control}
                name="handling_categories"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(category)}
                        onCheckedChange={(checked) => {
                          const updatedValue = checked
                            ? [...field.value || [], category]
                            : field.value?.filter((value) => value !== category) || []
                          field.onChange(updatedValue)
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {category}
                    </FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">特定販売の届出</h3>
          <FormField
            control={form.control}
            name="online_notification.notification_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>届出年月日</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="online_notification.notification_office"
            render={({ field }) => (
              <FormItem>
                <FormLabel>届出先機関</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">保存</Button>
      </form>
    </Form>
  )
} 