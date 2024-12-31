'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePurchase } from '@/contexts/PurchaseContext';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PurchaseModal({ isOpen, onClose }: PurchaseModalProps) {
  const { user, loading } = useAuth();
  const {
    status,
    product,
    isLoading,
    error,
    deliveryInfo: {
      deliveryInfo,
      errors,
      updateField,
      validateField,
      formatPhoneNumber,
      formatPostalCode,
      fetchAddressFromPostalCode,
    },
    proceedToDelivery,
    proceedToConfirm,
    proceedToCheckout,
  } = usePurchase();

  const handlePostalCodeChange = async (value: string) => {
    const formatted = formatPostalCode(value);
    updateField('postal_code', formatted);
    if (formatted.replace(/-/g, '').length === 7) {
      await fetchAddressFromPostalCode(formatted);
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    updateField('phone_number', formatPhoneNumber(value));
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>読み込み中...</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </>
      );
    }

    if (!user) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>LINEでログイン</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-4">
              購入を続けるにはLINEでログインしてください。
            </p>
            <Button
              className="w-full bg-[#00B900] hover:bg-[#00A000] text-white"
              onClick={() => {
                const lineLoginUrl = process.env.NEXT_PUBLIC_LINE_LOGIN_URL;
                if (lineLoginUrl) window.location.href = lineLoginUrl;
              }}
            >
              LINEでログイン
            </Button>
          </div>
        </>
      );
    }

    switch (status) {
      case 'delivery':
        return (
          <>
            <DialogHeader>
              <DialogTitle>配送情報の入力</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">氏名</Label>
                <Input
                  id="name"
                  value={deliveryInfo.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  onBlur={() => validateField('name')}
                  error={errors.name}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  value={deliveryInfo.phone_number}
                  onChange={(e) => handlePhoneNumberChange(e.target.value)}
                  onBlur={() => validateField('phone_number')}
                  error={errors.phone_number}
                />
                {errors.phone_number && (
                  <p className="text-sm text-red-500">{errors.phone_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">郵便番号</Label>
                <Input
                  id="postal_code"
                  value={deliveryInfo.postal_code}
                  onChange={(e) => handlePostalCodeChange(e.target.value)}
                  onBlur={() => validateField('postal_code')}
                  error={errors.postal_code}
                />
                {errors.postal_code && (
                  <p className="text-sm text-red-500">{errors.postal_code}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefecture">都道府県</Label>
                <Select
                  value={deliveryInfo.prefecture}
                  onValueChange={(value) => updateField('prefecture', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="都道府県を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
                      "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
                      "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
                      "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
                      "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
                      "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
                      "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
                    ].map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.prefecture && (
                  <p className="text-sm text-red-500">{errors.prefecture}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">市区町村</Label>
                <Input
                  id="city"
                  value={deliveryInfo.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  onBlur={() => validateField('city')}
                  error={errors.city}
                />
                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line">番地・建物名</Label>
                <Input
                  id="address_line"
                  value={deliveryInfo.address_line}
                  onChange={(e) => updateField('address_line', e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={proceedToConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '次へ進む'
                )}
              </Button>
            </div>
          </>
        );

      case 'confirm':
        return (
          <>
            <DialogHeader>
              <DialogTitle>購入内容の確認</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {product && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-lg font-bold mt-2">¥{product.price.toLocaleString()}</p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">配送先情報</h3>
                <p>{deliveryInfo.name}</p>
                <p>〒{deliveryInfo.postal_code}</p>
                <p>{deliveryInfo.prefecture}{deliveryInfo.city}</p>
                {deliveryInfo.address_line && <p>{deliveryInfo.address_line}</p>}
                <p>電話番号: {deliveryInfo.phone_number}</p>
              </div>

              <Button
                className="w-full"
                onClick={proceedToCheckout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    処理中...
                  </>
                ) : (
                  '決済に進む'
                )}
              </Button>
            </div>
          </>
        );

      case 'error':
        return (
          <>
            <DialogHeader>
              <DialogTitle>エラーが発生しました</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-red-500">{error?.message}</p>
              <Button className="w-full" onClick={onClose}>
                閉じる
              </Button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
} 