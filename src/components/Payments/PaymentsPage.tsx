import React, { useState, useEffect } from 'react';
import { Purchase } from '../../types';
import { supabase } from '../../lib/supabase';
import { Filter, Eye } from 'lucide-react';
import PurchaseDetailsModal from './PurchaseDetailsModal';
import Toast from '../common/Toast';

const PaymentsPage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Paid' | 'Unpaid'>('all');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadPurchases();
  }, []);

  useEffect(() => {
    let filtered = purchases;
    if (filter !== 'all') {
      filtered = purchases.filter(p => p.payment_status === filter);
    }
    setFilteredPurchases(filtered);
  }, [purchases, filter]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          admins (
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data as Purchase[]);
    } catch (error) {
      console.error('Error loading purchases:', error);
      setToast({ message: 'Failed to load purchases.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsModalOpen(true);
  };

  const handleStatusUpdate = (purchaseId: string, newStatus: 'Paid' | 'Unpaid') => {
    setPurchases(purchases.map(p => p.id === purchaseId ? { ...p, payment_status: newStatus, customer_name: newStatus === 'Paid' ? null : p.customer_name, customer_id_number: newStatus === 'Paid' ? null : p.customer_id_number } : p));
    setToast({ message: 'Payment status updated successfully!', type: 'success' });
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Payments Tracking</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage all purchase payments.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center">
            <Filter className="w-5 h-5 text-gray-400" />
            <p className="font-medium ml-2 dark:text-white">Filter by Status:</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'Paid', 'Unpaid'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === status
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 dark:text-gray-400">Loading...</td></tr>
              ) : filteredPurchases.map(purchase => (
                <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{new Date(purchase.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {purchase.customer_name || 'N/A'}
                    {purchase.customer_id_number && <span className="block text-xs text-gray-500 dark:text-gray-400">{purchase.customer_id_number}</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Ksh {purchase.total_amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{purchase.admins?.username || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      purchase.payment_status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {purchase.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleViewDetails(purchase)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center">
                      <Eye className="w-4 h-4 mr-1" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredPurchases.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No purchases found for this filter.</div>
          )}
        </div>
      </div>
      
      {selectedPurchase && (
        <PurchaseDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          purchase={selectedPurchase}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

export default PaymentsPage;
