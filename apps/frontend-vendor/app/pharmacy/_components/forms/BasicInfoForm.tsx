'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

const basicInfoSchema = z.object({
  vendor_name: z.string().min(1, '薬局名を入力してください'),
  company_name: z.string().min(1, '会社名を入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  phone: z.string().min(1, '電話番号を入力してください')
    .regex(/^[0-9-]{10,}$/, '有効な電話番号を入力してください'),
  fax: z.string().regex(/^[0-9-]{10,}$/, '有効なFAX番号を入力してください').optional().nullable(),
  postal_code: z.string().min(1, '郵便番号を入力してください')
    .regex(/^\d{3}-?\d{4}$/, '有効な郵便番号を入力してください'),
  prefecture: z.string().min(1, '都道府県を選択してください'),
  city: z.string().min(1, '市区町村を入力してください'),
  address_line1: z.string().min(1, '住所を入力してください'),
  address_line2: z.string().optional(),
  owner_name: z.string().min(1, '開設者名を入力してください'),
  store_manager: z.string().min(1, '店舗運営責任者を入力してください'),
  security_manager: z.string().min(1, 'セキュリティ責任者を入力してください'),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
})

export type BasicInfoFormValues = z.infer<typeof basicInfoSchema>

const PREFECTURE_OPTIONS = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

interface BasicInfoFormProps {
  initialData?: Partial<BasicInfoFormValues>
  vendorId: string
}

export default function BasicInfoForm({ initialData, vendorId }: BasicInfoFormProps) {
  const supabase = createClientComponentClient()
  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: initialData || {
      vendor_name: '',
      company_name: '',
      email: '',
      phone: '',
      fax: '',
      postal_code: '',
      prefecture: '',
      city: '',
      address_line1: '',
      address_line2: '',
      owner_name: '',
      store_manager: '',
      security_manager: '',
      description: '',
      images: [],
    }
  })

  const onSubmit = async (data: BasicInfoFormValues) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          vendor_name: data.vendor_name,
          company_name: data.company_name,
          email: data.email,
          phone: data.phone,
          fax: data.fax,
          postal_code: data.postal_code,
          prefecture: data.prefecture,
          city: data.city,
          address_line1: data.address_line1,
          address_line2: data.address_line2,
          owner_name: data.owner_name,
          store_manager: data.store_manager,
          security_manager: data.security_manager,
          description: data.description,
          images: data.images,
        })
        .eq('id', vendorId)

      if (error) throw error
      toast.success('基本情報を保存しました')
    } catch (error) {
      console.error('Error updating basic info:', error)
      toast.error('基本情報の保存に失敗しました')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="vendor_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>薬局名 *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>会社名 *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
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
          name="phone"
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
          name="fax"
          render={({ field }) => (
            <FormItem>
              <FormLabel>FAX</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="postal_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>郵便番号 *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="123-4567" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prefecture"
          render={({ field }) => (
            <FormItem>
              <FormLabel>都道府県 *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="都道府県を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PREFECTURE_OPTIONS.map((prefecture) => (
                    <SelectItem key={prefecture} value={prefecture}>
                      {prefecture}
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
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>市区町村 *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address_line1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>住所1 *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address_line2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>住所2</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="owner_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>開設者名 *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="store_manager"
          render={({ field }) => (
            <FormItem>
              <FormLabel>店舗運営責任者 *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="security_manager"
          render={({ field }) => (
            <FormItem>
              <FormLabel>セキュリティ責任者 *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>店舗説明</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">保存</Button>
      </form>
    </Form>
  )
} 