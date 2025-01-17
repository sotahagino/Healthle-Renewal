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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const timeSchema = z.object({
  start: z.string().min(1, '開始時間を入力してください').default('09:00'),
  end: z.string().min(1, '終了時間を入力してください').default('17:00'),
  breakStart: z.string().optional(),
  breakEnd: z.string().optional(),
  is_holiday: z.boolean().default(false),
})

const onlineOrderSchema = z.object({
  type: z.enum(['24hours', 'business_hours']).default('24hours'),
  start: z.string().min(1, '開始時間を入力してください').default('00:00'),
  end: z.string().min(1, '終了時間を入力してください').default('24:00'),
})

const businessSchema = z.object({
  store_hours: z.object({
    store: z.record(timeSchema).default({}),
    online_order: onlineOrderSchema.default({ type: '24hours', start: '00:00', end: '24:00' }),
    online_sales: z.record(timeSchema).default({}),
  }).default({}),
})

export type BusinessFormValues = z.infer<typeof businessSchema>

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日', '祝'] as const
type Weekday = typeof WEEKDAYS[number]

interface BusinessFormProps {
  initialData?: Partial<BusinessFormValues>
  vendorId: string
}

export default function BusinessForm({ initialData, vendorId }: BusinessFormProps) {
  const supabase = createClientComponentClient()
  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: initialData || {
      store_hours: {
        store: WEEKDAYS.reduce((acc, day) => ({
          ...acc,
          [day]: {
            start: '09:00',
            end: '17:00',
            is_holiday: day === '日' || day === '祝',
          }
        }), {}),
        online_order: {
          type: '24hours',
          start: '00:00',
          end: '24:00',
        },
        online_sales: WEEKDAYS.reduce((acc, day) => ({
          ...acc,
          [day]: {
            start: '09:00',
            end: '17:00',
            is_holiday: day === '日' || day === '祝',
          }
        }), {}),
      }
    }
  })

  const onSubmit = async (data: BusinessFormValues) => {
    try {
      // 既存の営業時間情報を削除
      const { error: deleteError } = await supabase
        .from('vendor_business_hours')
        .delete()
        .eq('vendor_id', vendorId)

      if (deleteError) throw deleteError

      // 実店舗の営業時間を保存
      const storeHours = data.store_hours.store
      const storeHoursData = WEEKDAYS.map((weekday) => ({
        vendor_id: vendorId,
        type: 'store',
        weekday,
        start_time: storeHours[weekday]?.start || '09:00',
        end_time: storeHours[weekday]?.end || '17:00',
        break_start_time: storeHours[weekday]?.breakStart || null,
        break_end_time: storeHours[weekday]?.breakEnd || null,
        is_holiday: storeHours[weekday]?.is_holiday || false,
      }))

      const { error: storeError } = await supabase
        .from('vendor_business_hours')
        .insert(storeHoursData)

      if (storeError) throw storeError

      // オンライン注文受付時間を保存
      const onlineOrder = data.store_hours.online_order
      const onlineOrderData = {
        vendor_id: vendorId,
        type: 'online_order',
        weekday: '全日',
        start_time: onlineOrder.type === '24hours' ? '00:00' : onlineOrder.start,
        end_time: onlineOrder.type === '24hours' ? '24:00' : onlineOrder.end,
      }

      const { error: onlineOrderError } = await supabase
        .from('vendor_business_hours')
        .insert(onlineOrderData)

      if (onlineOrderError) throw onlineOrderError

      // オンライン販売時間を保存
      const onlineSales = data.store_hours.online_sales
      const onlineSalesData = WEEKDAYS.map((weekday) => ({
        vendor_id: vendorId,
        type: 'online_sales',
        weekday,
        start_time: onlineSales[weekday]?.start || '09:00',
        end_time: onlineSales[weekday]?.end || '17:00',
        is_holiday: onlineSales[weekday]?.is_holiday || false,
      }))

      const { error: onlineSalesError } = await supabase
        .from('vendor_business_hours')
        .insert(onlineSalesData)

      if (onlineSalesError) throw onlineSalesError

      toast.success('営業時間情報を保存しました')
    } catch (error) {
      console.error('Error updating business hours:', error)
      toast.error('営業時間情報の保存に失敗しました')
    }
  }

  const renderTimeFields = (
    prefix: `store_hours.store.${Weekday}` | `store_hours.online_sales.${Weekday}`,
    weekday: Weekday
  ) => (
    <div className="grid grid-cols-2 gap-4 items-center">
      <div className="space-y-4">
        <FormField
          control={form.control}
          name={`${prefix}.start` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>開始時間</FormLabel>
              <FormControl>
                <Input type="time" {...field} disabled={form.watch(`${prefix}.is_holiday`)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${prefix}.end` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>終了時間</FormLabel>
              <FormControl>
                <Input type="time" {...field} disabled={form.watch(`${prefix}.is_holiday`)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {prefix.includes('store') && (
          <>
            <FormField
              control={form.control}
              name={`${prefix}.breakStart` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>休憩開始時間</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} disabled={form.watch(`${prefix}.is_holiday`)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`${prefix}.breakEnd` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>休憩終了時間</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} disabled={form.watch(`${prefix}.is_holiday`)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </div>

      <FormField
        control={form.control}
        name={`${prefix}.is_holiday` as any}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-end space-x-2">
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <Label>定休日</Label>
          </FormItem>
        )}
      />
    </div>
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>実店舗営業時間</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday} className="space-y-2">
                <h4 className="font-medium">{weekday}曜日</h4>
                {renderTimeFields(`store_hours.store.${weekday}`, weekday)}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>オンライン注文受付時間</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="store_hours.online_order.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>受付時間タイプ</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="受付時間タイプを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="24hours">24時間受付</SelectItem>
                      <SelectItem value="business_hours">営業時間内のみ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('store_hours.online_order.type') === 'business_hours' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="store_hours.online_order.start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>開始時間</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="store_hours.online_order.end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>終了時間</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>オンライン販売時間</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday} className="space-y-2">
                <h4 className="font-medium">{weekday}曜日</h4>
                {renderTimeFields(`store_hours.online_sales.${weekday}`, weekday)}
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit">保存</Button>
      </form>
    </Form>
  )
} 