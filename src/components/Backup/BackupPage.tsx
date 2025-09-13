import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Toast from '../common/Toast';
import { Database, Download, Upload, AlertTriangle, FileJson, Loader2 } from 'lucide-react';

const BackupPage: React.FC = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setToast(null);
    try {
      const [products, purchases, purchaseItems] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('purchases').select('*'),
        supabase.from('purchase_items').select('*'),
      ]);

      if (products.error || purchases.error || purchaseItems.error) {
        throw new Error('Failed to fetch all data for backup.');
      }

      const backupData = {
        createdAt: new Date().toISOString(),
        data: {
          products: products.data,
          purchases: purchases.data,
          purchase_items: purchaseItems.data,
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `madeh-hardware-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      setToast({ message: 'Backup downloaded successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Backup failed:', error);
      setToast({ message: error.message || 'Backup failed. Please try again.', type: 'error' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setRestoreFile(event.target.files[0]);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      setToast({ message: 'Please select a backup file to restore.', type: 'error' });
      return;
    }

    const confirmation = window.confirm(
      'WARNING: You are about to restore data from a backup file. This will add new data and overwrite any existing data with the same ID. This action cannot be undone. Are you sure you want to continue?'
    );

    if (!confirmation) return;

    setIsRestoring(true);
    setToast(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);

        if (!backupData.data || !backupData.data.products || !backupData.data.purchases || !backupData.data.purchase_items) {
          throw new Error('Invalid backup file format.');
        }

        const { products, purchases, purchase_items } = backupData.data;

        // Upsert data in order of dependencies
        if (products.length > 0) {
          const { error: productsError } = await supabase.from('products').upsert(products);
          if (productsError) throw new Error(`Failed to restore products: ${productsError.message}`);
        }
        if (purchases.length > 0) {
          const { error: purchasesError } = await supabase.from('purchases').upsert(purchases);
          if (purchasesError) throw new Error(`Failed to restore purchases: ${purchasesError.message}`);
        }
        if (purchase_items.length > 0) {
          const { error: itemsError } = await supabase.from('purchase_items').upsert(purchase_items);
          if (itemsError) throw new Error(`Failed to restore purchase items: ${itemsError.message}`);
        }

        setToast({ message: 'Data restored successfully!', type: 'success' });
        setRestoreFile(null);
      } catch (error: any) {
        console.error('Restore failed:', error);
        setToast({ message: error.message || 'Restore failed. Check file and try again.', type: 'error' });
      } finally {
        setIsRestoring(false);
      }
    };

    reader.readAsText(restoreFile);
  };

  return (
    <div className="p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backup & Restore</h1>
          <p className="text-gray-600">Manage your application's data backups.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Backup Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Database className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-800">Create a Backup</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Download a complete backup of your products, purchases, and sales data as a single JSON file. It's recommended to do this regularly and store the file in a safe, secure location.
          </p>
          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center text-lg font-medium"
          >
            {isBackingUp ? (
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            Download Backup File
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Upload className="w-8 h-8 text-green-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-800">Restore from Backup</h2>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <span className="font-bold">Warning:</span> Restoring from a backup will overwrite data. This action cannot be undone. Always create a fresh backup before restoring.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="restore-file-input" className="cursor-pointer w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center flex flex-col items-center hover:border-green-500 hover:bg-green-50">
              <FileJson className="w-10 h-10 text-gray-400 mb-2" />
              <span className="text-green-600 font-medium">
                {restoreFile ? 'File selected:' : 'Choose a backup file'}
              </span>
              <span className="text-sm text-gray-500 mt-1">
                {restoreFile ? restoreFile.name : '(.json format only)'}
              </span>
            </label>
            <input
              id="restore-file-input"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <button
            onClick={handleRestore}
            disabled={!restoreFile || isRestoring}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
          >
            {isRestoring ? (
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
            ) : (
              <Upload className="w-5 h-5 mr-2" />
            )}
            Restore Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupPage;
