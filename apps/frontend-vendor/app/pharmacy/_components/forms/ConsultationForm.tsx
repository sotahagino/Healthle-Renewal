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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const consultationSchema = z.object({
  consultation_info: z.object({
    normal: z.object({
      phone: z.string().min(1, '電話番号を入力してください'),
      email: z.string().email('有効なメールアドレスを入力してください'),
      hours: z.string().min(1, '相談応需時間を入力してください'),
    }),
    emergency: z.object({
      phone: z.string().min(1, '緊急時電話番号を入力してください'),
      email: z.string().email('有効なメールアドレスを入力してください'),
      hours: z.string().min(1, '営業時間外の相談応需時間を入力してください'),
    }),
  }),
})

export type ConsultationFormValues = z.infer<typeof consultationSchema>

interface ConsultationFormProps {
  initialData?: Partial<ConsultationFormValues>
  vendorId: string
}

export default function ConsultationForm({ initialData, vendorId }: ConsultationFormProps) {
  const supabase = createClientComponentClient()
  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationSchema),
    defaultValues: initialData || {
      consultation_info: {
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
      }
    }
  })

  const onSubmit = async (data: ConsultationFormValues) => {
    try {
      const { error: deleteError } = await supabase
        .from('vendor_emergency_contacts')
        .delete()
        .eq('vendor_id', vendorId)

      if (deleteError) throw deleteError

      const normalData = {
        vendor_id: vendorId,
        type: 'normal',
        phone: data.consultation_info.normal.phone,
        email: data.consultation_info.normal.email,
        available_hours: { hours: data.consultation_info.normal.hours },
      }

      const { error: normalError } = await supabase
        .from('vendor_emergency_contacts')
        .insert(normalData)

      if (normalError) throw normalError

      const emergencyData = {
        vendor_id: vendorId,
        type: 'emergency',
        phone: data.consultation_info.emergency.phone,
        email: data.consultation_info.emergency.email,
        available_hours: { hours: data.consultation_info.emergency.hours },
      }

      const { error: emergencyError } = await supabase
        .from('vendor_emergency_contacts')
        .insert(emergencyData)

      if (emergencyError) throw emergencyError

      toast.success('相談応需情報を保存しました')
    } catch (error) {
      console.error('Error updating consultation info:', error)
      toast.error('相談応需情報の保存に失敗しました')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>通常時の相談応需</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="consultation_info.normal.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>電話番号 *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consultation_info.normal.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consultation_info.normal.hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>相談応需時間 *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>緊急時の相談応需</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="consultation_info.emergency.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>緊急時電話番号 *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consultation_info.emergency.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>緊急時メールアドレス *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consultation_info.emergency.hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>営業時間外の相談応需時間 *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit">保存</Button>
      </form>
    </Form>
  )
} 