import React, { useState, useEffect } from 'react';
import { Purchase, PurchaseItem } from '../../types';
import { supabase } from '../../lib/supabase';
import Modal from '../common/Modal';
import { DollarSign } from 'lucide-react';

interface PurchaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase;
  onStatusUpdate: (purchaseId: string, newStatus: 'Paid' | 'Unpaid') => void;
}

const PurchaseDetailsModal: React.FC<PurchaseDetailsModalProps> = ({ isOpen, onClose, purchase, onStatusUpdate }) => {
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPurchaseItems();
    }
  }, [isOpen, purchase.id]);

  const loadPurchaseItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchase_items')
        .select(`
          *,
          products (
            name,
            category
          )
        `)
        .eq('purchase_id', purchase.id);
      
      if (error) throw error;
      setItems(data as PurchaseItem[]);
    } catch (error) {
      console.error('Error loading purchase items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ payment_status: 'Paid' })
        .eq('id', purchase.id);
      
      if (error) throw error;
      onStatusUpdate(purchase.id, 'Paid');
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const renderFooter = () => {
    if (purchase.payment_status === 'Unpaid') {
      return (
        <div className="flex justify-end">
          <button
            onClick={handleMarkAsPaid}
            disabled={updating}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            {updating ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <DollarSign className="w-4 h-4 mr-2" />
            )}
            Mark as Paid
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <Modal
      title={`Purchase Details - #${purchase.id.substring(0, 8)}`}
      isOpen={isOpen}
      onClose={onClose}
      footer={renderFooter()}
    >
      {loading ? (
        <div className="text-center">Loading details...</div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div><strong>Date:</strong> {new Date(purchase.created_at).toLocaleString('en-GB')}</div>
            <div><strong>Total:</strong> <span className="font-bold text-lg">Ksh {purchase.total_amount.toFixed(2)}</span></div>
            <div><strong>Payment Method:</strong> {purchase.payment_method}</div>
            <div><strong>Status:</strong> <span className={`font-semibold ${purchase.payment_status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>{purchase.payment_status}</span></div>
            <div><strong>Created By:</strong> {purchase.admins?.username || 'N/A'}</div>
          </div>
          <h3 className="font-semibold mb-2">Items in Purchase:</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{item.products?.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{item.products?.category}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.quantity}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">Ksh {item.price.toFixed(2)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium">Ksh {(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PurchaseDetailsModal;
