export interface ProductColor {
  name: string;
  hex: string;
  accent: string;
  glow: string;
  bgGlow: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'SHIRT' | 'PANT' | 'JEANS' | 'JACKET' | 'BLAZER' | 'SHOES' | 'WATCHES' | 'GOGGLES' | 'COMBO' | 'CAPS' | string;
  price: number;
  originalPrice?: number;
  description: string;
  fabric: string;
  details: string[];
  sizes: string[];
  colors: ProductColor[];
  images: {
    front: string;
    back: string;
    detail: string;
    model: string;
  };
  rotation360Images: string[];
  rating: number;
  reviewsCount: number;
  isNew?: boolean;
  isBestseller?: boolean;
  inStock: boolean;
  stockCount: number;
  tagline: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  selectedColor: ProductColor;
  selectedSize: string;
  quantity: number;
  addedAt?: number;
}

export interface WishlistItem {
  productId: string;
  product: Product;
  addedAt?: number;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  date: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING' | 'COD';
  status: 'PENDING' | 'PROCESSING' | 'TAILORED' | 'DISPATCHED' | 'DELIVERED';
  trackingNumber: string;
}

export interface UserAccount {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isLoggedIn: boolean;
  authProvider?: 'password' | 'otp' | 'google';
  avatarUrl?: string;
}

export interface RegisteredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  createdAt: number;
  authProvider?: 'password' | 'otp' | 'google';
  avatarUrl?: string;
}

export type ActiveThemeColor = {
  name: string;
  accent: string;
  glow: string;
  bgGlow: string;
};

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
  label: string;
}

export interface ShippingConfig {
  shippingChargesEnabled: boolean;
  standardShippingFee: number;
  freeShippingThreshold: number;
  shippingLabel?: string;
}

