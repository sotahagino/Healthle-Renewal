import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoginContent } from '@/components/login-content';
import { useAuth } from '@/hooks/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LoginContentProps {
  onLogin: () => void;
  returnTo: string;
  title: string;
  message: string;
  additionalMessage: React.ReactElement;
}

const LoginContent: React.FC<LoginContentProps> = ({
  onLogin,
  returnTo,
  title,
  message,
  additionalMessage
}) => {
  // ... existing code ...
};

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const handleLineLogin = () => {
    try {
      const lineLoginUrl = process.env.NEXT_PUBLIC_LINE_LOGIN_URL;
      if (lineLoginUrl) {
        const loginUrl = new URL(lineLoginUrl);
        loginUrl.searchParams.set('return_to', '/purchase-complete');

        // purchaseFlowをlocalStorageから取得
        const purchaseFlow = localStorage.getItem('purchaseFlow');
        if (purchaseFlow) {
          const purchaseFlowData = JSON.parse(purchaseFlow);
          console.log('Current purchaseFlow data:', purchaseFlowData);
          
          // order_idを含めて保持
          localStorage.setItem('purchaseFlow', JSON.stringify({
            timestamp: purchaseFlowData.timestamp,
            order_id: purchaseFlowData.order_id
          }));
          console.log('Preserved purchaseFlow data with order_id');
        }

        // LINE認証後のコールバックでゲストアカウントを変換するためのフラグを設定
        localStorage.setItem('convertGuestAccount', 'true');

        window.location.href = loginUrl.toString();
      } else {
        throw new Error('LINE login URL is not configured');
      }
    } catch (error) {
      console.error('LINE login error:', error);
      alert('ログインに失敗しました。もう一度お試しください。');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <LoginContent
          onLogin={handleLineLogin}
          returnTo="/purchase-complete"
          title="商品の発送状況を受け取る"
          message="ご購入ありがとうございます。商品の発送状況や配送状況をLINEでお知らせするために、LINEアカウントと連携してください。"
          additionalMessage={
            <ul className="text-[#666666] space-y-2 mt-4">
              <li>• 商品の発送状況</li>
              <li>• 配送状況の追跡情報</li>
              <li>• お届け完了のお知らせ</li>
            </ul>
          }
        />
      </DialogContent>
    </Dialog>
  );
} 