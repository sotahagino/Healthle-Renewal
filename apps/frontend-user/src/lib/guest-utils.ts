import { v4 as uuidv4 } from 'uuid';

// ゲストユーザーのメールアドレスを生成
export const generateGuestEmail = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `guest_${timestamp}_${random}@guest.healthle.com`;
};

// ゲストユーザーのパスワードを生成
export const generateGuestPassword = (): string => {
  return `guest_${uuidv4()}`;
};

// ローカルストレージのキー
export const GUEST_USER_ID_KEY = 'guest_user_id';
export const GUEST_EMAIL_KEY = 'guest_email';
export const GUEST_PASSWORD_KEY = 'guest_password';

// ゲストユーザー情報をローカルストレージに保存
export const saveGuestUserInfo = (userId: string, email: string, password: string) => {
  localStorage.setItem(GUEST_USER_ID_KEY, userId);
  localStorage.setItem(GUEST_EMAIL_KEY, email);
  localStorage.setItem(GUEST_PASSWORD_KEY, password);
};

// ゲストユーザー情報をローカルストレージから取得
export const getGuestUserInfo = () => {
  const userId = localStorage.getItem(GUEST_USER_ID_KEY);
  const email = localStorage.getItem(GUEST_EMAIL_KEY);
  const password = localStorage.getItem(GUEST_PASSWORD_KEY);
  if (!userId || !email || !password) return null;
  return { userId, email, password };
};

// ゲストユーザー情報をローカルストレージから削除
export const clearGuestUserInfo = () => {
  localStorage.removeItem(GUEST_USER_ID_KEY);
  localStorage.removeItem(GUEST_EMAIL_KEY);
  localStorage.removeItem(GUEST_PASSWORD_KEY);
}; 