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

const pharmacySchema = z.object({
  vendor_name: z.string().min(1, '薬局名を入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  phone: z.string().min(1, '電話番号を入力してください'),
  postal_code: z.string().min(1, '郵便番号を入力してください'),
  prefecture: z.string().min(1, '都道府県を選択してください'),
  city: z.string().min(1, '市区町村を入力してください'),
  address_line1: z.string().min(1, '住所を入力してください'),
  address_line2: z.string().optional(),
  business_hours: z.object({
    weekday: z.object({
      start: z.string(),
      end: z.string(),
    }),
    saturday: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    sunday: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    holiday: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
  }),
  consultation_hours: z.object({
    weekday: z.object({
      start: z.string(),
      end: z.string(),
    }),
    saturday: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    sunday: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    holiday: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
  }),
  license_number: z.string().min(1, '薬局開設許可番号を入力してください'),
  owner_name: z.string().min(1, '開設者名を入力してください'),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
})

type PharmacyFormValues = z.infer<typeof pharmacySchema>

interface PharmacyFormProps {
  mode: 'new' | 'edit'
  onSubmit: (data: PharmacyFormValues) => Promise<void>
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

export default function PharmacyForm({ mode, onSubmit }: PharmacyFormProps) {
  const router = useRouter()
  const { isAuthenticated, vendorId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const supabase = createClientComponentClient()

  const form = useForm<PharmacyFormValues>({
    resolver: zodResolver(pharmacySchema),
    defaultValues: {
      business_hours: {
        weekday: { start: '09:00', end: '18:00' },
      },
      consultation_hours: {
        weekday: { start: '09:00', end: '18:00' },
      },
    },
  })

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
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `pharmacy-images/${vendorId}/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('pharmacy-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('pharmacy-images')
        .getPublicUrl(filePath)

      setImageUrls(prev => [...prev, publicUrl])
      form.setValue('images', [...imageUrls, publicUrl])

    } catch (err) {
      console.error('Image upload error:', err)
      setError((err as Error).message || '画像のアップロードに失敗しました')
    } finally {
      setImageUploading(false)
    }
  }

  const handleSubmit = async (data: PharmacyFormValues) => {
    setLoading(true)
    setError('')

    try {
      await onSubmit(data)
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
        <h1 className="text-2xl font-bold">{mode === 'new' ? '薬局情報登録' : '薬局情報編集'}</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>郵便番号 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例：123-4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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
                          {PREFECTURE_OPTIONS.map(pref => (
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
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="license_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>薬局開設許可番号 *</FormLabel>
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
              </div>

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

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>店舗画像</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                          {imageUrls.map((url, index) => (
                            <div key={url} className="relative">
                              <Image
                                src={url}
                                alt={`店舗画像 ${index + 1}`}
                                width={160}
                                height={160}
                                className="rounded-lg object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  const newUrls = imageUrls.filter(u => u !== url)
                                  setImageUrls(newUrls)
                                  form.setValue('images', newUrls)
                                }}
                              >
                                削除
                              </Button>
                            </div>
                          ))}
                          <Label
                            htmlFor="image-upload"
                            className="flex h-40 w-40 cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 hover:border-gray-400"
                          >
                            {imageUploading ? (
                              <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                              <ImagePlus className="h-6 w-6 text-gray-400" />
                            )}
                          </Label>
                        </div>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={imageUploading}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      店舗の外観や内装の画像をアップロードしてください
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>営業時間</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">平日</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="business_hours.weekday.start"
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
                      name="business_hours.weekday.end"
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
                </div>

                <div>
                  <h3 className="font-semibold mb-2">土曜日</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="business_hours.saturday.start"
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
                      name="business_hours.saturday.end"
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
                </div>

                <div>
                  <h3 className="font-semibold mb-2">日曜日</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="business_hours.sunday.start"
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
                      name="business_hours.sunday.end"
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
                </div>

                <div>
                  <h3 className="font-semibold mb-2">祝日</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="business_hours.holiday.start"
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
                      name="business_hours.holiday.end"
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
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>相談受付時間</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">平日</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="consultation_hours.weekday.start"
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
                      name="consultation_hours.weekday.end"
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
                </div>

                <div>
                  <h3 className="font-semibold mb-2">土曜日</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="consultation_hours.saturday.start"
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
                      name="consultation_hours.saturday.end"
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
                </div>

                <div>
                  <h3 className="font-semibold mb-2">日曜日</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="consultation_hours.sunday.start"
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
                      name="consultation_hours.sunday.end"
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
                </div>

                <div>
                  <h3 className="font-semibold mb-2">祝日</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="consultation_hours.holiday.start"
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
                      name="consultation_hours.holiday.end"
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
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || imageUploading}>
              {loading ? (mode === 'new' ? '登録中...' : '更新中...') : (mode === 'new' ? '薬局を登録' : '更新する')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 