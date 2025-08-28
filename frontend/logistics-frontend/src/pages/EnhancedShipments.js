import React, { useState, useEffect } from 'react';
import { shipmentsAPI, vehiclesAPI, ordersAPI } from '../services/api';
import { AdvancedDataTable } from '../components/common/AdvancedDataTable';
import { useNotifications } from '../components/notifications/NotificationSystem';
import { RealTimeTracker, ShipmentTimeline, TrackingMap } from '../components/tracking/RealTimeTracker';

const EnhancedShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRouteOptimization, setShowRouteOptimization] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  
  const [filters, setFilters] = useState({
    status: '',
    vehicle: '',
    date: '',
    search: '',
  });

  const { success, error, info } = useNotifications();

  // Create shipment form
  const [shipmentForm, setShipmentForm] = useState({
    orders: [],
    vehicle: '',
    driver: '',
    pickup_date: '',
    estimated_delivery: '',
    special_instructions: ''
  });

  // Route optimization form
  const [routeForm, setRouteForm] = useState({
    vehicle_id: '',
    max_stops: 10,
    optimize_for: 'time', // time, distance, fuel
    avoid_traffic: true,
    time_windows: true
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shipmentsData, vehiclesData, ordersData] = await Promise.all([
        shipmentsAPI.getAll(buildParams()),
        vehiclesAPI.getAll(),
        ordersAPI.getAll({ status: 'ready_to_ship' })
      ]);
      
      setShipments(shipmentsData.results || shipmentsData);
      setVehicles(vehiclesData.results || vehiclesData);
      setAvailableOrders(ordersData.results || ordersData);
    } catch (err) {
      error('Failed to load shipments data');
      console.error('Shipments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildParams = () => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.vehicle) params.vehicle_id = filters.vehicle;
    if (filters.date) params.pickup_date = filters.date;
    if (filters.search) params.search = filters.search;
    return params;
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    try {
      await shipmentsAPI.create(shipmentForm);
      setShowCreateForm(false);
      setShipmentForm({
        orders: [],
        vehicle: '',
        driver: '',
        pickup_date: '',
        estimated_delivery: '',
        special_instructions: ''
      });
      fetchData();
      success('Shipment created successfully!');
    } catch (err) {
      error('Failed to create shipment');
    }
  };

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    try {
      await shipmentsAPI.updateStatus(shipmentId, newStatus);
      fetchData();
      success(`Shipment status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      error('Failed to update shipment status');
    }
  };

  const handleBulkAction = async (actionKey, selectedIds) => {
    try {
      if (actionKey === 'dispatch') {
        await Promise.all(selectedIds.map(id => 
          shipmentsAPI.updateStatus(id, 'in_transit')
        ));
        success(`${selectedIds.length} shipments dispatched!`);
      } else if (actionKey === 'optimize') {
        info(`Route optimization initiated for ${selectedIds.length} shipments`);
        setShowRouteOptimization(true);
      }
      fetchData();
    } catch (err) {
      error(`Failed to perform bulk action: ${actionKey}`);
    }
  };

  const handleRouteOptimization = async (e) => {
    e.preventDefault();
    try {
      // Mock route optimization API call
      info('Optimizing routes... This may take a few moments.');
      
      // Simulate API call delay
      setTimeout(() => {
        success('Routes optimized successfully! Estimated 15% reduction in travel time.');
        setShowRouteOptimization(false);
        fetchData();
      }, 3000);
      
    } catch (err) {
      error('Failed to optimize routes');
    }
  };

  const handleTrackShipment = (shipment) => {
    setSelectedShipment(shipment);
    setShowTrackingModal(true);
    
    // Mock tracking data
    setTrackingData({
      location: { lat: 40.7128, lng: -74.0060 },
      events: [
        {
          id: 1,
          type: 'pickup',
          description: `Shipment ${shipment.shipment_number} picked up`,
          location: 'Main Warehouse',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          type: 'transit',
          description: 'Package in transit to distribution center',
          location: 'Highway 101',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          type: 'transit',
          description: 'Arrived at distribution center',
          location: 'North Distribution Center',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
      ]
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      ready_for_pickup: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      out_for_delivery: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      failed_delivery: 'bg-red-100 text-red-800',
      returned: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Table columns
  const columns = [
    {
      key: 'shipment_number',
      label: 'Shipment #',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">ID: {row.id}</div>
        </div>
      )
    },
    {
      key: 'vehicle_info',
      label: 'Vehicle',
      render: (_, row) => row.vehicle_license || 'Unassigned'
    },
    {
      key: 'driver_name',
      label: 'Driver',
      render: (value) => value || 'Unassigned'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value || 'draft')}`}>
          {value ? value.replace('_', ' ') : 'Draft'}
        </span>
      )
    },
    {
      key: 'order_count',
      label: 'Orders',
      render: (value, row) => `${row.orders_count || value || 0} orders`
    },
    {
      key: 'pickup_date',
      label: 'Pickup Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'TBD'
    },
    {
      key: 'estimated_delivery',
      label: 'Est. Delivery',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'TBD'
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, shipment) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedShipment(shipment)}
            className="text-blue-600 hover:text-blue-900 text-sm"
          >
            View
          </button>
          {shipment.status === 'ready_for_pickup' && (
            <button
              onClick={() => handleStatusUpdate(shipment.id, 'in_transit')}
              className="text-green-600 hover:text-green-900 text-sm"
            >
              Dispatch
            </button>
          )}
          {(shipment.status === 'in_transit' || shipment.status === 'out_for_delivery') && (
            <button
              onClick={() => handleTrackShipment(shipment)}
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
      key: 'dispatch',
      label: 'Dispatch Selected',
      className: 'bg-green-600 text-white hover:bg-green-700'
    },
    {
      key: 'optimize',
      label: 'Optimize Routes',
      className: 'bg-blue-600 text-white hover:bg-blue-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipment Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage shipments with route optimization and real-time tracking
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:flex sm:items-center space-x-3">
          <button
            onClick={() => setShowRouteOptimization(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            🗺️ Optimize Routes
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Shipment
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📦</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Shipments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {shipments.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">🚛</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    In Transit
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {shipments.filter(s => s.status === 'in_transit').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">✅</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Delivered Today
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {shipments.filter(s => s.status === 'delivered').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📍</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ready for Pickup
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {shipments.filter(s => s.status === 'ready_for_pickup').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed_delivery">Failed Delivery</option>
              <option value="returned">Returned</option>
            </select>
          </div>

          <div>
            <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700">
              Vehicle
            </label>
            <select
              id="vehicle"
              value={filters.vehicle}
              onChange={(e) => setFilters({ ...filters, vehicle: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Vehicles</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', vehicle: '', date: '', search: '' })}
              className="w-full rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Data Table */}
      <AdvancedDataTable
        data={shipments}
        columns={columns}
        loading={loading}
        selectable={true}
        onBulkAction={handleBulkAction}
        bulkActions={bulkActions}
        searchable={true}
        sortable={true}
        paginated={true}
        pageSize={15}
      />

      {/* Create Shipment Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Shipment</h3>
            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle</label>
                <select
                  value={shipmentForm.vehicle}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, vehicle: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.filter(v => v.status === 'active').map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pickup Date</label>
                  <input
                    type="datetime-local"
                    value={shipmentForm.pickup_date}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, pickup_date: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Delivery</label>
                  <input
                    type="datetime-local"
                    value={shipmentForm.estimated_delivery}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, estimated_delivery: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Orders to Include</label>
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                  {availableOrders.map((order) => (
                    <label key={order.id} className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={shipmentForm.orders.includes(order.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setShipmentForm({
                              ...shipmentForm,
                              orders: [...shipmentForm.orders, order.id]
                            });
                          } else {
                            setShipmentForm({
                              ...shipmentForm,
                              orders: shipmentForm.orders.filter(id => id !== order.id)
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm">
                        {order.order_number} - {order.customer_name} (${order.total_amount})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
                <textarea
                  value={shipmentForm.special_instructions}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, special_instructions: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create Shipment
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

      {/* Route Optimization Modal */}
      {showRouteOptimization && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Route Optimization</h3>
            <form onSubmit={handleRouteOptimization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle</label>
                <select
                  value={routeForm.vehicle_id}
                  onChange={(e) => setRouteForm({ ...routeForm, vehicle_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Vehicles</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Optimize For</label>
                <select
                  value={routeForm.optimize_for}
                  onChange={(e) => setRouteForm({ ...routeForm, optimize_for: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="time">Shortest Time</option>
                  <option value="distance">Shortest Distance</option>
                  <option value="fuel">Fuel Efficiency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max Stops</label>
                <input
                  type="number"
                  value={routeForm.max_stops}
                  onChange={(e) => setRouteForm({ ...routeForm, max_stops: parseInt(e.target.value) })}
                  min="1"
                  max="50"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={routeForm.avoid_traffic}
                    onChange={(e) => setRouteForm({ ...routeForm, avoid_traffic: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Avoid Traffic</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={routeForm.time_windows}
                    onChange={(e) => setRouteForm({ ...routeForm, time_windows: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Consider Delivery Time Windows</span>
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Optimize Routes
                </button>
                <button
                  type="button"
                  onClick={() => setShowRouteOptimization(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipment Detail Modal */}
      {selectedShipment && !showTrackingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Shipment Details</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Shipment Information</h4>
                <p><strong>Shipment #:</strong> {selectedShipment.shipment_number}</p>
                <p><strong>Status:</strong> {selectedShipment.status}</p>
                <p><strong>Vehicle:</strong> {selectedShipment.vehicle_license || selectedShipment.vehicle_license_plate || 'Unassigned'}</p>
                <p><strong>Driver:</strong> {selectedShipment.driver_name || 'Unassigned'}</p>
                <p><strong>Weight:</strong> {selectedShipment.total_weight_kg ? `${selectedShipment.total_weight_kg} kg` : 'N/A'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Schedule</h4>
                <p><strong>Pickup Date:</strong> {selectedShipment.pickup_date ? new Date(selectedShipment.pickup_date).toLocaleString() : 'TBD'}</p>
                <p><strong>Est. Delivery:</strong> {selectedShipment.estimated_delivery ? new Date(selectedShipment.estimated_delivery).toLocaleString() : 'TBD'}</p>
                <p><strong>Orders:</strong> {selectedShipment.orders_count || 0}</p>
              </div>
            </div>

            {selectedShipment.special_instructions && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Special Instructions</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedShipment.special_instructions}</p>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <div className="space-x-3">
                {selectedShipment.status === 'ready_for_pickup' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedShipment.id, 'in_transit')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Dispatch
                  </button>
                )}
                {(selectedShipment.status === 'in_transit' || selectedShipment.status === 'out_for_delivery') && (
                  <button
                    onClick={() => handleTrackShipment(selectedShipment)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  >
                    Track Shipment
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Tracking Modal */}
      {showTrackingModal && selectedShipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-5/6 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Track Shipment #{selectedShipment.shipment_number}
              </h3>
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setSelectedShipment(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <RealTimeTracker
                  shipmentId={selectedShipment.id}
                  onLocationUpdate={(data) => setTrackingData(prev => ({
                    ...prev,
                    location: data.location
                  }))}
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

export default EnhancedShipments;
