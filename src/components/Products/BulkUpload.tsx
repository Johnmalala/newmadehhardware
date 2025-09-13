import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Download, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface BulkUploadProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: string;
}

const BulkUpload: React.FC<BulkUploadProps> = ({ onComplete, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    errors: ValidationError[];
  } | null>(null);

  const downloadTemplate = () => {
    const csvContent = `Name,Category,Price,Stock
"Hammer, Claw","Tools",15.99,50
"Screwdriver Set (10pc)","Tools",25.50,30
"Nails, 1kg pack","Fasteners",8.75,100
"Wire Strippers, Professional","Electrical",22.00,25`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateProductData = (data: any[], existingNames: string[]) => {
    const errors: ValidationError[] = [];
    const seenNames = new Set<string>();

    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because of header row and 0-based index

      if (!row.Name || row.Name.trim() === '') {
        errors.push({ row: rowNum, field: 'Name', message: 'Name must not be empty', value: row.Name || '' });
      } else {
        const name = row.Name.trim();
        if (existingNames.includes(name.toLowerCase())) {
          errors.push({ row: rowNum, field: 'Name', message: 'Product already exists in database', value: name });
        }
        if (seenNames.has(name.toLowerCase())) {
          errors.push({ row: rowNum, field: 'Name', message: 'Duplicate product name within this file', value: name });
        }
        seenNames.add(name.toLowerCase());
      }

      if (!row.Category || row.Category.trim() === '') {
        errors.push({ row: rowNum, field: 'Category', message: 'Category must not be empty', value: row.Category || '' });
      }

      const price = row.Price ? parseFloat(row.Price) : NaN;
      if (isNaN(price) || price <= 0) {
        errors.push({ row: rowNum, field: 'Price', message: 'Price must be a positive number', value: row.Price || '' });
      }

      const stock = row.Stock ? parseInt(row.Stock, 10) : NaN;
      if (isNaN(stock) || stock < 0) {
        errors.push({ row: rowNum, field: 'Stock', message: 'Stock must be a whole number ≥ 0', value: row.Stock || '' });
      }
    });

    return errors;
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const { data: existingProducts } = await supabase.from('products').select('name');
      const existingNames = (existingProducts || []).map(p => p.name.toLowerCase());

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const data = results.data as any[];
            const errors = validateProductData(data, existingNames);
            
            const validData = data.filter((_row, index) => 
              !errors.some(error => error.row === index + 2)
            );

            let successCount = 0;
            if (validData.length > 0) {
              const productsToInsert = validData.map(row => ({
                name: row.Name.trim(),
                category: row.Category.trim(),
                price: parseFloat(row.Price),
                stock: parseInt(row.Stock, 10)
              }));

              const { error: insertError } = await supabase.from('products').insert(productsToInsert);
              if (insertError) throw insertError;
              successCount = validData.length;
            }

            setResults({ success: successCount, errors });
          } catch (error) {
            console.error('Error processing products:', error);
            alert('An error occurred during product insertion.');
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-white">Bulk Upload Products</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!results ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 dark:text-white">Step 1: Download Template</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Download the CSV template, fill in your products, and upload it back.
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
                <h3 className="text-lg font-medium mb-3 dark:text-white">Step 2: Upload Your File</h3>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700"
                  >
                    Choose CSV file or drag and drop
                  </label>
                  {file && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Validation Rules:</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Name must not be empty</li>
                  <li>• Category must be valid</li>
                  <li>• Price must be positive</li>
                  <li>• Stock must be whole number ≥ 0</li>
                  <li>• Duplicate product names will be flagged</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={!file || loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Products
                </button>
              </div>
            </>
          ) : (
            <div>
              <h3 className="text-lg font-medium mb-4 dark:text-white">Upload Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Products Added</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-white">{results.success}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mr-2" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">Errors Found</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-white">{results.errors.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-3">Error Report:</h4>
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-40 overflow-y-auto">
                    {results.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 dark:text-red-300 mb-1">
                        Row {error.row}: {error.field} - {error.message} 
                        {error.value && <span className="font-mono ml-1">("{error.value}")</span>}
                      </div>
                    ))}
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

export default BulkUpload;
