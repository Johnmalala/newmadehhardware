import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Theme } from '../../types';

const ThemeSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="p-6 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <Sun className="w-6 h-6 mr-3 text-green-600" />
          Appearance
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Customize the look and feel of the application.</p>
      </div>
      <div className="p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Theme
        </label>
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`flex flex-col sm:flex-row items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                theme === option.value
                  ? 'bg-white dark:bg-gray-900 text-green-600 shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <option.icon className="w-5 h-5 mb-1 sm:mb-0 sm:mr-2" />
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
