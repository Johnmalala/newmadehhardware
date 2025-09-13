import React, { useState, useEffect, useMemo } from 'react';
import { Purchase } from '../../types';
import { supabase } from '../../lib/supabase';
import { BarChart, Calendar, DollarSign, Download, Filter, ShoppingCart, TrendingUp } from 'lucide-react';
import { unparse } from 'papaparse';

const ReportsPage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'Cash' | 'M-Pesa' | 'Bank Transfer'>('all');

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('payment_status', 'Paid') // Reports are only for paid purchases
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading purchases for reports:', error);
    } else {
      setPurchases(data as Purchase[]);
    }
    setLoading(false);
  };

  const filteredPurchases = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return purchases.filter(p => {
      const purchaseDate = new Date(p.created_at);
      const dateMatch =
        dateFilter === 'all' ||
        (dateFilter === 'today' && purchaseDate >= today) ||
        (dateFilter === 'month' && purchaseDate >= startOfMonth);
      
      const paymentMatch = paymentMethodFilter === 'all' || p.payment_method === paymentMethodFilter;
      
      return dateMatch && paymentMatch;
    });
  }, [purchases, dateFilter, paymentMethodFilter]);

  const stats = useMemo(() => {
    const totalSales = filteredPurchases.reduce((sum, p) => sum + p.total_amount, 0);
    const totalPurchases = filteredPurchases.length;
    const averageSale = totalPurchases > 0 ? totalSales / totalPurchases : 0;
    return { totalSales, totalPurchases, averageSale };
  }, [filteredPurchases]);

  const downloadReport = () => {
    const reportData = filteredPurchases.map(p => ({
      'Purchase ID': p.id,
      'Date': new Date(p.created_at).toLocaleDateString('en-GB'),
      'Total Amount': p.total_amount.toFixed(2),
      'Payment Method': p.payment_method,
      'Payment Status': p.payment_status,
    }));

    const csv = unparse(reportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Sales Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Analyze your sales performance.</p>
        </div>
        <button
          onClick={downloadReport}
          disabled={filteredPurchases.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 self-start sm:self-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="font-medium dark:text-white">Filter by Date</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'today', 'month'] as const).map(f => (
                <button key={f} onClick={() => setDateFilter(f)} className={`px-3 py-1 rounded-full text-sm font-medium ${dateFilter === f ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>
                  {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : 'This Month'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <Filter className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="font-medium dark:text-white">Filter by Payment Method</h3>
            </div>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center">
          <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full mr-4"><DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" /></div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">Ksh {stats.totalSales.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full mr-4"><ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Purchases</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPurchases}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full mr-4"><TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" /></div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Sale Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">Ksh {stats.averageSale.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center">
          <BarChart className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sales Data</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Payment Method</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={3} className="text-center py-8 dark:text-gray-400">Loading report data...</td></tr>
              ) : filteredPurchases.map(p => (
                <tr key={p.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">{new Date(p.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-white">Ksh {p.total_amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">{p.payment_method}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredPurchases.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No sales data found for the selected filters.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
