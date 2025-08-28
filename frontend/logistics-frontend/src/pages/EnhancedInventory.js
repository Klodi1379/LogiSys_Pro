import React, { useState, useEffect } from 'react';
import { stockAPI, warehousesAPI, productsAPI } from '../services/api';
import { AdvancedDataTable } from '../components/common/AdvancedDataTable';
import { useNotifications } from '../components/notifications/NotificationSystem';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EnhancedInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [filters, setFilters] = useState({
    warehouse: '',
    stockLevel: '', // low, normal, high
    product: '',
    search: '',
  });

  const { success, error, warning } = useNotifications();

  // Stock adjustment form
  const [adjustmentForm, setAdjustmentForm] = useState({
    item_id: '',
    adjustment_type: 'add', // add, remove, set
    quantity: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stockData, warehouseData, productData] = await Promise.all([
        stockAPI.getAll(buildParams()),
        warehousesAPI.getAll(),
        productsAPI.getAll()
      ]);
      
      setInventory(stockData.results || stockData);
      setWarehouses(warehouseData.results || warehouseData);
      setProducts(productData.results || productData);
    } catch (err) {
      error('Failed to load inventory data');
      console.error('Inventory error:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildParams = () => {
    const params = {};
    if (filters.warehouse) params.warehouse_id = filters.warehouse;
    if (filters.product) params.product_id = filters.product;
    if (filters.search) params.search = filters.search;
    return params;
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    try {
      // Mock stock adjustment API call
      const adjustmentData = {
        ...adjustmentForm,
        timestamp: new Date().toISOString()
      };
      
      // In a real app, this would be: await stockAPI.adjustStock(adjustmentForm);
      console.log('Stock adjustment:', adjustmentData);
      
      setShowStockAdjustment(false);
      setAdjustmentForm({
        item_id: '',
        adjustment_type: 'add',
        quantity: '',
        reason: '',
        notes: ''
      });
      
      fetchData();
      success('Stock adjustment completed successfully!');
    } catch (err) {
      error('Failed to adjust stock');
    }
  };

  const handleBulkStockUpdate = async (actionKey, selectedIds) => {
    try {
      if (actionKey === 'reorder') {
        // Trigger reorder for selected items
        warning(`Reorder initiated for ${selectedIds.length} items`);
      } else if (actionKey === 'audit') {
        // Mark items for audit
        success(`${selectedIds.length} items marked for inventory audit`);
      }
      fetchData();
    } catch (err) {
      error(`Failed to perform bulk action: ${actionKey}`);
    }
  };

  const getStockLevelColor = (current, min, max) => {
    if (current <= min) return 'text-red-600 bg-red-50';
    if (current >= max) return 'text-blue-600 bg-blue-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockLevelText = (current, min, max) => {
    if (current <= min) return 'Low Stock';
    if (current >= max) return 'Overstock';
    return 'Normal';
  };

  // Generate stock level chart data
  const stockLevelData = warehouses.map(warehouse => ({
    warehouse: warehouse.name,
    lowStock: Math.floor(Math.random() * 20) + 5,
    normalStock: Math.floor(Math.random() * 50) + 30,
    overStock: Math.floor(Math.random() * 15) + 3
  }));

  // Table columns
  const columns = [
    {
      key: 'product_name',
      label: 'Product',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">SKU: {row.product_sku}</div>
        </div>
      )
    },
    {
      key: 'warehouse_name',
      label: 'Warehouse',
    },
    {
      key: 'location',
      label: 'Location',
      render: (value) => value || 'Unassigned'
    },
    {
      key: 'current_stock',
      label: 'Current Stock',
      render: (value, row) => (
        <div className="text-center">
          <div className="font-semibold text-lg">{value}</div>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            getStockLevelColor(value, row.min_stock_level, row.max_stock_level)
          }`}>
            {getStockLevelText(value, row.min_stock_level, row.max_stock_level)}
          </span>
        </div>
      )
    },
    {
      key: 'min_stock_level',
      label: 'Min Level',
    },
    {
      key: 'max_stock_level',
      label: 'Max Level',
    },
    {
      key: 'last_updated',
      label: 'Last Updated',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedItem(item)}
            className="text-blue-600 hover:text-blue-900 text-sm"
          >
            View
          </button>
          <button
            onClick={() => {
              setAdjustmentForm({ ...adjustmentForm, item_id: item.id });
              setShowStockAdjustment(true);
            }}
            className="text-green-600 hover:text-green-900 text-sm"
          >
            Adjust
          </button>
        </div>
      )
    }
  ];

  const bulkActions = [
    {
      key: 'reorder',
      label: 'Reorder Selected',
      className: 'bg-blue-600 text-white hover:bg-blue-700'
    },
    {
      key: 'audit',
      label: 'Mark for Audit',
      className: 'bg-yellow-600 text-white hover:bg-yellow-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor and manage stock levels across all warehouses
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:flex sm:items-center space-x-3">
          <button
            onClick={() => setShowBulkUpdate(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Bulk Update
          </button>
          <button
            onClick={() => setShowStockAdjustment(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Stock Adjustment
          </button>
        </div>
      </div>

      {/* Stock Level Overview Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Level Overview</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockLevelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="warehouse" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="lowStock" stackId="a" fill="#ef4444" name="Low Stock" />
              <Bar dataKey="normalStock" stackId="a" fill="#10b981" name="Normal Stock" />
              <Bar dataKey="overStock" stackId="a" fill="#2563eb" name="Overstock" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700">
              Warehouse
            </label>
            <select
              id="warehouse"
              value={filters.warehouse}
              onChange={(e) => setFilters({ ...filters, warehouse: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="stockLevel" className="block text-sm font-medium text-gray-700">
              Stock Level
            </label>
            <select
              id="stockLevel"
              value={filters.stockLevel}
              onChange={(e) => setFilters({ ...filters, stockLevel: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Levels</option>
              <option value="low">Low Stock</option>
              <option value="normal">Normal Stock</option>
              <option value="high">Overstock</option>
            </select>
          </div>

          <div>
            <label htmlFor="product" className="block text-sm font-medium text-gray-700">
              Product
            </label>
            <select
              id="product"
              value={filters.product}
              onChange={(e) => setFilters({ ...filters, product: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Products</option>
              {products.slice(0, 20).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ warehouse: '', stockLevel: '', product: '', search: '' })}
              className="w-full rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Data Table */}
      <AdvancedDataTable
        data={inventory}
        columns={columns}
        loading={loading}
        selectable={true}
        onBulkAction={handleBulkStockUpdate}
        bulkActions={bulkActions}
        searchable={true}
        sortable={true}
        paginated={true}
        pageSize={20}
      />

      {/* Stock Adjustment Modal */}
      {showStockAdjustment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Stock Adjustment</h3>
            <form onSubmit={handleStockAdjustment} className="space-y-4">
              {!adjustmentForm.item_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item</label>
                  <select
                    value={adjustmentForm.item_id}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, item_id: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select Item</option>
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.product_name} - {item.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Adjustment Type</label>
                <select
                  value={adjustmentForm.adjustment_type}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustment_type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="add">Add Stock</option>
                  <option value="remove">Remove Stock</option>
                  <option value="set">Set Stock Level</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  value={adjustmentForm.quantity}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })}
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <select
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select Reason</option>
                  <option value="damaged">Damaged Goods</option>
                  <option value="expired">Expired Items</option>
                  <option value="found">Found During Audit</option>
                  <option value="correction">Inventory Correction</option>
                  <option value="return">Customer Return</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Apply Adjustment
                </button>
                <button
                  type="button"
                  onClick={() => setShowStockAdjustment(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Inventory Item Details</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Product Information</h4>
                <p><strong>Name:</strong> {selectedItem.product_name}</p>
                <p><strong>SKU:</strong> {selectedItem.product_sku}</p>
                <p><strong>Category:</strong> {selectedItem.category || 'N/A'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Stock Information</h4>
                <p><strong>Current Stock:</strong> {selectedItem.current_stock}</p>
                <p><strong>Min Level:</strong> {selectedItem.min_stock_level}</p>
                <p><strong>Max Level:</strong> {selectedItem.max_stock_level}</p>
                <p><strong>Location:</strong> {selectedItem.location || 'Unassigned'}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setAdjustmentForm({ ...adjustmentForm, item_id: selectedItem.id });
                  setSelectedItem(null);
                  setShowStockAdjustment(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Adjust Stock
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedInventory;
