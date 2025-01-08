"use client"

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoginContent } from '@/components/login-content';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGuestUser?: boolean;
}

export function LoginModal({ isOpen, onClose, isGuestUser = false }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, login } = useAuth();

  // ゲストユーザーの場合、ESCキーとクリックでの閉じる操作を無効化
  const handleClose = () => {
    if (!isGuestUser) {
      onClose();
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { url } = await login();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('ログインに失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <LoginContent
          onLogin={handleLogin}
          title={isGuestUser ? "アカウントの連携" : "ログインが必要です"}
          message={isGuestUser 
            ? "LINEアカウントと連携して、より便利にご利用いただけます"
            : "LINEアカウントでログインして続けましょう"
          }
        />
      </DialogContent>
    </Dialog>
  );
} 