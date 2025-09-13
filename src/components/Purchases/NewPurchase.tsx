import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../common/Toast';
import { Search, Plus, Minus, X, ShoppingBag, Package, ShoppingCart as EmptyCartIcon } from 'lucide-react';

const NewPurchase: React.FC = () => {
  const { admin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'M-Pesa' | 'Cash' | 'Bank Transfer'>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [customerName, setCustomerName] = useState('');
  const [customerID, setCustomerID] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setToast({ message: 'Failed to load products.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      if (product.stock > 0) {
        setCart([...cart, { product, quantity: 1, price: product.price }]);
      } else {
        setToast({ message: 'This product is out of stock.', type: 'error' });
      }
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const item = cart.find(item => item.product.id === productId);
    if (item && quantity > item.product.stock) {
      setToast({ message: `Only ${item.product.stock} units available.`, type: 'error' });
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ));
    }
  };
  
  const updatePrice = (productId: string, newPrice: number) => {
    if (newPrice < 0) return;
    setCart(cart.map(item =>
      item.product.id === productId ? { ...item, price: newPrice } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const handleCompletePurchase = async () => {
    if (cart.length === 0) {
      setToast({ message: 'Your cart is empty.', type: 'error' });
      return;
    }
    if (!admin) {
      setToast({ message: 'You must be logged in to complete a purchase.', type: 'error' });
      return;
    }
    if (paymentStatus === 'Unpaid' && (!customerName.trim() || !customerID.trim())) {
      setToast({ message: 'Customer Name and ID are required for unpaid purchases.', type: 'error' });
      return;
    }

    setSubmitting(true);

    try {
      const itemsData = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const purchaseData: any = {
        items: itemsData,
        p_created_by: admin.id,
        p_payment_method: paymentMethod,
        p_payment_status: paymentStatus,
        p_customer_name: paymentStatus === 'Unpaid' ? customerName.trim() : null,
        p_customer_id_number: paymentStatus === 'Unpaid' ? customerID.trim() : null,
      };

      const { error } = await supabase.rpc('create_purchase', purchaseData);

      if (error) {
        console.error('Error completing purchase via RPC:', error);
        let userMessage = 'An error occurred during the purchase.';
        
        if (error.message.includes('Not enough stock for product ID')) {
            const match = error.message.match(/product ID ([\w-]+)/);
            if (match && match[1]) {
                const productId = match[1];
                const productName = products.find(p => p.id === productId)?.name;
                userMessage = productName
                  ? `Purchase failed: Not enough stock for "${productName}".`
                  : 'Purchase failed: Insufficient stock for an item.';
            } else {
                 userMessage = 'Purchase failed: Insufficient stock for one or more items.';
            }
        } else if (error.message.includes('stock')) {
            userMessage = 'Purchase failed: Insufficient stock for one or more items.';
        }
        
        setToast({ message: userMessage, type: 'error' });
      } else {
        setToast({ message: 'Purchase completed successfully!', type: 'success' });
        setCart([]);
        setCustomerName('');
        setCustomerID('');
        setPaymentStatus('Paid');
        loadProducts();
      }
    } catch (error) {
      console.error('Unexpected error completing purchase:', error);
      setToast({ message: 'A client-side error occurred.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="border dark:border-gray-700 rounded-lg shadow-sm flex flex-col overflow-hidden transition-shadow hover:shadow-lg bg-white dark:bg-gray-800">
                  <div className="bg-gray-100 dark:bg-gray-700 h-24 flex items-center justify-center">
                    <Package className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="p-3 flex-grow flex flex-col">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm flex-grow">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{product.category}</p>
                    <div className="flex justify-between items-baseline mb-2">
                        <p className="font-bold text-green-700 dark:text-green-400">Ksh {product.price.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Buy: {product.buying_price.toFixed(2)}</p>
                    </div>
                    <p className={`text-xs font-medium mb-3 ${product.stock > 10 ? 'text-gray-500 dark:text-gray-400' : product.stock > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {product.stock} in stock
                    </p>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className="mt-auto w-full bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Plus size={16} className="mr-1" /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-16">
              <p>No products found for "{searchTerm}".</p>
            </div>
          )}
        </div>
      </div>

      <div className={`lg:flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col transition-all duration-300 ease-in-out ${cart.length > 0 ? 'lg:w-2/5' : 'lg:w-[360px]'}`}>
        <div className="p-4 border-b dark:border-gray-700 flex items-center">
          <ShoppingBag className="w-6 h-6 text-green-700 dark:text-green-400 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Current Purchase</h2>
        </div>
        <div className="flex-grow overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 p-8 flex flex-col items-center justify-center h-full">
              <EmptyCartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm">Add products to get started.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {cart.map(item => (
                <li key={item.product.id} className="py-4 flex items-start sm:items-center flex-col sm:flex-row gap-2">
                  <div className="flex-grow">
                    <p className="font-medium text-gray-900 dark:text-gray-200 text-sm">{item.product.name}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Ksh</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updatePrice(item.product.id, parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"><Minus size={16} /></button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                      className="w-12 text-center border-gray-300 dark:border-gray-600 rounded-md mx-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1"
                      max={item.product.stock}
                    />
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"><Plus size={16} /></button>
                  </div>
                  <p className="w-24 text-right font-semibold text-sm dark:text-white">Ksh {(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.product.id)} className="ml-3 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"><X size={16} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xl font-bold dark:text-white">
              <span>Total</span>
              <span>Ksh {cartTotal.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option>Cash</option>
                  <option>M-Pesa</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Status</label>
                <select 
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option>Paid</option>
                  <option>Unpaid</option>
                </select>
              </div>
            </div>
            {paymentStatus === 'Unpaid' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700 space-y-3">
                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Customer Details (for Unpaid Purchase)</h4>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Customer ID Number *</label>
                  <input
                    type="text"
                    value={customerID}
                    onChange={(e) => setCustomerID(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., National ID or Phone"
                  />
                </div>
              </div>
            )}
            <button
              onClick={handleCompletePurchase}
              disabled={cart.length === 0 || submitting}
              className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                'Complete Purchase'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPurchase;
