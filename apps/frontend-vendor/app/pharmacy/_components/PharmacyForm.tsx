'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Label } from '@/components/ui/label'
import { ImagePlus, Loader2, ArrowLeft } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// 基本情報のスキーマ
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

// 許可情報のスキーマ
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
})

// 専門家情報のスキーマ
const professionalsSchema = z.object({
  pharmacist_manager: z.object({
    qualification: z.string().min(1, '資格区分を選択してください'),
    name: z.string().min(1, '氏名を入力してください'),
    license_number: z.string().min(1, '登録番号を入力してください'),
    registration_prefecture: z.string().min(1, '登録先都道府県を入力してください'),
    duties: z.string().min(1, '従事する業務を入力してください'),
    work_hours: z.string().min(1, '勤務状況を入力してください'),
    staff_type: z.string().min(1, '勤務する者の区別を選択してください'),
    uniform_info: z.string().min(1, '着用する服装を入力してください'),
  }),
  professionals: z.array(z.object({
    qualification: z.string().min(1, '資格区分を選択してください'),
    name: z.string().min(1, '氏名を入力してください'),
    license_number: z.string().min(1, '登録番号を入力してください'),
    registration_prefecture: z.string().min(1, '登録先都道府県を入力してください'),
    duties: z.string().min(1, '担当業務を入力してください'),
    work_hours: z.string().min(1, '勤務状況を入力してください'),
    staff_type: z.string().min(1, '勤務する者の区別を選択してください'),
    uniform_info: z.string().min(1, '着用する服装を入力してください'),
  })),
})

// 営業情報のスキーマ
const businessSchema = z.object({
  store_hours: z.object({
    online_order: z.string().min(1, 'インターネットでの注文受付時間を入力してください'),
    store: z.string().min(1, '実店舗の営業時間を入力してください'),
    online_sales: z.string().min(1, 'インターネット販売の医薬品販売時間を入力してください'),
  }),
  online_notification: z.object({
    notification_date: z.string().min(1, '届出年月日を入力してください'),
    notification_office: z.string().min(1, '届出先を入力してください'),
  }),
})

// 相談応需情報のスキーマ
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

// 全体のスキーマを定義
const pharmacySchema = z.object({
  // 基本情報
  ...basicInfoSchema.shape,
  // 許可情報
  ...licenseSchema.shape,
  // 専門家情報
  ...professionalsSchema.shape,
  // 営業情報
  ...businessSchema.shape,
  // 相談応需情報
  ...consultationSchema.shape,
})

type PharmacyFormValues = z.infer<typeof pharmacySchema>
export type { PharmacyFormValues }

interface PharmacyFormProps {
  mode: 'new' | 'edit'
  onSubmit: (data: Partial<PharmacyFormValues>) => Promise<void>
  initialData?: Partial<PharmacyFormValues>
}

const PREFECTURE_OPTIONS = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

export default function PharmacyForm({ mode, onSubmit, initialData }: PharmacyFormProps) {
  const router = useRouter()
  const { isAuthenticated, vendorId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const supabase = createClientComponentClient()
  const [activeTab, setActiveTab] = useState('basic')

  const form = useForm<PharmacyFormValues>({
    resolver: async (data, context, options) => {
      // 現在のタブのスキーマのみでバリデーション
      const currentSchema = getSchemaForTab(activeTab)
      return zodResolver(currentSchema)(data, context, options)
    },
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
      pharmacy_license: {
        type: '',
        number: '',
        issue_date: '',
        expiration_date: '',
        holder_name: '',
        issuer: '',
      },
      handling_categories: [],
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
      store_hours: {
        online_order: '24時間365日',
        store: '平日 9:00～18:00',
        online_sales: '平日 9:00～18:00',
      },
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
      },
      online_notification: {
        notification_date: '',
        notification_office: '',
      },
    },
  })

  // 初期データが変更された場合にフォームをリセット
  useEffect(() => {
    if (initialData) {
      form.reset(initialData)
    }
  }, [initialData, form])

  useEffect(() => {
    if (mode === 'edit' && vendorId) {
      const fetchPharmacy = async () => {
        try {
          const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', vendorId)
            .single()

          if (error) throw error
          if (!data) throw new Error('薬局情報が見つかりません')

          form.reset(data)
          if (data.images) {
            setImageUrls(data.images)
          }
        } catch (err) {
          console.error('Error fetching pharmacy:', err)
          setError('薬局情報の取得に失敗しました')
        }
      }

      fetchPharmacy()
    }
  }, [mode, vendorId, form, supabase])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImageUploading(true)
      setError('')
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${vendorId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('pharmacy-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('画像のアップロードに失敗しました。')
      }

      const { data: { publicUrl } } = supabase.storage
        .from('pharmacy-images')
        .getPublicUrl(filePath)

      const newUrls = [...imageUrls, publicUrl]
      setImageUrls(newUrls)
      form.setValue('images', newUrls)

    } catch (err) {
      console.error('Image upload error:', err)
      setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました')
    } finally {
      setImageUploading(false)
    }
  }

  const getSchemaForTab = (tab: string) => {
    switch (tab) {
      case 'basic':
        return basicInfoSchema
      case 'license':
        return licenseSchema
      case 'professionals':
        return professionalsSchema
      case 'business':
        return businessSchema
      case 'consultation':
        return consultationSchema
      default:
        return basicInfoSchema
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const handleSubmit = async (data: PharmacyFormValues) => {
    setLoading(true)
    setError('')

    try {
      // 現在のタブのデータのみを抽出
      const currentSchema = getSchemaForTab(activeTab)
      const relevantData = Object.keys(currentSchema.shape).reduce((acc, key) => {
        return { ...acc, [key]: data[key as keyof typeof data] }
      }, {} as Partial<PharmacyFormValues>)

      await onSubmit(relevantData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">{mode === 'new' ? '店舗情報登録' : '店舗情報編集'}</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Tabs defaultValue="basic" className="space-y-4" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="license">許可情報</TabsTrigger>
              <TabsTrigger value="professionals">専門家情報</TabsTrigger>
              <TabsTrigger value="business">営業情報</TabsTrigger>
              <TabsTrigger value="consultation">相談応需</TabsTrigger>
            </TabsList>

            {/* 基本情報タブ */}
            <TabsContent value="basic" className="space-y-4">
              {/* 基本情報カード */}
              <Card>
                <CardHeader>
                  <CardTitle>基本情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>メールアドレス *</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
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
                            <Input {...field} placeholder="例: 03-1234-5678" />
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
                          <FormLabel>FAX番号</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value || '')}
                              placeholder="例: 03-1234-5678" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 所在地情報カード */}
              <Card>
                <CardHeader>
                  <CardTitle>所在地情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>郵便番号 *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="例: 123-4567" />
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
                              {PREFECTURE_OPTIONS.map((pref) => (
                                <SelectItem key={pref} value={pref}>
                                  {pref}
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
                  </div>
                </CardContent>
              </Card>

              {/* 責任者情報カード */}
              <Card>
                <CardHeader>
                  <CardTitle>責任者情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                </CardContent>
              </Card>

              {/* 店舗画像カード */}
              <Card>
                <CardHeader>
                  <CardTitle>店舗画像</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={url}
                            alt={`店舗画像 ${index + 1}`}
                            width={200}
                            height={200}
                            className="object-cover rounded"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              const newUrls = imageUrls.filter((_, i) => i !== index)
                              setImageUrls(newUrls)
                              form.setValue('images', newUrls)
                            }}
                          >
                            削除
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4">
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex items-center space-x-2 text-primary">
                          <ImagePlus className="h-6 w-6" />
                          <span>画像を追加</span>
                        </div>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={imageUploading}
                        />
                      </Label>
                      {imageUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 許可情報タブ */}
            <TabsContent value="license" className="space-y-4">
              {/* 医薬品販売許可情報カード */}
              <Card>
                <CardHeader>
                  <CardTitle>医薬品販売許可情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pharmacy_license.type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>許可区分 *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="例: 店舗販売業" />
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
                            <Input {...field} placeholder="例: 4豊池衛医許第1601号" />
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
                            <Input type="date" {...field} />
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
                            <Input type="date" {...field} />
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
                            <Input {...field} placeholder="例: 豊島区" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 取扱医薬品区分カード */}
              <Card>
                <CardHeader>
                  <CardTitle>取扱医薬品区分</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="handling_categories"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-4">
                          {['第1類医薬品', '指定第2類医薬品', '第2類医薬品', '第3類医薬品'].map((category) => (
                            <div key={category} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={field.value?.includes(category)}
                                onChange={(e) => {
                                  const updatedValue = e.target.checked
                                    ? [...(field.value || []), category]
                                    : (field.value || []).filter((val: string) => val !== category)
                                  field.onChange(updatedValue)
                                }}
                              />
                              <label>{category}</label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* 専門家情報タブ */}
            <TabsContent value="professionals">
              <Card>
                <CardHeader>
                  <CardTitle>店舗の管理者情報</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="pharmacist_manager.qualification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>資格区分</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="資格を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="薬剤師">薬剤師</SelectItem>
                              <SelectItem value="登録販売者">登録販売者</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pharmacist_manager.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>氏名</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="山田 太郎" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pharmacist_manager.license_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>免許番号</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="第123456号" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pharmacist_manager.registration_prefecture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>登録都道府県</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="東京都" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pharmacist_manager.duties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>従事する業務</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="医薬品の販売・情報提供" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pharmacist_manager.work_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>勤務時間</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="平日 9:00-18:00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pharmacist_manager.staff_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>勤務する者の区別</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="区別を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="薬剤師">薬剤師</SelectItem>
                              <SelectItem value="登録販売者">登録販売者</SelectItem>
                              <SelectItem value="登録販売者(研修中)">登録販売者(研修中)</SelectItem>
                              <SelectItem value="一般従事者">一般従事者</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pharmacist_manager.uniform_info"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>着用する服装</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="例: 「薬剤師」と氏名を記した名札と、コート型の白衣(白)を着用" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>医薬品販売に従事する専門家の情報</CardTitle>
                </CardHeader>
                <CardContent>
                  {form.watch('professionals')?.map((professional: any, index: number) => (
                    <div key={index} className="mb-6 grid gap-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">専門家 {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.getValues('professionals')
                            form.setValue('professionals', 
                              current.filter((_: any, i: number) => i !== index)
                            )
                          }}
                        >
                          削除
                        </Button>
                      </div>
                      <FormField
                        control={form.control}
                        name={`professionals.${index}.qualification`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>資格区分</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="薬剤師" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`professionals.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>氏名</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="山田 花子" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`professionals.${index}.license_number`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>免許番号</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="第123456号" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`professionals.${index}.registration_prefecture`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>登録都道府県</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="東京都" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`professionals.${index}.duties`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>従事する業務</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="医薬品の販売・情報提供" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`professionals.${index}.work_hours`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>勤務時間</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="平日 9:00-18:00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`professionals.${index}.staff_type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>勤務する者の区別</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="区別を選択" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="薬剤師">薬剤師</SelectItem>
                                <SelectItem value="登録販売者">登録販売者</SelectItem>
                                <SelectItem value="登録販売者(研修中)">登録販売者(研修中)</SelectItem>
                                <SelectItem value="一般従事者">一般従事者</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`professionals.${index}.uniform_info`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>着用する服装</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="例: 「登録販売者」と氏名を記した名札と、短丈の白衣(白･ﾌﾞﾙｰ･ﾋﾟﾝｸ)を着用" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const current = form.getValues('professionals') || []
                      form.setValue('professionals', [
                        ...current,
                        {
                          qualification: '',
                          name: '',
                          license_number: '',
                          registration_prefecture: '',
                          duties: '',
                          work_hours: '',
                          staff_type: '',
                          uniform_info: '',
                        },
                      ])
                    }}
                  >
                    専門家を追加
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 営業情報タブ */}
            <TabsContent value="business" className="space-y-4">
              {/* 営業時間カード */}
              <Card>
                <CardHeader>
                  <CardTitle>医薬品販売店舗の営業時間</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="store_hours.online_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>インターネットでの注文受付時間 *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="例: 注文は24時間365日承っています" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="store_hours.store"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>実店舗の営業時間 *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="例: 平日：9:00～13:00・15:00～17:00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="store_hours.online_sales"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>インターネット販売の医薬品販売時間 *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="例: 平日：9:00～13:00・15:00～17:00" />
                        </FormControl>
                        <FormDescription>
                          薬剤師または登録販売者が常駐している時間
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 特定販売（インターネット販売）届出情報カード */}
              <Card>
                <CardHeader>
                  <CardTitle>特定販売（インターネット販売）届出情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="online_notification.notification_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>届出年月日 *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <FormLabel>届出先 *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="例: 豊島区池袋保健所 生活衛生課医務・薬事グループ" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* 相談応需タブ */}
            <TabsContent value="consultation" className="space-y-4">
              {/* 相談応需時間・連絡先カード */}
              <Card>
                <CardHeader>
                  <CardTitle>専門家が相談応需を受ける時間および連絡先</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">通常時</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="consultation_info.normal.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>電話番号 *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="例: 03-6822-3723" />
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
                              <Input type="email" {...field} />
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
                              <Input {...field} placeholder="例: 平日 9:00～13:00・15:00～17:00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">緊急時</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="consultation_info.emergency.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>電話番号 *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="例: 080-7825-2323" />
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
                            <FormLabel>メールアドレス *</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
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
                              <Input {...field} placeholder="例: メール：24時間受付（お問い合わせのご返信は営業時間内にさせて頂きます）" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                `${activeTab === 'basic' ? '基本情報' : 
                  activeTab === 'license' ? '許可情報' :
                  activeTab === 'professionals' ? '専門家情報' :
                  activeTab === 'business' ? '営業情報' :
                  '相談応需情報'}を保存`
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 