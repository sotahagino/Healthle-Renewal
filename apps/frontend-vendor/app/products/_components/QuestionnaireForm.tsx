'use client'

import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus } from 'lucide-react'

const questionnaireSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください'),
  description: z.string().optional(),
  items: z.array(z.object({
    question: z.string().min(1, '質問を入力してください'),
    question_type: z.enum(['text', 'radio', 'checkbox', 'select'], {
      required_error: '質問タイプを選択してください',
    }),
    required: z.boolean(),
    options: z.array(z.object({
      value: z.string().min(1, '選択肢を入力してください'),
    })).optional(),
    order_index: z.number(),
  })).min(1, '少なくとも1つの質問を追加してください'),
})

type QuestionnaireFormValues = z.infer<typeof questionnaireSchema>

interface QuestionnaireFormProps {
  onSubmit: (data: QuestionnaireFormValues) => Promise<void>
  defaultValues?: QuestionnaireFormValues
}

const QUESTION_TYPES = [
  { value: 'text', label: 'テキスト入力' },
  { value: 'radio', label: '単一選択' },
  { value: 'checkbox', label: '複数選択' },
  { value: 'select', label: 'プルダウン選択' },
] as const

export default function QuestionnaireForm({ onSubmit, defaultValues }: QuestionnaireFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<QuestionnaireFormValues>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: defaultValues || {
      title: '',
      description: '',
      items: [
        {
          question: '',
          question_type: 'text',
          required: true,
          options: [],
          order_index: 0,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  // 選択肢用のFieldArray
  const getOptionsFieldArray = (index: number) => {
    return useFieldArray({
      control: form.control,
      name: `items.${index}.options`,
    })
  }

  const handleSubmit = async (data: QuestionnaireFormValues) => {
    setLoading(true)
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Error submitting questionnaire:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>問診票の基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タイトル *</FormLabel>
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
                  <FormLabel>説明</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormDescription>
                    問診票の説明や注意事項を入力してください
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>質問項目</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, index) => {
              const optionsArray = getOptionsFieldArray(index)
              
              return (
                <div key={field.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">質問 {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${index}.question`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>質問文 *</FormLabel>
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
                      name={`items.${index}.question_type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>質問タイプ *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              // 選択タイプに変更された場合、デフォルトの選択肢を追加
                              if (['radio', 'checkbox', 'select'].includes(value) && optionsArray.fields.length === 0) {
                                optionsArray.append({ value: '' })
                              }
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="質問タイプを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {QUESTION_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
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
                      name={`items.${index}.required`}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">必須</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  {['radio', 'checkbox', 'select'].includes(form.watch(`items.${index}.question_type`)) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>選択肢 *</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => optionsArray.append({ value: '' })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          選択肢を追加
                        </Button>
                      </div>
                      {optionsArray.fields.map((optionField, optionIndex) => (
                        <div key={optionField.id} className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.options.${optionIndex}.value`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input {...field} placeholder={`選択肢 ${optionIndex + 1}`} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => optionsArray.remove(optionIndex)}
                            disabled={optionsArray.fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => append({
                question: '',
                question_type: 'text',
                required: true,
                options: [],
                order_index: fields.length,
              })}
            >
              <Plus className="mr-2 h-4 w-4" />
              質問を追加
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? '保存中...' : '保存する'}
          </Button>
        </div>
      </form>
    </Form>
  )
} 