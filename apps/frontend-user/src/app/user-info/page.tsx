"use client"

import { useState } from 'react'
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardFooter } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { SiteHeader } from '../../components/site-header'
import { Footer } from '../../components/footer'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'

export default function UserInfo() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    kana: '',
    gender: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    postalCode: '',
    prefecture: '',
    city: '',
    address: '',
    phoneNumber: '',
    email: '',
  })
  const { logout } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    router.push('/checkout')
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('ログアウトに失敗しました:', error)
    }
  }

  const renderStep1 = () => (
    <>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">お名前（漢字）</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="山田 太郎" required />
        </div>
        <div>
          <Label htmlFor="kana">お名前（カナ）</Label>
          <Input id="kana" name="kana" value={formData.kana} onChange={handleInputChange} placeholder="ヤマダ タロウ" required />
        </div>
        <div>
          <Label>性別</Label>
          <RadioGroup name="gender" value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)} className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male">男性</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female">女性</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other">その他</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <Label htmlFor="birthYear">生年月日（年）</Label>
            <Select name="birthYear" value={formData.birthYear} onValueChange={(value) => handleSelectChange('birthYear', value)}>
              <SelectTrigger>
                <SelectValue placeholder="年" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="birthMonth">月</Label>
            <Select name="birthMonth" value={formData.birthMonth} onValueChange={(value) => handleSelectChange('birthMonth', value)}>
              <SelectTrigger>
                <SelectValue placeholder="月" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <SelectItem key={month} value={month.toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="birthDay">日</Label>
            <Select name="birthDay" value={formData.birthDay} onValueChange={(value) => handleSelectChange('birthDay', value)}>
              <SelectTrigger>
                <SelectValue placeholder="日" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <Button className="w-full mt-6" onClick={() => setStep(2)}>
        次へ <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </>
  )

  const renderStep2 = () => (
    <>
      <div className="space-y-4">
        <div>
          <Label htmlFor="postalCode">郵便番号</Label>
          <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleInputChange} placeholder="123-4567" required />
        </div>
        <div>
          <Label htmlFor="prefecture">都道府県</Label>
          <Select name="prefecture" value={formData.prefecture} onValueChange={(value) => handleSelectChange('prefecture', value)}>
            <SelectTrigger>
              <SelectValue placeholder="都道府県を選択" />
            </SelectTrigger>
            <SelectContent>
              {['北海道', '東京都', '大阪府', '京都府', '福岡県'].map(pref => (
                <SelectItem key={pref} value={pref}>{pref}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="city">市区町村</Label>
          <Input id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="渋谷区" required />
        </div>
        <div>
          <Label htmlFor="address">番地・建物名</Label>
          <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="1-2-3 ○○マンション101" required />
        </div>
        <div>
          <Label htmlFor="phoneNumber">電話番号</Label>
          <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="090-1234-5678" required />
        </div>
        <div>
          <Label htmlFor="email">メールアドレス</Label>
          <Input id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="example@email.com" required />
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 戻る
        </Button>
        <Button onClick={handleSubmit}>
          確認画面へ <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <Card className="max-w-2xl mx-auto bg-white shadow-lg">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-center mb-6 text-[#333333]">
              ユーザー情報入力
            </h1>
            <div className="mb-6 flex justify-between items-center">
              <div className={`w-1/2 h-2 ${step === 1 ? 'bg-[#4C9A84]' : 'bg-[#A7D7C5]'} rounded-l-full`}></div>
              <div className={`w-1/2 h-2 ${step === 2 ? 'bg-[#4C9A84]' : 'bg-[#A7D7C5]'} rounded-r-full`}></div>
            </div>
            <form onSubmit={handleSubmit}>
              {step === 1 ? renderStep1() : renderStep2()}
            </form>
          </CardContent>
          <CardFooter className="bg-[#F0F8F5] p-4 text-sm text-[#666666] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#4C9A84] mr-2" />
            お客様の情報は厳重に保護され、サービス提供以外の目的では使用されません。
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

