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
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const productSchema = z.object({
  // 基本情報
  name: z.string().min(1, '商品名を入力してください'),
  price: z.string().min(1, '価格を入力してください'),
  category: z.string().min(1, 'カテゴリーを選択してください'),
  description: z.string().optional(),
  image_url: z.string().optional(),
  stock_quantity: z.string().min(1, '在庫数を入力してください'),
  purchase_limit: z.string().optional(),
  status: z.enum(['on_sale', 'hidden', 'reserved']),

  // 医薬品情報
  medicine_type: z.enum(['第1類', '第2類', '第3類', '医薬部外品']),
  ingredients: z.string().min(1, '有効成分と含有量を入力してください').transform(value => ({ content: value })),
  effects: z.string().min(1, '効能・効果を入力してください'),
  usage_instructions: z.string().min(1, '用法・用量を入力してください'),
  precautions: z.string().min(1, '使用上の注意を入力してください'),
  requires_questionnaire: z.boolean(),
  requires_pharmacist_consultation: z.boolean().default(false),

  // 配送・取引情報
  shipping_info: z.object({
    delivery_time: z.string().min(1, '発送時期を入力してください'),
    return_policy: z.string().min(1, '返品・キャンセル条件を入力してください'),
    sale_start_date: z.string().optional(),
    sale_end_date: z.string().optional(),
    shipping_fee: z.string().min(1, '送料を入力してください'),
    can_combine_shipping: z.boolean(),
  }),

  image_file: z.any().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  mode: 'new' | 'edit'
  productId?: string
  onSubmit: (data: ProductFormValues) => Promise<void>
}

const CATEGORY_OPTIONS = [
  { value: 'cold', label: '風邪薬' },
  { value: 'stomach', label: '胃腸薬' },
  { value: 'painkiller', label: '痛み止め' },
  { value: 'sleep_improvement', label: '睡眠改善薬' },
  { value: 'other', label: 'その他' },
] as const

export default function ProductForm({ mode, productId, onSubmit }: ProductFormProps) {
  const router = useRouter()
  const { isAuthenticated, vendorId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const supabase = createClientComponentClient()

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'hidden',
      requires_questionnaire: false,
      shipping_info: {
        can_combine_shipping: true,
      },
    },
  })

  useEffect(() => {
    if (mode === 'edit' && productId) {
      const fetchProduct = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            router.push('/login')
            return
          }

          const { data: staffRole, error: staffError } = await supabase
            .from('vendor_staff_roles')
            .select('vendor_id, role, status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

          if (staffError) throw staffError
          if (!staffRole) {
            router.push('/login')
            return
          }

          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('vendor_id', staffRole.vendor_id)
            .single()

          if (error) throw error
          if (!data) throw new Error('商品が見つかりません')

          // フォームの初期値を設定
          form.reset({
            ...data,
            price: data.price.toString(),
            stock_quantity: data.stock_quantity.toString(),
            purchase_limit: data.purchase_limit?.toString(),
            shipping_info: {
              ...data.shipping_info,
              shipping_fee: data.shipping_info.shipping_fee.toString(),
            },
          })

          if (data.image_url) {
            setImagePreview(data.image_url)
          }
          
          // データの取得に成功したらエラーをクリア
          setError('')
        } catch (err) {
          console.error('Error fetching product:', err)
          setError('商品情報の取得に失敗しました')
          // エラーが発生した場合はルートページに戻る
          router.push('/products')
        }
      }

      fetchProduct()
    }
  }, [mode, productId, router, form, supabase])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImageUploading(true)
      
      // ファイル名をユニークにする
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `product-images/${vendorId}/${fileName}`

      console.log('Uploading file:', { filePath, fileSize: file.size, fileType: file.type })

      // Supabaseストレージにアップロード
      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', data)

      // 画像のURLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      console.log('Public URL:', publicUrl)

      // フォームの値を更新
      form.setValue('image_url', publicUrl)
      
      // プレビュー用のURLを設定
      setImagePreview(URL.createObjectURL(file))

    } catch (err) {
      console.error('Image upload error:', err)
      setError(err.message || '画像のアップロードに失敗しました')
    } finally {
      setImageUploading(false)
    }
  }

  const handleSubmit = async (data: ProductFormValues) => {
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
        <h1 className="text-2xl font-bold">{mode === 'new' ? '商品登録' : '商品編集'}</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList>
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="medicine">医薬品情報</TabsTrigger>
              <TabsTrigger value="shipping">配送・取引情報</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>基本情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>商品名 *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>価格（税込） *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>カテゴリー *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="カテゴリーを選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>商品説明</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>在庫数 *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchase_limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>購入制限数</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          空欄の場合、制限なし
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>販売ステータス *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="ステータスを選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="on_sale">販売中</SelectItem>
                            <SelectItem value="hidden">非表示</SelectItem>
                            <SelectItem value="reserved">予約中</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>商品画像</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <Label
                                htmlFor="image-upload"
                                className="flex h-40 w-40 cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 hover:border-gray-400"
                              >
                                {imageUploading ? (
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                ) : imagePreview ? (
                                  <Image
                                    src={imagePreview}
                                    alt="プレビュー"
                                    width={160}
                                    height={160}
                                    className="rounded-lg object-cover"
                                  />
                                ) : (
                                  <ImagePlus className="h-6 w-6 text-gray-400" />
                                )}
                              </Label>
                              <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={imageUploading}
                              />
                              {imagePreview && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setImagePreview(null)
                                    form.setValue('image_url', '')
                                  }}
                                >
                                  削除
                                </Button>
                              )}
                            </div>
                            <Input
                              type="hidden"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          商品の画像をアップロードしてください（推奨サイズ: 800x800px）
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medicine">
              <Card>
                <CardHeader>
                  <CardTitle>医薬品情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="medicine_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>医薬品区分 *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="区分を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="第1類">第1類医薬品</SelectItem>
                            <SelectItem value="第2類">第2類医薬品</SelectItem>
                            <SelectItem value="第3類">第3類医薬品</SelectItem>
                            <SelectItem value="医薬部外品">医薬部外品</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ingredients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>有効成分と含有量 *</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="effects"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>効能・効果 *</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="usage_instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>用法・用量 *</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="precautions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>使用上の注意 *</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requires_questionnaire"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            問診必須
                          </FormLabel>
                          <FormDescription>
                            購入時に問診を必須にする
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requires_pharmacist_consultation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            薬剤師相談必須
                          </FormLabel>
                          <FormDescription>
                            購入時に薬剤師との相談を必須にする
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shipping">
              <Card>
                <CardHeader>
                  <CardTitle>配送・取引情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="shipping_info.delivery_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>発送時期 *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="例：注文確認後、2-3営業日以内に発送" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shipping_info.return_policy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>返品・キャンセル条件 *</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shipping_info.sale_start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>販売開始日</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shipping_info.sale_end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>販売終了日</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shipping_info.shipping_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>送料 *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shipping_info.can_combine_shipping"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            同梱可能
                          </FormLabel>
                          <FormDescription>
                            他の商品と同梱して配送可能にする
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || imageUploading}>
              {loading ? (mode === 'new' ? '登録中...' : '更新中...') : (mode === 'new' ? '商品を登録' : '更新する')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 