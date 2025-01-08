"use client"

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoginContent } from '@/components/login-content';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, login } = useAuth();

  // ゲストユーザーの場合、ESCキーとクリックでの閉じる操作を無効化
  const handleClose = () => {
    if (!user?.is_guest) {
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
          title="ログインが必要です"
          message="LINEアカウントでログインして続けましょう"
        />
      </DialogContent>
    </Dialog>
  );
} 