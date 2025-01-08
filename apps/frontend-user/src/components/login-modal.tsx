"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, CheckCircle, Bell, Package } from "lucide-react"
import Image from "next/image"

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGuestUser?: boolean;
}

export default function LoginModal({
  isOpen,
  onClose,
  isGuestUser = false
}: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, initiateLineLogin } = useAuth()

  // ゲストユーザーの場合、ESCキーとクリックでの閉じる操作を無効化
  const handleClose = () => {
    if (!isGuestUser) {
      setError(null)
      onClose()
    }
  }

  const handleLineLogin = async () => {
    setError(null)
    setIsLoading(true)
    try {
      await initiateLineLogin()
    } catch (error) {
      console.error('LINE login error:', error)
      setError('LINEログインに失敗しました。しばらく時間をおいて再度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-[#4C9A84]">
            LINEで便利に
          </DialogTitle>
          <DialogDescription className="text-center">
            LINEと連携して、より便利にHealthleをご利用いただけます
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-6 mb-8">
            <div className="flex items-start">
              <Package className="w-6 h-6 text-[#4C9A84] mr-4 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-[#333333]">発送状況の通知</h3>
                <p className="text-[#666666] text-sm">商品の発送状況をリアルタイムでお知らせ</p>
              </div>
            </div>
            <div className="flex items-start">
              <Bell className="w-6 h-6 text-[#4C9A84] mr-4 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-[#333333]">お得な情報</h3>
                <p className="text-[#666666] text-sm">クーポンや限定情報をいち早くお届け</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-[#4C9A84] mr-4 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-[#333333]">簡単な注文管理</h3>
                <p className="text-[#666666] text-sm">注文履歴の確認や再注文がスムーズに</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleLineLogin}
            disabled={isLoading}
            className="w-full bg-[#00B900] hover:bg-[#00A000] text-white py-6 font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:translate-y-[-2px] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                連携中...
              </>
            ) : (
              <>
                <Image
                  src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/LINE_logo.svg.webp"
                  alt="LINE"
                  width={24}
                  height={24}
                  className="mr-2"
                />
                LINEで連携する
              </>
            )}
          </Button>

          {!isGuestUser && (
            <p className="text-center text-sm text-gray-500 mt-4">
              キャンセルする場合は、画面外をクリックしてください
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 