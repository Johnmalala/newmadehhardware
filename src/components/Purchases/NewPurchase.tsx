import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../common/Toast';
import { Search, Plus, Minus, X, ShoppingBag } from 'lucide-react';

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
        setCart([...cart, { product, quantity: 1 }]);
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

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
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

    setSubmitting(true);

    try {
      // Create the purchase record
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          total_amount: cartTotal,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          created_by: admin.id
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create purchase items
      const purchaseItems = cart.map(item => ({
        purchase_id: purchaseData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of cart) {
        const newStock = item.product.stock - item.quantity;
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product.id);

        if (stockError) throw stockError;
      }

      setToast({ message: 'Purchase completed successfully!', type: 'success' });
      setCart([]);
      loadProducts(); // Refresh product list to show updated stock

    } catch (error) {
      console.error('Error completing purchase:', error);
      setToast({ message: 'An error occurred during the purchase.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Left Panel: Product Selection */}
      <div className="lg:w-1/2 bg-white rounded-lg shadow-md flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredProducts.map(product => (
                <li key={product.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">£{product.price.toFixed(2)} - 
                      <span className={`font-medium ml-1 ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {product.stock} in stock
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right Panel: Cart */}
      <div className="lg:w-1/2 bg-white rounded-lg shadow-md flex flex-col">
        <div className="p-4 border-b flex items-center">
          <ShoppingBag className="w-6 h-6 text-green-700 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Current Purchase</h2>
        </div>
        <div className="flex-grow overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-16">
              Your cart is empty. Add products to get started.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {cart.map(item => (
                <li key={item.product.id} className="py-4 flex items-center">
                  <div className="flex-grow">
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-500">£{item.product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 text-gray-500 hover:text-gray-800"><Minus size={16} /></button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                      className="w-12 text-center border border-gray-300 rounded-md mx-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="1"
                      max={item.product.stock}
                    />
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 text-gray-500 hover:text-gray-800"><Plus size={16} /></button>
                  </div>
                  <p className="w-20 text-right font-medium">£{(item.product.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.product.id)} className="ml-4 text-red-500 hover:text-red-700"><X size={18} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span>£{cartTotal.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full border-gray-300 rounded-md shadow-sm"
                >
                  <option>Cash</option>
                  <option>M-Pesa</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select 
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full border-gray-300 rounded-md shadow-sm"
                >
                  <option>Paid</option>
                  <option>Unpaid</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleCompletePurchase}
              disabled={cart.length === 0 || submitting}
              className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
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
