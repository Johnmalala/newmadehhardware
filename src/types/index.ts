export interface Admin {
  id: string;
  username: string;
  role: 'Super Admin' | 'Admin' | 'Cashier';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  buying_price: number;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  total_amount: number;
  payment_status: 'Paid' | 'Unpaid';
  payment_method: 'M-Pesa' | 'Cash' | 'Bank Transfer' | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  customer_id_number: string | null;
  admins: { username: string } | null; // For joined data
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  products?: { name: string; category: string }; // For joined data
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  unpaidPurchases: number;
  recentPurchases: Purchase[];
  lowStockItems: Product[];
}

export interface AuthContextType {
  admin: Admin | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  refreshAdmin: () => Promise<void>;
}

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
