import React, { useState } from 'react';
import NewPurchase from './NewPurchase';
import { ShoppingCart } from 'lucide-react';

const PurchasesPage: React.FC = () => {
  // This state can be used to switch between "New Purchase" and "Purchase History" in the future.
  const [activeTab, setActiveTab] = useState('new');

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Management</h1>
          <p className="text-gray-600">Create new purchases and manage your sales.</p>
        </div>
      </div>
      
      {/* Tab navigation can be added here later */}
      
      <div className="flex-grow">
        {activeTab === 'new' && <NewPurchase />}
        {/* {activeTab === 'history' && <PurchaseHistory />} */}
      </div>
    </div>
  );
};

export default PurchasesPage;
