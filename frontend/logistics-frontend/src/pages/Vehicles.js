import React, { useState, useEffect } from 'react';
import { vehiclesAPI } from '../services/api';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filters, setFilters] = useState({
    vehicle_type: '',
    status: '',
    search: '',
  });

  useEffect(() => {
    fetchVehicles();
  }, [filters]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.vehicle_type) params.vehicle_type = filters.vehicle_type;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const data = await vehiclesAPI.getAll(params);
      setVehicles(data.results || data);
    } catch (err) {
      setError('Failed to load vehicles');
      console.error('Vehicles error:', err);
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

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      out_of_service: 'bg-red-100 text-red-800',
      retired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'van':
        return '🚐';
      case 'truck':
        return '🚛';
      case 'lorry':
        return '🚚';
      case 'motorcycle':
        return '🏍️';
      case 'bicycle':
        return '🚲';
      default:
        return '🚛';
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
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your delivery fleet and track vehicle availability and status.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="vehicle_type" className="block text-sm font-medium text-gray-700">
              Vehicle Type
            </label>
            <select
              id="vehicle_type"
              name="vehicle_type"
              value={filters.vehicle_type}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="van">Van</option>
              <option value="truck">Truck</option>
              <option value="lorry">Lorry</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="bicycle">Bicycle</option>
            </select>
          </div>
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
              <option value="active">Active</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="out_of_service">Out of Service</option>
              <option value="retired">Retired</option>
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
              placeholder="License plate, make, model..."
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

      {/* Vehicles grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getTypeIcon(vehicle.vehicle_type)}</span>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {vehicle.license_plate}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {vehicle.vehicle_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Color</p>
                  <p className="text-sm font-medium text-gray-900">
                    {vehicle.color}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Max Weight</p>
                  <p className="text-sm font-medium text-gray-900">
                    {vehicle.max_weight_kg} kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Max Volume</p>
                  <p className="text-sm font-medium text-gray-900">
                    {vehicle.max_volume_cbm} m³
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-2 w-2 rounded-full mr-2 ${
                    vehicle.is_available ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm text-gray-600">
                    {vehicle.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedVehicle(vehicle)}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {vehicles.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-1M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add vehicles to your fleet to start managing deliveries.
          </p>
        </div>
      )}

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>License Plate:</strong> {selectedVehicle.license_plate}</p>
                  <p><strong>Type:</strong> {selectedVehicle.vehicle_type}</p>
                  <p><strong>Make & Model:</strong> {selectedVehicle.make} {selectedVehicle.model}</p>
                  <p><strong>Year:</strong> {selectedVehicle.year}</p>
                  <p><strong>Color:</strong> {selectedVehicle.color}</p>
                  <p><strong>Status:</strong> {selectedVehicle.status.replace('_', ' ')}</p>
                  <p><strong>Available:</strong> {selectedVehicle.is_available ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Specifications</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Max Weight:</strong> {selectedVehicle.max_weight_kg} kg</p>
                  <p><strong>Max Volume:</strong> {selectedVehicle.max_volume_cbm} m³</p>
                  <p><strong>Max Items:</strong> {selectedVehicle.max_items}</p>
                  <p><strong>Current Mileage:</strong> {selectedVehicle.current_mileage_km?.toLocaleString() || 'N/A'} km</p>
                  <p><strong>Created:</strong> {new Date(selectedVehicle.created_at).toLocaleDateString()}</p>
                  <p><strong>Updated:</strong> {new Date(selectedVehicle.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedVehicle(null)}
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

export default Vehicles;
