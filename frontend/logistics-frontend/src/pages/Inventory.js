import React, { useState, useEffect } from 'react';
import { stockAPI, warehousesAPI } from '../services/api';

const Inventory = () => {
  const [stockItems, setStockItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({
    warehouse: '',
    search: '',
  });

  useEffect(() => {
    fetchStockItems();
    fetchWarehouses();
  }, [filters]);

  const fetchStockItems = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.warehouse) params.warehouse = filters.warehouse;
      if (filters.search) params.search = filters.search;

      const data = await stockAPI.getAll(params);
      setStockItems(data.results || data);
    } catch (err) {
      setError('Failed to load inventory');
      console.error('Inventory error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const data = await warehousesAPI.getAll();
      setWarehouses(data.results || data);
    } catch (err) {
      console.error('Warehouses error:', err);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const getStockStatus = (item) => {
    const available = item.available_quantity || 0;
    const total = item.quantity || 0;
    
    if (available === 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (available < total * 0.2) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor stock levels across all warehouses and manage inventory locations.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700">
              Warehouse
            </label>
            <select
              id="warehouse"
              name="warehouse"
              value={filters.warehouse}
              onChange={handleFilterChange}
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
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              name="search"
              id="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Product name or SKU..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Inventory table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Product
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Warehouse
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Location
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Quantity
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Available
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Batch
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {stockItems.map((item) => {
                    const stockStatus = getStockStatus(item);
                    return (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div>
                            <div className="font-medium text-gray-900">{item.product_name}</div>
                            <div className="text-gray-500">{item.product_sku}</div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.warehouse_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.location_code}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className="font-medium">{item.available_quantity}</span>
                          {item.reserved_quantity > 0 && (
                            <span className="text-yellow-600 text-xs ml-1">
                              ({item.reserved_quantity} reserved)
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.batch_number || 'N/A'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {stockItems.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Stock items will appear here once products are received at warehouses.
          </p>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Stock Item Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Product Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Product:</strong> {selectedItem.product_name}</p>
                  <p><strong>SKU:</strong> {selectedItem.product_sku}</p>
                  <p><strong>Warehouse:</strong> {selectedItem.warehouse_name}</p>
                  <p><strong>Location:</strong> {selectedItem.location_code}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Quantity & Status</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Total Quantity:</strong> {selectedItem.quantity}</p>
                  <p><strong>Available Quantity:</strong> {selectedItem.available_quantity}</p>
                  <p><strong>Reserved Quantity:</strong> {selectedItem.reserved_quantity}</p>
                  <p><strong>Unit Cost:</strong> ${selectedItem.unit_cost}</p>
                </div>
              </div>
            </div>
            
            {(selectedItem.batch_number || selectedItem.expiry_date) && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-3">Batch Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><strong>Batch Number:</strong> {selectedItem.batch_number || 'N/A'}</p>
                  <p><strong>Expiry Date:</strong> {selectedItem.expiry_date ? new Date(selectedItem.expiry_date).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Manufacturing Date:</strong> {selectedItem.manufacturing_date ? new Date(selectedItem.manufacturing_date).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Received Date:</strong> {new Date(selectedItem.received_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
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

export default Inventory;
