"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { LoginContent } from '@/components/login-content'
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Loader2 } from "lucide-react"
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
}: {
  isOpen: boolean;
  onClose: () => void;
  isGuestUser?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  // ゲストユーザーの場合、ESCキーとクリックでの閉じる操作を無効化
  const handleClose = () => {
    if (!isGuestUser) {
      onClose()
    }
  }

  const handleLineLogin = () => {
    // ゲストユーザー情報をローカルストレージに保存
    if (isGuestUser) {
      localStorage.setItem('convertGuestAccount', 'true');
    }

    // ランダムなstateを生成
    const state = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // stateをLocalStorageに保存
    localStorage.setItem('line_login_state', state);

    const lineLoginUrl = new URL(`${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/line`);
    lineLoginUrl.searchParams.append('state', state);
    lineLoginUrl.searchParams.append('return_url', '/purchase-complete');

    console.log('Redirecting to LINE login:', lineLoginUrl.toString());
    window.location.href = lineLoginUrl.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>LINEでログイン</DialogTitle>
          <DialogDescription>
            LINEアカウントと連携して、商品の発送状況をお知らせします
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            onClick={handleLineLogin}
            disabled={isLoading}
            className="bg-[#00B900] hover:bg-[#00A000] text-white"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Image
                src="/line-icon.png"
                alt="LINE"
                width={24}
                height={24}
                className="mr-2"
              />
            )}
            LINEでログイン
          </Button>
        </div>
        {!isGuestUser && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
} 