import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../common/Toast';
import { Database, Download, Upload, FileJson, Loader2, Cloud, Trash2, CloudDownload } from 'lucide-react';

const BackupPage: React.FC = () => {
  const { admin } = useAuth();
  const [isBackingUpLocally, setIsBackingUpLocally] = useState(false);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [cloudBackups, setCloudBackups] = useState<{ name: string; id: string; created_at: string }[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (admin) {
      loadCloudBackups();
    }
  }, [admin]);

  const fetchDataForBackup = async () => {
    const [products, purchases, purchaseItems] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('purchases').select('*'),
      supabase.from('purchase_items').select('*'),
    ]);

    if (products.error || purchases.error || purchaseItems.error) {
      console.error('Data fetch error:', { productsError: products.error, purchasesError: purchases.error, itemsError: purchaseItems.error });
      throw new Error('Failed to fetch all data for backup.');
    }

    return {
      createdAt: new Date().toISOString(),
      data: {
        products: products.data,
        purchases: purchases.data,
        purchase_items: purchaseItems.data,
      },
    };
  };
  
  const loadCloudBackups = async () => {
    if (!admin) return;
    setIsLoadingCloud(true);
    const { data, error } = await supabase.storage.from('backups').list(admin.id, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      setToast({ message: 'Failed to load cloud backups.', type: 'error' });
    } else {
      setCloudBackups(data || []);
    }
    setIsLoadingCloud(false);
  };

  const handleCloudBackup = async () => {
    if (!admin) return;
    setIsUploadingToCloud(true);
    setToast(null);
    try {
      const backupData = await fetchDataForBackup();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const fileName = `backup-${new Date().toISOString()}.json`;
      const filePath = `${admin.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('backups').upload(filePath, blob);
      if (uploadError) throw uploadError;

      setToast({ message: 'Backup uploaded to cloud!', type: 'success' });
      loadCloudBackups();
    } catch (error: any) {
      setToast({ message: error.message || 'Cloud backup failed.', type: 'error' });
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  const restoreDataFromBackup = async (backupData: any) => {
    if (!backupData.data || !backupData.data.products || !backupData.data.purchases || !backupData.data.purchase_items) {
      throw new Error('Invalid backup file format.');
    }
    const { products, purchases, purchase_items } = backupData.data;
    if (products.length > 0) {
      const { error } = await supabase.from('products').upsert(products);
      if (error) throw new Error(`Failed to restore products: ${error.message}`);
    }
    if (purchases.length > 0) {
      const { error } = await supabase.from('purchases').upsert(purchases);
      if (error) throw new Error(`Failed to restore purchases: ${error.message}`);
    }
    if (purchase_items.length > 0) {
      const { error } = await supabase.from('purchase_items').upsert(purchase_items);
      if (error) throw new Error(`Failed to restore purchase items: ${error.message}`);
    }
  };

  const handleCloudRestore = async (fileName: string) => {
    if (!admin) return;
    if (!window.confirm('WARNING: Are you sure you want to restore from this cloud backup? This will overwrite existing data and cannot be undone.')) return;
    
    setIsRestoring(true);
    try {
      const { data: blob, error } = await supabase.storage.from('backups').download(`${admin.id}/${fileName}`);
      if (error) throw error;
      const backupData = JSON.parse(await blob.text());
      await restoreDataFromBackup(backupData);
      setToast({ message: 'Data restored from cloud!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Cloud restore failed.', type: 'error' });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCloudDelete = async (fileName: string) => {
    if (!admin || !window.confirm(`Are you sure you want to permanently delete the backup file "${fileName}"?`)) return;
    
    setIsDeleting(fileName);
    try {
      const { error } = await supabase.storage.from('backups').remove([`${admin.id}/${fileName}`]);
      if (error) throw error;
      setToast({ message: 'Cloud backup deleted.', type: 'success' });
      loadCloudBackups();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to delete backup.', type: 'error' });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCloudDownload = async (fileName: string) => {
    if (!admin) return;
    try {
      const { data: blob, error } = await supabase.storage.from('backups').download(`${admin.id}/${fileName}`);
      if (error) throw error;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setToast({ message: 'Failed to download file.', type: 'error' });
    }
  };

  const handleLocalBackup = async () => {
    setIsBackingUpLocally(true);
    try {
      const backupData = await fetchDataForBackup();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `madeh-hardware-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      setToast({ message: 'Backup downloaded successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Backup failed.', type: 'error' });
    } finally {
      setIsBackingUpLocally(false);
    }
  };

  const handleLocalRestore = async () => {
    if (!restoreFile) return;
    if (!window.confirm('WARNING: Are you sure you want to restore from a local file? This will overwrite existing data and cannot be undone.')) return;
    
    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        await restoreDataFromBackup(backupData);
        setToast({ message: 'Data restored successfully!', type: 'success' });
        setRestoreFile(null);
      } catch (error: any) {
        setToast({ message: error.message || 'Restore failed.', type: 'error' });
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(restoreFile);
  };

  return (
    <div className="p-4 md:p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Backup & Restore</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your application's data backups using Supabase Cloud Storage.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 border-b dark:border-gray-700 pb-6 gap-4">
          <div className="flex items-center">
            <Cloud className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">Cloud Storage</h2>
          </div>
          <button
            onClick={handleCloudBackup}
            disabled={isUploadingToCloud}
            className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center font-medium"
          >
            {isUploadingToCloud ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
            Create Cloud Backup
          </button>
        </div>

        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Available Backups</h3>
        {isLoadingCloud ? (
          <div className="flex justify-center items-center py-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
        ) : cloudBackups.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No cloud backups found. Create one to get started.</p>
        ) : (
          <div className="border dark:border-gray-700 rounded-lg overflow-x-auto">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 min-w-[600px]">
              {cloudBackups.map(backup => (
                <li key={backup.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 gap-4">
                  <div className="flex-grow">
                    <p className="font-medium text-gray-900 dark:text-white break-all">{backup.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created: {new Date(backup.created_at).toLocaleString('en-GB')}</p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button onClick={() => handleCloudRestore(backup.name)} disabled={isRestoring} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-2 rounded-md hover:bg-green-50 dark:hover:bg-gray-600 disabled:opacity-50" title="Restore"><Upload className="w-5 h-5" /></button>
                    <button onClick={() => handleCloudDownload(backup.name)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600" title="Download"><CloudDownload className="w-5 h-5" /></button>
                    <button onClick={() => handleCloudDelete(backup.name)} disabled={isDeleting === backup.name} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-md hover:bg-red-50 dark:hover:bg-gray-600 disabled:opacity-50" title="Delete">
                      {isDeleting === backup.name ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center mb-4">
          <Database className="w-8 h-8 text-gray-600 dark:text-gray-400 mr-3" />
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">Local Backup & Restore</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">For manual offline backups. It is recommended to use the cloud storage feature above.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={handleLocalBackup} disabled={isBackingUpLocally} className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center">
            {isBackingUpLocally ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
            Download Local Backup
          </button>
          <div>
            <input id="local-restore" type="file" accept=".json" onChange={(e) => setRestoreFile(e.target.files?.[0] || null)} className="hidden" />
            <label htmlFor="local-restore" className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 text-center flex items-center justify-center cursor-pointer hover:border-gray-500 dark:hover:border-gray-400">
              <FileJson className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{restoreFile ? restoreFile.name : 'Choose local file...'}</span>
            </label>
            <button onClick={handleLocalRestore} disabled={!restoreFile || isRestoring} className="w-full mt-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center">
              {isRestoring ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
              Restore from Local File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupPage;
