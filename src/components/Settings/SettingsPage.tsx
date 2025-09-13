import React from 'react';
import ProfileSettings from './ProfileSettings';
import PasswordSettings from './PasswordSettings';
import ThemeSettings from './ThemeSettings';

const SettingsPage: React.FC = () => {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account and application preferences.</p>
      </div>
      <div className="max-w-4xl mx-auto space-y-8">
        <ProfileSettings />
        <PasswordSettings />
        <ThemeSettings />
      </div>
    </div>
  );
};

export default SettingsPage;
