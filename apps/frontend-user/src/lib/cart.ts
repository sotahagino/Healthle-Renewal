export type CartItem = {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
};

export type Cart = {
  items: CartItem[];
  total: number;
};

// ローカルストレージのキー
const CART_STORAGE_KEY = 'healthle_cart';

// カートの取得
export const getCart = (): Cart => {
  if (typeof window === 'undefined') {
    return { items: [], total: 0 };
  }
  
  const cartData = localStorage.getItem(CART_STORAGE_KEY);
  if (!cartData) {
    return { items: [], total: 0 };
  }

  const cart: Cart = JSON.parse(cartData);
  return cart;
};

// カートの保存
export const saveCart = (cart: Cart) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
};

// 商品の追加
export const addToCart = (item: CartItem) => {
  const cart = getCart();
  const existingItem = cart.items.find(i => i.product_id === item.product_id);

  if (existingItem) {
    existingItem.quantity += item.quantity;
  } else {
    cart.items.push(item);
  }

  cart.total = calculateTotal(cart.items);
  saveCart(cart);
  return cart;
};

// 商品の削除
export const removeFromCart = (productId: string) => {
  const cart = getCart();
  cart.items = cart.items.filter(item => item.product_id !== productId);
  cart.total = calculateTotal(cart.items);
  saveCart(cart);
  return cart;
};

// 数量の更新
export const updateQuantity = (productId: string, quantity: number) => {
  const cart = getCart();
  const item = cart.items.find(i => i.product_id === productId);
  
  if (item) {
    item.quantity = quantity;
    cart.total = calculateTotal(cart.items);
    saveCart(cart);
  }
  
  return cart;
};

// カートのクリア
export const clearCart = () => {
  const emptyCart: Cart = { items: [], total: 0 };
  saveCart(emptyCart);
  return emptyCart;
};

// 合計金額の計算
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}; 