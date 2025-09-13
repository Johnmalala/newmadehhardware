import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Toast from '../common/Toast';
import { Save, User } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const { admin, refreshAdmin } = useAuth();
  const [username, setUsername] = useState(admin?.username || '');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin || !username.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('admins')
      .update({ username: username.trim() })
      .eq('id', admin.id);

    if (error) {
      setToast({ message: 'Failed to update profile.', type: 'error' });
    } else {
      setToast({ message: 'Profile updated successfully!', type: 'success' });
      await refreshAdmin();
    }
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="p-6 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <User className="w-6 h-6 mr-3 text-green-600" />
          Profile Information
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Update your display name.</p>
      </div>
      <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Display Name
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter your display name"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !username.trim() || username === admin?.username}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
