import React from 'react';
import { Menu } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
  return (
    <div className="md:hidden bg-white dark:bg-gray-800 shadow-md p-4 flex items-center">
      <button onClick={onMenuClick} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex-grow text-center">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-green-200">
            MH
          </div>
          <h1 className="ml-2 text-lg font-bold text-gray-800 dark:text-white">Madeh Hardware</h1>
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
