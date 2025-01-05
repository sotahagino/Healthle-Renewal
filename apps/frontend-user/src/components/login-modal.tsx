"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoginContent } from '@/components/login-content'
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [showGuestForm, setShowGuestForm] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      onClose()
    }
  }, [user, onClose])

  const handleLineLogin = () => {
    const purchaseFlow = localStorage.getItem('purchaseFlow');
    let order_id = '';
    let return_url = '/mypage';
    if (purchaseFlow) {
      try {
        const purchaseFlowData = JSON.parse(purchaseFlow);
        order_id = purchaseFlowData.order_id;
        return_url = '/purchase-complete';
        console.log('Retrieved order_id from purchaseFlow:', order_id);
      } catch (error) {
        console.error('Error parsing purchaseFlow:', error);
      }
    }

    // ランダムなstateを生成
    const state = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // stateをLocalStorageに保存
    localStorage.setItem('line_login_state', state);

    const lineLoginUrl = new URL(`${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/line`);
    lineLoginUrl.searchParams.append('state', state);
    lineLoginUrl.searchParams.append('return_url', return_url);

    console.log('Redirecting to LINE login:', lineLoginUrl.toString());
    window.location.href = lineLoginUrl.toString();
  };

  if (loading) {
    return null
  }

  return (
    <Dialog open={isOpen && !user} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>アカウント選択</DialogTitle>
        </DialogHeader>
        
        <LoginContent onLogin={handleLineLogin} />
        
        <div className="text-center my-4">または</div>
        
        <Button
          variant="outline"
          onClick={() => setShowGuestForm(!showGuestForm)}
          className="w-full"
        >
          ゲストとして購入
        </Button>

        {showGuestForm && (
          <div className="mt-4 space-y-4">
            {/* ゲスト購入フォームの内容 */}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 