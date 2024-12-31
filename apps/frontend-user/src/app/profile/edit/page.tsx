"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardFooter } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { SiteHeader } from '../../../components/site-header'
import { Footer } from '../../../components/footer'
import { ArrowLeft, Save } from 'lucide-react'

// Mock user data (in a real app, this would come from the backend)
const mockUser = {
  name: "山田 太郎",
  email: "yamada@example.com",
  phoneNumber: "090-1234-5678",
  postalCode: "150-0041",
  prefecture: "東京都",
  city: "渋谷区",
  address: "神南1-2-3",
}

export default function EditProfile() {
  const router = useRouter()
  const [formData, setFormData] = useState(mockUser)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) newErrors.name = "名前は必須です"
    if (!formData.email.trim()) newErrors.email = "メールアドレスは必須です"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "有効なメールアドレスを入力してください"
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "電話番号は必須です"
    if (!formData.postalCode.trim()) newErrors.postalCode = "郵便番号は必須です"
    if (!formData.prefecture) newErrors.prefecture = "都道府県は必須です"
    if (!formData.city.trim()) newErrors.city = "市区町村は必須です"
    if (!formData.address.trim()) newErrors.address = "番地・建物名は必須です"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      console.log('Form submitted:', formData)
      // Here you would typically send the data to your backend
      // For now, we'll just simulate a successful update
      alert('プロフィールが更新されました')
      router.push('/mypage')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-2xl mx-auto">
          <Link href="/mypage" passHref>
            <Button variant="link" className="mb-4 text-[#4C9A84]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              マイページに戻る
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-6 text-[#333333]">プロフィール編集</h1>
          <Card className="bg-white shadow-lg">
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="name">お名前</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="phoneNumber">電話番号</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={errors.phoneNumber ? "border-red-500" : ""}
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                </div>
                <div>
                  <Label htmlFor="postalCode">郵便番号</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="123-4567"
                    className={errors.postalCode ? "border-red-500" : ""}
                  />
                  {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
                </div>
                <div>
                  <Label htmlFor="prefecture">都道府県</Label>
                  <Select
                    name="prefecture"
                    value={formData.prefecture}
                    onValueChange={(value) => handleSelectChange('prefecture', value)}
                  >
                    <SelectTrigger className={errors.prefecture ? "border-red-500" : ""}>
                      <SelectValue placeholder="都道府県を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {['北海道', '東京都', '大阪府', '京都府', '福岡県'].map(pref => (
                        <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.prefecture && <p className="text-red-500 text-sm mt-1">{errors.prefecture}</p>}
                </div>
                <div>
                  <Label htmlFor="city">市区町村</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                <div>
                  <Label htmlFor="address">番地・建物名</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={errors.address ? "border-red-500" : ""}
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>
              </CardContent>
              <CardFooter className="bg-[#F0F8F5] p-6">
                <Button type="submit" className="w-full bg-[#4C9A84] hover:bg-[#3A8B73] text-white">
                  <Save className="mr-2 h-5 w-5" />
                  変更を保存
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

