import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Download, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface BulkUpdateProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface UpdateError {
  row: number;
  field: string;
  message: string;
  value: string;
}

const BulkUpdate: React.FC<BulkUpdateProps> = ({ onComplete, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    errors: UpdateError[];
    notFound: string[];
  } | null>(null);

  const downloadTemplate = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, category, price, stock')
        .limit(5);

      let csvContent = 'ID,Name,Category,Price,Stock\n';
      
      if (products && products.length > 0) {
        products.forEach(product => {
          csvContent += `"${product.id}","${product.name}","${product.category}",${product.price},${product.stock}\n`;
        });
      } else {
        csvContent += '"PRODUCT_ID_HERE","Sample Product Name","Sample Category",25.99,100\n';
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_update_template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating template:', error);
    }
  };

  const validateUpdateData = (data: any[], existingIds: string[]) => {
    const errors: UpdateError[] = [];
    const notFound: string[] = [];

    data.forEach((row, index) => {
      const rowNum = index + 2;

      if (!row.ID || !existingIds.includes(row.ID)) {
        notFound.push(row.ID || `Missing ID in row ${rowNum}`);
        return;
      }

      if (row.Category && row.Category.trim() === '') {
        errors.push({ row: rowNum, field: 'Category', message: 'Category cannot be an empty string if provided', value: row.Category });
      }

      if (row.Price && row.Price.trim() !== '') {
        const price = parseFloat(row.Price);
        if (isNaN(price) || price <= 0) {
          errors.push({ row: rowNum, field: 'Price', message: 'Price must be a positive number', value: row.Price });
        }
      }

      if (row.Stock && row.Stock.trim() !== '') {
        const stock = parseInt(row.Stock, 10);
        if (isNaN(stock) || stock < 0) {
          errors.push({ row: rowNum, field: 'Stock', message: 'Stock must be a whole number ≥ 0', value: row.Stock });
        }
      }
    });

    return { errors, notFound };
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const { data: existingProducts } = await supabase.from('products').select('id');
      const existingIds = (existingProducts || []).map(p => p.id);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const data = results.data as any[];
            const { errors, notFound } = validateUpdateData(data, existingIds);
            
            const validData = data.filter(row => !notFound.includes(row.ID) && !errors.some(e => e.row === data.indexOf(row) + 2));

            let successCount = 0;
            if (validData.length > 0) {
              for (const row of validData) {
                const updateData: any = {};
                if (row.Category && row.Category.trim() !== '') updateData.category = row.Category.trim();
                if (row.Price && row.Price.trim() !== '') updateData.price = parseFloat(row.Price);
                if (row.Stock && row.Stock.trim() !== '') updateData.stock = parseInt(row.Stock, 10);

                if (Object.keys(updateData).length > 0) {
                  const { error: updateError } = await supabase.from('products').update(updateData).eq('id', row.ID);
                  if (updateError) throw updateError;
                  successCount++;
                }
              }
            }

            setResults({ success: successCount, errors, notFound });
          } catch (error) {
            console.error('Error processing updates:', error);
            alert('An error occurred during product updates.');
          } finally {
            setLoading(false);
          }
        },
        error: (error) => {
          console.error('CSV Parsing Error:', error);
          alert('Failed to parse CSV file. Please check its format.');
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Error fetching existing products:', error);
      alert('Could not verify existing products. Please try again.');
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete();
    setResults(null);
    setFile(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Bulk Update Products</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!results ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Step 1: Download Template</h3>
                <p className="text-gray-600 mb-4">
                  Download a CSV template with existing product IDs. Update the fields you want to change.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Step 2: Upload Your File</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="csv-update"
                  />
                  <label
                    htmlFor="csv-update"
                    className="cursor-pointer text-blue-600 hover:text-blue-700"
                  >
                    Choose CSV file or drag and drop
                  </label>
                  {file && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-800 mb-2">Update Instructions:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• ID column is required and must match existing products</li>
                  <li>• Only include columns you want to update (Category, Price, Stock)</li>
                  <li>• Leave cells empty to keep current values</li>
                  <li>• Price must be positive if provided</li>
                  <li>• Stock must be whole number ≥ 0 if provided</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={!file || loading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Update Products
                </button>
              </div>
            </>
          ) : (
            <div>
              <h3 className="text-lg font-medium mb-4">Update Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <div>
                      <p className="font-medium text-green-800">Updated</p>
                      <p className="text-2xl font-bold text-green-900">{results.success}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
                    <div>
                      <p className="font-medium text-red-800">Errors</p>
                      <p className="text-2xl font-bold text-red-900">{results.errors.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-6 h-6 text-yellow-600 mr-2" />
                    <div>
                      <p className="font-medium text-yellow-800">Not Found</p>
                      <p className="text-2xl font-bold text-yellow-900">{results.notFound.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-800 mb-3">Validation Errors:</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-32 overflow-y-auto">
                    {results.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 mb-1">
                        Row {error.row}: {error.field} - {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.notFound.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-yellow-800 mb-3">Product IDs Not Found:</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-700">
                      {results.notFound.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Complete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUpdate;
