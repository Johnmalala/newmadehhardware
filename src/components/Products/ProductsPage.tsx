import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { supabase } from '../../lib/supabase';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import BulkUpload from './BulkUpload';
import BulkUpdate from './BulkUpdate';
import { Plus, Search, Filter, Upload, Edit3 } from 'lucide-react';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;

      setProducts(data || []);
      
      const uniqueCategories = [...new Set((data || []).map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const handleProductSaved = () => {
    loadProducts();
    setShowAddForm(false);
    setEditingProduct(null);
  };

  const handleProductDeleted = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleBulkUploadComplete = () => {
    loadProducts();
    setShowBulkUpload(false);
  };

  const handleBulkUpdateComplete = () => {
    loadProducts();
    setShowBulkUpdate(false);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Products Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your hardware products inventory</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowBulkUpdate(true)}
            className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 flex items-center text-sm"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Bulk Update
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex items-center flex-1">
              <Filter className="w-5 h-5 text-gray-400 mr-2" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-right sm:text-left">
              {filteredProducts.length} of {products.length} products
            </div>
          </div>
        </div>
      </div>

      {/* Product List */}
      <ProductList
        products={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleProductDeleted}
      />

      {showAddForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleProductSaved}
          onCancel={() => {
            setShowAddForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      {showBulkUpload && (
        <BulkUpload
          onComplete={handleBulkUploadComplete}
          onCancel={() => setShowBulkUpload(false)}
        />
      )}

      {showBulkUpdate && (
        <BulkUpdate
          onComplete={handleBulkUpdateComplete}
          onCancel={() => setShowBulkUpdate(false)}
        />
      )}
    </div>
  );
};

export default ProductsPage;
