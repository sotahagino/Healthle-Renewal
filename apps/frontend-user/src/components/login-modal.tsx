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
      if (lineLoginUrl) {
        const purchaseFlow = localStorage.getItem('purchaseFlow');
        if (purchaseFlow) {
          const { consultation_id } = JSON.parse(purchaseFlow);
          const loginUrlObj = new URL(lineLoginUrl);
          loginUrlObj.searchParams.set('return_to', window.location.pathname);
          window.location.href = loginUrlObj.toString();
        } else {
          window.location.href = lineLoginUrl;
        }
      } else {
        throw new Error('LINE login URL is not configured');
      }
    } catch (error) {
      console.error('Login error:', error);
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