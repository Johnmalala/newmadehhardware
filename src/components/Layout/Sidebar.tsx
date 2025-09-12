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
  Store
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { admin, logout } = useAuth();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: ShoppingCart, label: 'Purchases', path: '/purchases' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    ...(admin?.role === 'Super Admin' ? [
      { icon: Users, label: 'Admin Accounts', path: '/admin-accounts' },
      { icon: HardDrive, label: 'Backup & Restore', path: '/backup' }
    ] : []),
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  return (
    <div className="bg-green-800 text-white w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-green-700">
        <div className="flex items-center">
          <Store className="w-8 h-8 text-green-200" />
          <div className="ml-3">
            <h1 className="text-xl font-bold">Madeh Hardware</h1>
            <p className="text-green-200 text-sm">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
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
          <p className="font-medium">{admin?.username}</p>
          <p className="text-green-300 text-sm">{admin?.role}</p>
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
  );
};

export default Sidebar;
