import React, { useState, useEffect } from 'react';
import { ordersAPI, customersAPI } from '../services/api';
import { AdvancedDataTable } from '../components/common/AdvancedDataTable';
import { useNotifications } from '../components/notifications/NotificationSystem';
import { RealTimeTracker, ShipmentTimeline, TrackingMap } from '../components/tracking/RealTimeTracker';

const EnhancedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    dateRange: '',
    search: '',
  });

  const { success, error, info } = useNotifications();

  // Form data for creating new orders
  const [orderForm, setOrderForm] = useState({
    customer: '',
    priority: 'normal',
    delivery_address: '',
    delivery_city: '',
    special_instructions: '',
  });

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;

      const data = await ordersAPI.getAll(params);
      setOrders(data.results || data);
    } catch (err) {
      error('Failed to load orders');
      console.error('Orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customersAPI.getAll();
      setCustomers(data.results || data);
    } catch (err) {
      console.error('Customers error:', err);
    }
  };

  const handleFormChange = (e) => {
    setOrderForm({
      ...orderForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await ordersAPI.create(orderForm);
      setShowCreateForm(false);
      setOrderForm({
        customer: '',
        priority: 'normal',
        delivery_address: '',
        delivery_city: '',
        special_instructions: '',
      });
      fetchOrders();
      success('Order created successfully!');
    } catch (err) {
      console.error('Create order error:', err);
      error('Failed to create order');
    }
  };

  const handleBulkAction = async (actionKey, selectedIds) => {
    try {
      if (actionKey === 'confirm') {
        // Bulk confirm orders
        await Promise.all(selectedIds.map(id => ordersAPI.confirm(id)));
        success(`${selectedIds.length} orders confirmed successfully!`);
      } else if (actionKey === 'cancel') {
        // Bulk cancel orders
        await Promise.all(selectedIds.map(id => 
          ordersAPI.update(id, { status: 'cancelled' })
        ));
        success(`${selectedIds.length} orders cancelled successfully!`);
      }
      fetchOrders();
    } catch (err) {
      error(`Failed to perform bulk action: ${actionKey}`);
    }
  };

  const handleExport = (data, format) => {
    // Mock export functionality
    info(`Exporting ${data.length} orders as ${format.toUpperCase()}`);
    
    if (format === 'csv') {
      const csvContent = [
        ['Order Number', 'Customer', 'Status', 'Priority', 'Total', 'Date'].join(','),
        ...data.map(order => [
          order.order_number,
          order.customer_name,
          order.status,
          order.priority,
          order.total_amount,
          new Date(order.order_date).toLocaleDateString()
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      success('CSV export completed!');
    }
  };

  const handleTrackOrder = (order) => {
    setSelectedOrder(order);
    setShowTrackingModal(true);
    
    // Mock tracking data
    setTrackingData({
      location: { lat: 40.7128, lng: -74.0060 },
      events: [
        {
          id: 1,
          type: 'pickup',
          description: 'Order picked up from warehouse',
          location: 'Main Warehouse',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          type: 'transit',
          description: 'Package in transit',
          location: 'Distribution Center',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
      ]
    });
  };

  const handleLocationUpdate = (locationData) => {
    setTrackingData(prev => ({
      ...prev,
      location: locationData.location
    }));
  };

  // Table columns configuration
  const columns = [
    {
      key: 'order_number',
      label: 'Order Number',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">ID: {row.id}</div>
        </div>
      )
    },
    {
      key: 'customer_name',
      label: 'Customer',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
          {value.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => (
        <span className={`font-medium ${getPriorityColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'total_amount',
      label: 'Total',
      render: (value) => `$${parseFloat(value || 0).toFixed(2)}`
    },
    {
      key: 'order_date',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, order) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedOrder(order)}
            className="text-blue-600 hover:text-blue-900 text-sm"
          >
            View
          </button>
          {order.status === 'pending' && (
            <button
              onClick={() => handleConfirmOrder(order.id)}
              className="text-green-600 hover:text-green-900 text-sm"
            >
              Confirm
            </button>
          )}
          {order.status === 'shipped' && (
            <button
              onClick={() => handleTrackOrder(order)}
              className="text-purple-600 hover:text-purple-900 text-sm"
            >
              Track
            </button>
          )}
        </div>
      )
    }
  ];

  const bulkActions = [
    {
      key: 'confirm',
      label: 'Confirm Selected',
      className: 'bg-green-600 text-white hover:bg-green-700'
    },
    {
      key: 'cancel',
      label: 'Cancel Selected',
      className: 'bg-red-600 text-white hover:bg-red-700'
    }
  ];

  const handleConfirmOrder = async (orderId) => {
    try {
      await ordersAPI.confirm(orderId);
      fetchOrders();
      success('Order confirmed successfully!');
    } catch (err) {
      error('Failed to confirm order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      ready_to_ship: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      returned: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600',
      normal: 'text-gray-600',
      high: 'text-orange-600',
      urgent: 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage customer orders with advanced filtering, bulk operations, and real-time tracking
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Order
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="ready_to_ship">Ready to Ship</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">
              Date Range
            </label>
            <select
              id="dateRange"
              name="dateRange"
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', priority: '', dateRange: '', search: '' })}
              className="w-full rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Data Table */}
      <AdvancedDataTable
        data={orders}
        columns={columns}
        loading={loading}
        selectable={true}
        onBulkAction={handleBulkAction}
        bulkActions={bulkActions}
        onExport={handleExport}
        searchable={true}
        sortable={true}
        paginated={true}
        pageSize={15}
      />

      {/* Create Order Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Order</h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <select
                  name="customer"
                  value={orderForm.customer}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  name="priority"
                  value={orderForm.priority}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                <textarea
                  name="delivery_address"
                  value={orderForm.delivery_address}
                  onChange={handleFormChange}
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery City</label>
                <input
                  type="text"
                  name="delivery_city"
                  value={orderForm.delivery_city}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
                <textarea
                  name="special_instructions"
                  value={orderForm.special_instructions}
                  onChange={handleFormChange}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create Order
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && !showTrackingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Order Number:</strong> {selectedOrder.order_number}</p>
                <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
                <p><strong>Status:</strong> {selectedOrder.status}</p>
                <p><strong>Priority:</strong> {selectedOrder.priority}</p>
              </div>
              <div>
                <p><strong>Total Amount:</strong> ${selectedOrder.total_amount}</p>
                <p><strong>Order Date:</strong> {new Date(selectedOrder.order_date).toLocaleString()}</p>
                <p><strong>Delivery Address:</strong> {selectedOrder.delivery_address}</p>
                <p><strong>Delivery City:</strong> {selectedOrder.delivery_city}</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              {selectedOrder.status === 'shipped' && (
                <button
                  onClick={() => handleTrackOrder(selectedOrder)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  Track Shipment
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Tracking Modal */}
      {showTrackingModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-5/6 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Track Order #{selectedOrder.order_number}
              </h3>
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <RealTimeTracker
                  shipmentId={selectedOrder.id}
                  onLocationUpdate={handleLocationUpdate}
                />
                <TrackingMap location={trackingData?.location} />
              </div>
              
              <div>
                <ShipmentTimeline events={trackingData?.events || []} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedOrders;
