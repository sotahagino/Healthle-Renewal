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

const lineLoginUrl = process.env.NEXT_PUBLIC_LINE_LOGIN_URL

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [showGuestForm, setShowGuestForm] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      onClose()
    }
  }, [user, onClose])

  const handleLogin = () => {
    try {
      const purchaseFlow = localStorage.getItem('purchaseFlow');
      let order_id = '';
      
      if (purchaseFlow) {
        try {
          const purchaseFlowData = JSON.parse(purchaseFlow) as { order_id: string };
          order_id = purchaseFlowData.order_id;
          console.log('Retrieved order_id from purchaseFlow:', order_id);
        } catch (error) {
          console.error('Error parsing purchaseFlow:', error);
        }
      }

      // LINE認証URLの構築
      const lineLoginUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
      lineLoginUrl.searchParams.append('response_type', 'code');
      lineLoginUrl.searchParams.append('client_id', process.env.NEXT_PUBLIC_LINE_CLIENT_ID!);
      lineLoginUrl.searchParams.append('redirect_uri', process.env.NEXT_PUBLIC_LINE_REDIRECT_URI!);
      lineLoginUrl.searchParams.append('state', '12345');
      lineLoginUrl.searchParams.append('scope', 'profile openid');
      lineLoginUrl.searchParams.append('nonce', '09876');
      
      if (order_id) {
        lineLoginUrl.searchParams.append('order_id', order_id);
        console.log('Added order_id to login URL:', order_id);
      }

      console.log('Redirecting to LINE login:', lineLoginUrl.toString());
      window.location.href = lineLoginUrl.toString();
    } catch (error) {
      console.error('Error in handleLogin:', error);
    }
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
        
        <LoginContent onLogin={handleLogin} />
        
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