'use client'

import { useFieldArray, useForm } from 'react-hook-form'
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
import { Plus, Trash2 } from 'lucide-react'

const professionalSchema = z.object({
  qualification: z.string().min(1, '資格区分を選択してください'),
  name: z.string().min(1, '氏名を入力してください'),
  license_number: z.string().min(1, '登録番号を入力してください'),
  registration_prefecture: z.string().min(1, '登録先都道府県を入力してください'),
  duties: z.string().min(1, '担当業務を入力してください'),
  work_hours: z.string().min(1, '勤務状況を入力してください'),
  staff_type: z.string().min(1, '勤務する者の区別を選択してください'),
  uniform_info: z.string().min(1, '着用する服装を入力してください'),
})

const professionalsSchema = z.object({
  pharmacist_manager: professionalSchema,
  professionals: z.array(professionalSchema),
})

export type ProfessionalsFormValues = z.infer<typeof professionalsSchema>

const QUALIFICATION_OPTIONS = [
  '薬剤師',
  '登録販売者',
  'その他',
]

const STAFF_TYPE_OPTIONS = [
  '常勤',
  '非常勤',
]

const PREFECTURE_OPTIONS = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

interface ProfessionalsFormProps {
  initialData?: Partial<ProfessionalsFormValues>
  vendorId: string
}

export default function ProfessionalsForm({ initialData, vendorId }: ProfessionalsFormProps) {
  const supabase = createClientComponentClient()
  const form = useForm<ProfessionalsFormValues>({
    resolver: zodResolver(professionalsSchema),
    defaultValues: initialData || {
      pharmacist_manager: {
        qualification: '',
        name: '',
        license_number: '',
        registration_prefecture: '',
        duties: '',
        work_hours: '',
        staff_type: '',
        uniform_info: '',
      },
      professionals: [],
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "professionals"
  })

  const onSubmit = async (data: ProfessionalsFormValues) => {
    try {
      // 既存の専門家情報を削除
      const { error: deleteError } = await supabase
        .from('vendor_professionals')
        .delete()
        .eq('vendor_id', vendorId)

      if (deleteError) throw deleteError

      // 管理者情報を保存
      const managerData = {
        vendor_id: vendorId,
        is_manager: true,
        qualification_type: data.pharmacist_manager.qualification,
        name: data.pharmacist_manager.name,
        registration_number: data.pharmacist_manager.license_number,
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

      // その他の専門家情報を保存
      if (data.professionals.length > 0) {
        const professionalsData = data.professionals.map((prof) => ({
          vendor_id: vendorId,
          is_manager: false,
          qualification_type: prof.qualification,
          name: prof.name,
          registration_number: prof.license_number,
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

      toast.success('専門家情報を保存しました')
    } catch (error) {
      console.error('Error updating professionals info:', error)
      toast.error('専門家情報の保存に失敗しました')
    }
  }

  const renderProfessionalFields = (
    prefix: 'pharmacist_manager' | `professionals.${number}`,
    index?: number
  ) => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`${prefix}.qualification` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>資格区分 *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="資格区分を選択" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {QUALIFICATION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.name` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>氏名 *</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.license_number` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>登録番号 *</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.registration_prefecture` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>登録先都道府県 *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="都道府県を選択" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PREFECTURE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.duties` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>担当業務 *</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.work_hours` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>勤務状況 *</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.staff_type` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>勤務する者の区別 *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="勤務区分を選択" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {STAFF_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.uniform_info` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>着用する服装 *</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {typeof index === 'number' && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => remove(index)}
          className="mt-2"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          削除
        </Button>
      )}
    </div>
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>管理薬剤師</CardTitle>
          </CardHeader>
          <CardContent>
            {renderProfessionalFields('pharmacist_manager')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>その他の専門家</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader>
                  <CardTitle>専門家 {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderProfessionalFields(`professionals.${index}`, index)}
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({
                qualification: '',
                name: '',
                license_number: '',
                registration_prefecture: '',
                duties: '',
                work_hours: '',
                staff_type: '',
                uniform_info: '',
              })}
            >
              <Plus className="w-4 h-4 mr-2" />
              専門家を追加
            </Button>
          </CardContent>
        </Card>

        <Button type="submit">保存</Button>
      </form>
    </Form>
  )
} 