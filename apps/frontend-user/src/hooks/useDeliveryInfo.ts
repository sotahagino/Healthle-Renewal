import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface DeliveryInfo {
  name: string;
  phone_number: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line?: string;
}

export interface DeliveryInfoErrors {
  name?: string;
  phone_number?: string;
  postal_code?: string;
  prefecture?: string;
  city?: string;
  address_line?: string;
}

export interface UseDeliveryInfoReturn {
  deliveryInfo: DeliveryInfo;
  errors: DeliveryInfoErrors;
  isLoading: boolean;
  updateField: (field: keyof DeliveryInfo, value: string) => void;
  validateField: (field: keyof DeliveryInfo) => boolean;
  validateAll: () => boolean;
  saveDeliveryInfo: () => Promise<boolean>;
  formatPhoneNumber: (value: string) => string;
  formatPostalCode: (value: string) => string;
  fetchAddressFromPostalCode: (postalCode: string) => Promise<void>;
}

export function useDeliveryInfo(initialData?: Partial<DeliveryInfo>): UseDeliveryInfoReturn {
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    name: initialData?.name || '',
    phone_number: initialData?.phone_number || '',
    postal_code: initialData?.postal_code || '',
    prefecture: initialData?.prefecture || '',
    city: initialData?.city || '',
    address_line: initialData?.address_line || '',
  });
  const [errors, setErrors] = useState<DeliveryInfoErrors>({});

  // フィールド更新
  const updateField = (field: keyof DeliveryInfo, value: string) => {
    setDeliveryInfo(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // 電話番号のフォーマット
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, '');
    const trimmed = numbers.slice(0, 11);
    
    if (['070', '080', '090'].includes(trimmed.slice(0, 3))) {
      if (trimmed.length > 7) {
        return `${trimmed.slice(0, 3)}-${trimmed.slice(3, 7)}-${trimmed.slice(7)}`;
      }
    } else if (trimmed.length > 6) {
      return `${trimmed.slice(0, 3)}-${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
    }
    return trimmed;
  };

  // 郵便番号のフォーマット
  const formatPostalCode = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, '');
    const trimmed = numbers.slice(0, 7);
    if (trimmed.length > 3) {
      return `${trimmed.slice(0, 3)}-${trimmed.slice(3)}`;
    }
    return trimmed;
  };

  // 郵便番号から住所を取得
  const fetchAddressFromPostalCode = async (postalCode: string) => {
    const cleaned = postalCode.replace(/-/g, '');
    if (!cleaned || cleaned.length < 7) return;
    
    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleaned}`);
      const data = await response.json();
      
      if (data.results?.[0]) {
        const result = data.results[0];
        setDeliveryInfo(prev => ({
          ...prev,
          prefecture: result.address1,
          city: result.address2 + result.address3,
        }));
      }
    } catch (error) {
      console.error('郵便番号検索エラー:', error);
    }
  };

  // フィールドの検証
  const validateField = (field: keyof DeliveryInfo): boolean => {
    let isValid = true;
    const newErrors: DeliveryInfoErrors = {};

    switch (field) {
      case 'name':
        if (!deliveryInfo.name.trim()) {
          newErrors.name = '氏名は必須です';
          isValid = false;
        }
        break;

      case 'phone_number':
        const phoneRegex = /^(0\d{1,4}-\d{1,4}-\d{4}|0\d{9,10})$/;
        const cleanPhone = deliveryInfo.phone_number.replace(/-/g, '');
        if (!cleanPhone) {
          newErrors.phone_number = '電話番号は必須です';
          isValid = false;
        } else if (!phoneRegex.test(cleanPhone)) {
          newErrors.phone_number = '電話番号の形式が正しくありません';
          isValid = false;
        }
        break;

      case 'postal_code':
        const postalRegex = /^\d{3}-?\d{4}$/;
        const cleanPostal = deliveryInfo.postal_code.replace(/-/g, '');
        if (!cleanPostal) {
          newErrors.postal_code = '郵便番号は必須です';
          isValid = false;
        } else if (!postalRegex.test(cleanPostal)) {
          newErrors.postal_code = '郵便番号の形式が正しくありません';
          isValid = false;
        }
        break;

      case 'prefecture':
        if (!deliveryInfo.prefecture) {
          newErrors.prefecture = '都道府県は必須です';
          isValid = false;
        }
        break;

      case 'city':
        if (!deliveryInfo.city.trim()) {
          newErrors.city = '市区町村は必須です';
          isValid = false;
        }
        break;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  // 全フィールドの検証
  const validateAll = (): boolean => {
    return ['name', 'phone_number', 'postal_code', 'prefecture', 'city'].every(
      field => validateField(field as keyof DeliveryInfo)
    );
  };

  // 配送情報の保存
  const saveDeliveryInfo = async (): Promise<boolean> => {
    if (!validateAll()) return false;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('認証されていません');

      const { error } = await supabase
        .from('users')
        .update({
          name: deliveryInfo.name,
          phone_number: deliveryInfo.phone_number.replace(/-/g, ''),
          postal_code: deliveryInfo.postal_code.replace(/-/g, ''),
          prefecture: deliveryInfo.prefecture,
          city: deliveryInfo.city,
          address_line: deliveryInfo.address_line,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('配送情報の保存に失敗:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deliveryInfo,
    errors,
    isLoading,
    updateField,
    validateField,
    validateAll,
    saveDeliveryInfo,
    formatPhoneNumber,
    formatPostalCode,
    fetchAddressFromPostalCode,
  };
} 