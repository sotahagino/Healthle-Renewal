// ローカルストレージのキー
const GUEST_USER_KEY = 'healthle_guest_user';

// ゲストユーザー情報の型定義
interface GuestUserInfo {
  id: string;
  email: string;
  password: string;
}

// ゲストユーザーのメールアドレスを生成
export function generateGuestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `guest_${timestamp}_${random}@healthle.guest`;
}

// ゲストユーザーのパスワードを生成
export function generateGuestPassword(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `Guest_${timestamp}_${random}`;
}

// ゲストユーザー情報をローカルストレージに保存
export function saveGuestUserInfo(id: string, email: string, password: string): void {
  try {
    const guestInfo: GuestUserInfo = { id, email, password };
    localStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestInfo));
    console.log('Guest user info saved to local storage:', { id, email });
  } catch (error) {
    console.error('Failed to save guest user info:', error);
  }
}

// ゲストユーザー情報をローカルストレージから取得
export function getGuestUserInfo(): GuestUserInfo | null {
  try {
    const guestInfo = localStorage.getItem(GUEST_USER_KEY);
    if (!guestInfo) {
      return null;
    }
    return JSON.parse(guestInfo);
  } catch (error) {
    console.error('Failed to get guest user info:', error);
    return null;
  }
}

// ゲストユーザー情報をローカルストレージから削除
export function clearGuestUserInfo(): void {
  try {
    localStorage.removeItem(GUEST_USER_KEY);
    console.log('Guest user info cleared from local storage');
  } catch (error) {
    console.error('Failed to clear guest user info:', error);
  }
} 