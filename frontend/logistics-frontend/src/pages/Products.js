import React, { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI, suppliersAPI } from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    is_active: '',
    search: '',
  });

  // Form data for creating/editing products
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    supplier: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    cost_price: '',
    selling_price: '',
    min_stock_level: '',
    max_stock_level: '',
    reorder_point: '',
    is_fragile: false,
    requires_refrigeration: false,
    is_hazardous: false,
    is_active: true,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.supplier) params.supplier = filters.supplier;
      if (filters.is_active) params.is_active = filters.is_active;
      if (filters.search) params.search = filters.search;

      const data = await productsAPI.getAll(params);
      setProducts(data.results || data);
    } catch (err) {
      setError('Failed to load products');
      console.error('Products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data.results || data);
    } catch (err) {
      console.error('Categories error:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await suppliersAPI.getAll();
      setSuppliers(data.results || data);
    } catch (err) {
      console.error('Suppliers error:', err);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormChange = (e) => {
    const { name, type, checked, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await productsAPI.create(productForm);
      setShowCreateForm(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error('Create product error:', err);
      alert('Failed to create product');
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      sku: '',
      description: '',
      category: '',
      supplier: '',
      weight: '',
      length: '',
      width: '',
      height: '',
      cost_price: '',
      selling_price: '',
      min_stock_level: '',
      max_stock_level: '',
      reorder_point: '',
      is_fragile: false,
      requires_refrigeration: false,
      is_hazardous: false,
      is_active: true,
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your product catalog including specifications, pricing, and inventory settings.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
              Supplier
            </label>
            <select
              id="supplier"
              name="supplier"
              value={filters.supplier}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="is_active"
              name="is_active"
              value={filters.is_active}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
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
              placeholder="Name, SKU, or description..."
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

      {/* Products grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {product.name}
                </h3>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="mt-2">
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                <p className="text-sm text-gray-500">Category: {product.category_name}</p>
                <p className="text-sm text-gray-500">Supplier: {product.supplier_name}</p>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Cost: ${product.cost_price}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    Price: ${product.selling_price}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Stock</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {product.current_stock || 0}
                  </p>
                </div>
              </div>

              {/* Product properties */}
              <div className="mt-3 flex flex-wrap gap-1">
                {product.is_fragile && (
                  <span className="inline-flex px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                    Fragile
                  </span>
                )}
                {product.requires_refrigeration && (
                  <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    Refrigerated
                  </span>
                )}
                {product.is_hazardous && (
                  <span className="inline-flex px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                    Hazardous
                  </span>
                )}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new product.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Product
            </button>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Product</h3>
            <form onSubmit={handleCreateProduct}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      value={productForm.name}
                      onChange={handleFormChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      value={productForm.sku}
                      onChange={handleFormChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      value={productForm.description}
                      onChange={handleFormChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      name="category"
                      value={productForm.category}
                      onChange={handleFormChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                    <select
                      name="supplier"
                      value={productForm.supplier}
                      onChange={handleFormChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specifications and Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Specifications & Settings</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.001"
                        name="weight"
                        value={productForm.weight}
                        onChange={handleFormChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Length (cm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="length"
                        value={productForm.length}
                        onChange={handleFormChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Width (cm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="width"
                        value={productForm.width}
                        onChange={handleFormChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="height"
                        value={productForm.height}
                        onChange={handleFormChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                      <input
                        type="number"
                        step="0.01"
                        name="cost_price"
                        value={productForm.cost_price}
                        onChange={handleFormChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Selling Price</label>
                      <input
                        type="number"
                        step="0.01"
                        name="selling_price"
                        value={productForm.selling_price}
                        onChange={handleFormChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min Stock</label>
                      <input
                        type="number"
                        name="min_stock_level"
                        value={productForm.min_stock_level}
                        onChange={handleFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Stock</label>
                      <input
                        type="number"
                        name="max_stock_level"
                        value={productForm.max_stock_level}
                        onChange={handleFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reorder Point</label>
                      <input
                        type="number"
                        name="reorder_point"
                        value={productForm.reorder_point}
                        onChange={handleFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Properties */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Properties</h5>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_fragile"
                          checked={productForm.is_fragile}
                          onChange={handleFormChange}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Fragile</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="requires_refrigeration"
                          checked={productForm.requires_refrigeration}
                          onChange={handleFormChange}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Requires Refrigeration</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_hazardous"
                          checked={productForm.is_hazardous}
                          onChange={handleFormChange}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Hazardous</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={productForm.is_active}
                          onChange={handleFormChange}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Product Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedProduct.name}</p>
                  <p><strong>SKU:</strong> {selectedProduct.sku}</p>
                  <p><strong>Description:</strong> {selectedProduct.description || 'N/A'}</p>
                  <p><strong>Category:</strong> {selectedProduct.category_name}</p>
                  <p><strong>Supplier:</strong> {selectedProduct.supplier_name}</p>
                  <p><strong>Status:</strong> {selectedProduct.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Specifications</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Weight:</strong> {selectedProduct.weight} kg</p>
                  <p><strong>Dimensions:</strong> {selectedProduct.length} × {selectedProduct.width} × {selectedProduct.height} cm</p>
                  <p><strong>Volume:</strong> {selectedProduct.volume?.toFixed(2)} cm³</p>
                  <p><strong>Cost Price:</strong> ${selectedProduct.cost_price}</p>
                  <p><strong>Selling Price:</strong> ${selectedProduct.selling_price}</p>
                  <p><strong>Current Stock:</strong> {selectedProduct.current_stock || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Inventory Settings</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <p><strong>Min Stock:</strong> {selectedProduct.min_stock_level}</p>
                <p><strong>Max Stock:</strong> {selectedProduct.max_stock_level}</p>
                <p><strong>Reorder Point:</strong> {selectedProduct.reorder_point}</p>
              </div>
            </div>
            
            {(selectedProduct.is_fragile || selectedProduct.requires_refrigeration || selectedProduct.is_hazardous) && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-3">Special Properties</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.is_fragile && (
                    <span className="inline-flex px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                      Fragile
                    </span>
                  )}
                  {selectedProduct.requires_refrigeration && (
                    <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Requires Refrigeration
                    </span>
                  )}
                  {selectedProduct.is_hazardous && (
                    <span className="inline-flex px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                      Hazardous
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
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

export default Products;
