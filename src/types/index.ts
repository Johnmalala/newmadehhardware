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
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  date: string;
  total_amount: number;
  payment_status: 'Paid' | 'Unpaid';
  payment_method: 'M-Pesa' | 'Cash' | 'Bank Transfer' | null;
  created_by: string;
  created_at: string;
  updated_at: string;
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
}

export interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  unpaidPurchases: number;
  recentPurchases: Purchase[];
}
