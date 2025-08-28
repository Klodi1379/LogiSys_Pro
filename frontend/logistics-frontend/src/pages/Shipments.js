import React, { useState, useEffect } from 'react';
import { shipmentsAPI } from '../services/api';

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  useEffect(() => {
    fetchShipments();
  }, [filters]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const data = await shipmentsAPI.getAll(params);
      setShipments(data.results || data);
    } catch (err) {
      setError('Failed to load shipments');
      console.error('Shipments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    try {
      await shipmentsAPI.updateStatus(shipmentId, newStatus);
      fetchShipments();
    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update shipment status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      created: 'bg-gray-100 text-gray-800',
      ready_for_pickup: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track and manage shipments throughout the delivery process.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="created">Created</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
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
              placeholder="Shipment or tracking number..."
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

      {/* Shipments table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Shipment
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Driver
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Vehicle
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Orders
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {shipments.map((shipment) => (
                    <tr key={shipment.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div>
                          <div className="font-medium text-gray-900">{shipment.shipment_number}</div>
                          <div className="text-gray-500">Tracking: {shipment.tracking_number}</div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(shipment.status)}`}>
                          {shipment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shipment.driver_name || 'Unassigned'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shipment.vehicle_license || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shipment.orders_count || 0} orders
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(shipment.created_at).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedShipment(shipment)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          {shipment.status !== 'delivered' && shipment.status !== 'cancelled' && (
                            <div className="relative">
                              <select
                                onChange={(e) => handleStatusUpdate(shipment.id, e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                                defaultValue=""
                              >
                                <option value="">Update Status</option>
                                {shipment.status === 'created' && <option value="ready_for_pickup">Ready for Pickup</option>}
                                {shipment.status === 'ready_for_pickup' && <option value="picked_up">Picked Up</option>}
                                {shipment.status === 'picked_up' && <option value="in_transit">In Transit</option>}
                                {shipment.status === 'in_transit' && <option value="delivered">Delivered</option>}
                                <option value="cancelled">Cancel</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {shipments.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No shipments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Shipments will appear here once orders are ready for delivery.
          </p>
        </div>
      )}

      {/* Shipment Detail Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Shipment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Shipment Number:</strong> {selectedShipment.shipment_number}</p>
                <p><strong>Tracking Number:</strong> {selectedShipment.tracking_number}</p>
                <p><strong>Status:</strong> {selectedShipment.status.replace('_', ' ')}</p>
                <p><strong>Driver:</strong> {selectedShipment.driver_name || 'Unassigned'}</p>
                <p><strong>Vehicle:</strong> {selectedShipment.vehicle_license || 'N/A'}</p>
              </div>
              <div>
                <p><strong>Created:</strong> {new Date(selectedShipment.created_at).toLocaleString()}</p>
                <p><strong>Total Weight:</strong> {selectedShipment.total_weight_kg} kg</p>
                <p><strong>Total Volume:</strong> {selectedShipment.total_volume_cbm} cbm</p>
                <p><strong>Orders Count:</strong> {selectedShipment.orders_count || 0}</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
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
    </div>
  );
};

export default Shipments;
