import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  FileText, 
  Users, 
  HardDrive, 
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { admin, logout } = useAuth();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: ShoppingCart, label: 'Purchases', path: '/purchases' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: HardDrive, label: 'Backup & Restore', path: '/backup' },
    ...(admin?.role === 'Super Admin' ? [
      { icon: Users, label: 'Admin Accounts', path: '/admin-accounts' },
    ] : []),
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  const handleLinkClick = () => {
    if (isOpen) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-green-800 text-white w-64 flex flex-col z-40 transform transition-transform md:relative md:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-green-700 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-green-200">
              MH
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold">Madeh Hardware</h1>
              <p className="text-green-200 text-sm">Management System</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-green-200 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-700 text-white'
                      : 'text-green-100 hover:bg-green-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-green-700">
          <div className="mb-4">
            <p className="text-green-200 text-sm">Signed in as</p>
            <p className="font-medium text-white truncate">{admin?.username}</p>
            <p className="text-green-200 text-sm">{admin?.role}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-green-100 hover:bg-green-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
