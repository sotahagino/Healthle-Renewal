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
import { ImagePlus, Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react'
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
import QuestionnaireForm from './QuestionnaireForm'
import { Checkbox } from '@/components/ui/checkbox'

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
  manufacturer: z.string().min(1, 'メーカー名/製造元を入力してください'),
  manufacturing_country: z.string().min(1, '製造国を入力してください'),
  expiration_date_info: z.string().min(1, '使用期限/有効期限の情報を入力してください'),
  storage_conditions: z.string().min(1, '保管方法を入力してください'),
  ingredients: z.string().min(1, '有効成分と含有量を入力してください'),
  additives: z.array(z.object({
    name: z.string(),
    amount: z.string().optional(),
  })).optional(),
  drug_interactions: z.array(z.object({
    drug_name: z.string(),
    severity: z.enum(['high', 'medium', 'low']),
    description: z.string(),
  })).optional(),
  side_effects: z.array(z.object({
    name: z.string(),
    severity: z.enum(['serious', 'common', 'rare']),
    description: z.string(),
  })).optional(),
  effects: z.string().min(1, '効能・効果を入力してください'),
  usage_instructions: z.string().min(1, '用法・用量を入力してください'),
  precautions: z.string().min(1, '使用上の注意を入力してください'),
  requires_questionnaire: z.boolean(),
  requires_pharmacist_consultation: z.boolean().default(false),
  out_of_stock_policy: z.string().min(1, '在庫切れ時の対応方針を入力してください'),

  // 配送・取引情報
  shipping_info: z.object({
    shipping_fee: z.string().min(1, '送料を入力してください'),
    free_shipping_threshold: z.string().optional(),
    shipping_methods: z.array(z.string()),
    estimated_delivery: z.string(),
    return_policy: z.string().min(1, '返品・キャンセル条件を入力してください'),
    can_combine_shipping: z.boolean(),
    custom_options: z.array(z.object({
      value: z.string(),
      label: z.string()
    })).optional(),
    selected_options: z.array(z.object({
      value: z.string(),
      label: z.string()
    })).optional(),
    selected_method_ids: z.array(z.string()).optional(),
    sale_start_date: z.string().optional(),
    sale_end_date: z.string().optional(),
  }),

  image_file: z.any().optional(),

  questionnaire: z.object({
    title: z.string(),
    description: z.string().optional(),
    items: z.array(z.object({
      question: z.string(),
      question_type: z.enum(['text', 'radio', 'checkbox', 'select']),
      required: z.boolean(),
      options: z.array(z.object({
        value: z.string()
      })).optional(),
      order_index: z.number(),
    })),
  }).optional(),
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

const DEFAULT_SHIPPING_OPTIONS = [
  { value: 'same_day', label: '当日発送' },
  { value: 'next_day', label: '翌日発送' },
  { value: '2_3_days', label: '2-3営業日以内に発送' },
  { value: 'within_week', label: '1週間以内に発送' },
] as const

const DEFAULT_SHIPPING_METHODS = [
  { id: 'yamato', name: 'クロネコヤマト', description: 'ヤマト運輸による配送' },
  { id: 'sagawa', name: '佐川急便', description: '佐川急便による配送' },
  { id: 'japan_post', name: '日本郵便', description: '日本郵便による配送' },
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

      // Supabaseストレージにアップロード
      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // 画像のURLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      // フォームの値を更新
      form.setValue('image_url', publicUrl)
      
      // プレビュー用のURLを設定
      setImagePreview(URL.createObjectURL(file))

    } catch (error: unknown) {
      console.error('Image upload error:', error)
      setError(error instanceof Error ? error.message : '画像のアップロードに失敗しました')
    } finally {
      setImageUploading(false)
    }
  }

  const [customShippingOptions, setCustomShippingOptions] = useState<Array<{ value: string; label: string }>>(
    form.watch('shipping_info')?.custom_options || []
  )
  const [selectedShippingOptions, setSelectedShippingOptions] = useState<Array<{ value: string; label: string }>>(
    form.watch('shipping_info')?.selected_options || []
  )

  const addCustomShippingOption = () => {
    const newOption = {
      value: `custom_${Date.now()}`,
      label: '',
    }
    setCustomShippingOptions([...customShippingOptions, newOption])
  }

  const removeCustomShippingOption = (index: number) => {
    const newOptions = [...customShippingOptions]
    newOptions.splice(index, 1)
    setCustomShippingOptions(newOptions)
  }

  const updateCustomShippingOption = (index: number, label: string) => {
    const newOptions = [...customShippingOptions]
    newOptions[index].label = label
    setCustomShippingOptions(newOptions)
  }

  const [selectedShippingMethods, setSelectedShippingMethods] = useState<string[]>(
    form.watch('shipping_info')?.selected_method_ids || []
  )

  const handleSubmit = async (data: ProductFormValues) => {
    try {
      const formData = {
        ...data,
        shipping_info: {
          ...data.shipping_info,
          selected_options: selectedShippingOptions,
          custom_options: customShippingOptions,
          selected_method_ids: selectedShippingMethods,
        },
      } as ProductFormValues
      
      setLoading(true)
      await onSubmit(formData)
    } catch (error: unknown) {
      console.error('Error submitting product:', error)
      setError(error instanceof Error ? error.message : '商品の登録に失敗しました')
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="medical">医薬品情報</TabsTrigger>
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

            <TabsContent value="medical">
              <Card>
                <CardHeader>
                  <CardTitle>医薬品情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>メーカー名/製造元 *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="例：〇〇製薬株式会社" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manufacturing_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>製造国 *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="例：日本" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiration_date_info"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>使用期限/有効期限の情報 *</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="例：製造後3年間" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storage_conditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>保管方法 *</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="例：直射日光を避け、涼しい所に保管してください（1～30℃）" />
                        </FormControl>
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
                          <Textarea {...field} placeholder="例：アセトアミノフェン 300mg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additives"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>添加物</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {(field.value || []).map((additive, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={additive.name}
                                  onChange={(e) => {
                                    const newAdditives = [...(field.value || [])]
                                    newAdditives[index] = {
                                      ...newAdditives[index],
                                      name: e.target.value
                                    }
                                    field.onChange(newAdditives)
                                  }}
                                  placeholder="添加物名"
                                />
                                <Input
                                  value={additive.amount}
                                  onChange={(e) => {
                                    const newAdditives = [...(field.value || [])]
                                    newAdditives[index] = {
                                      ...newAdditives[index],
                                      amount: e.target.value
                                    }
                                    field.onChange(newAdditives)
                                  }}
                                  placeholder="含有量（任意）"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => {
                                    const newAdditives = (field.value || []).filter((_, i) => i !== index)
                                    field.onChange(newAdditives)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const newAdditives = [...(field.value || [])]
                                newAdditives.push({ name: '', amount: '' })
                                field.onChange(newAdditives)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              添加物を追加
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="drug_interactions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>相互作用</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {(field.value || []).map((interaction, index) => (
                              <div key={index} className="space-y-2 border p-4 rounded-lg">
                                <Input
                                  value={interaction.drug_name}
                                  onChange={(e) => {
                                    const newInteractions = [...(field.value || [])]
                                    newInteractions[index] = {
                                      ...newInteractions[index],
                                      drug_name: e.target.value
                                    }
                                    field.onChange(newInteractions)
                                  }}
                                  placeholder="薬剤名"
                                />
                                <Select
                                  value={interaction.severity}
                                  onValueChange={(value: 'high' | 'medium' | 'low') => {
                                    const newInteractions = [...(field.value || [])]
                                    newInteractions[index] = {
                                      ...newInteractions[index],
                                      severity: value
                                    }
                                    field.onChange(newInteractions)
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="重要度" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="high">高（併用禁忌）</SelectItem>
                                    <SelectItem value="medium">中（併用注意）</SelectItem>
                                    <SelectItem value="low">低（注意）</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Textarea
                                  value={interaction.description}
                                  onChange={(e) => {
                                    const newInteractions = [...(field.value || [])]
                                    newInteractions[index] = {
                                      ...newInteractions[index],
                                      description: e.target.value
                                    }
                                    field.onChange(newInteractions)
                                  }}
                                  placeholder="相互作用の詳細"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => {
                                    const newInteractions = (field.value || []).filter((_, i) => i !== index)
                                    field.onChange(newInteractions)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  削除
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const newInteractions = [...(field.value || [])]
                                newInteractions.push({
                                  drug_name: '',
                                  severity: 'medium',
                                  description: ''
                                })
                                field.onChange(newInteractions)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              相互作用を追加
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="side_effects"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>副作用</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {(field.value || []).map((sideEffect, index) => (
                              <div key={index} className="space-y-2 border p-4 rounded-lg">
                                <Input
                                  value={sideEffect.name}
                                  onChange={(e) => {
                                    const newSideEffects = [...(field.value || [])]
                                    newSideEffects[index] = {
                                      ...newSideEffects[index],
                                      name: e.target.value
                                    }
                                    field.onChange(newSideEffects)
                                  }}
                                  placeholder="副作用名"
                                />
                                <Select
                                  value={sideEffect.severity}
                                  onValueChange={(value: 'serious' | 'common' | 'rare') => {
                                    const newSideEffects = [...(field.value || [])]
                                    newSideEffects[index] = {
                                      ...newSideEffects[index],
                                      severity: value
                                    }
                                    field.onChange(newSideEffects)
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="重症度" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="serious">重大</SelectItem>
                                    <SelectItem value="common">一般的</SelectItem>
                                    <SelectItem value="rare">まれ</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Textarea
                                  value={sideEffect.description}
                                  onChange={(e) => {
                                    const newSideEffects = [...(field.value || [])]
                                    newSideEffects[index] = {
                                      ...newSideEffects[index],
                                      description: e.target.value
                                    }
                                    field.onChange(newSideEffects)
                                  }}
                                  placeholder="副作用の詳細"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => {
                                    const newSideEffects = (field.value || []).filter((_, i) => i !== index)
                                    field.onChange(newSideEffects)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  削除
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const newSideEffects = [...(field.value || [])]
                                newSideEffects.push({
                                  name: '',
                                  severity: 'common',
                                  description: ''
                                })
                                field.onChange(newSideEffects)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              副作用を追加
                            </Button>
                          </div>
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
                    name="out_of_stock_policy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>在庫切れ時の対応方針 *</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="例：在庫切れの場合、入荷まで約1週間かかります。" />
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
                            購入時に問診票の入力を必須にする
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

                  {form.watch('requires_questionnaire') && (
                    <div className="border rounded-lg p-4 mt-4">
                      <h3 className="text-lg font-semibold mb-4">問診票設定</h3>
                      <QuestionnaireForm
                        onSubmit={async (data) => {
                          form.setValue('questionnaire', data)
                        }}
                        defaultValues={form.watch('questionnaire')}
                      />
                    </div>
                  )}

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

                  <Card>
                    <CardHeader>
                      <CardTitle>発送情報</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <FormLabel>発送時期 *</FormLabel>
                        <div className="space-y-2">
                          {DEFAULT_SHIPPING_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedShippingOptions.some(selected => selected.value === option.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedShippingOptions([...selectedShippingOptions, { value: option.value, label: option.label }])
                                  } else {
                                    setSelectedShippingOptions(
                                      selectedShippingOptions.filter((selected) => selected.value !== option.value)
                                    )
                                  }
                                }}
                              />
                              <label>{option.label}</label>
                            </div>
                          ))}
                        </div>

                        {customShippingOptions.length > 0 && (
                          <div className="space-y-2 mt-4">
                            <FormLabel>カスタム発送時期</FormLabel>
                            {customShippingOptions.map((option, index) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={selectedShippingOptions.some(selected => selected.value === option.value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedShippingOptions([...selectedShippingOptions, { value: option.value, label: option.label }])
                                    } else {
                                      setSelectedShippingOptions(
                                        selectedShippingOptions.filter((selected) => selected.value !== option.value)
                                      )
                                    }
                                  }}
                                />
                                <Input
                                  value={option.label}
                                  onChange={(e) => updateCustomShippingOption(index, e.target.value)}
                                  placeholder="発送時期を入力"
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCustomShippingOption(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addCustomShippingOption}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          カスタム発送時期を追加
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <FormLabel>発送方法 *</FormLabel>
                        <div className="space-y-2">
                          {DEFAULT_SHIPPING_METHODS.map((method) => (
                            <div key={method.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedShippingMethods.includes(method.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedShippingMethods([...selectedShippingMethods, method.id])
                                  } else {
                                    setSelectedShippingMethods(
                                      selectedShippingMethods.filter((id) => id !== method.id)
                                    )
                                  }
                                }}
                              />
                              <div>
                                <label className="font-medium">{method.name}</label>
                                <p className="text-sm text-gray-500">{method.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="shipping_info.shipping_fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>送料 *</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" placeholder="送料を入力" />
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