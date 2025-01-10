"use client"

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoginContent } from '@/components/login-content';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const { isGuestUser } = useAuth();

  const handleLogin = async () => {
    try {
      const returnUrl = '/mypage';
      router.push(`/login?returnTo=${encodeURIComponent(returnUrl)}`);
    } catch (error) {
      console.error('Login error:', error);
      alert('ログインに失敗しました。もう一度お試しください。');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <LoginContent
          onLogin={handleLogin}
          returnTo="/mypage"
          title={isGuestUser ? "アカウントの連携" : "ログインが必要です"}
          message={isGuestUser
            ? "アカウントを連携すると、注文履歴や相談履歴を確認できます。"
            : "ログインして、注文履歴や相談履歴を確認できます。"}
          additionalMessage={
            <ul className="text-[#666666] space-y-2 mt-4">
              <li>• 注文履歴の確認</li>
              <li>• 相談履歴の確認</li>
              <li>• 配送状況の追跡</li>
            </ul>
          }
        />
      </DialogContent>
    </Dialog>
  );
} 