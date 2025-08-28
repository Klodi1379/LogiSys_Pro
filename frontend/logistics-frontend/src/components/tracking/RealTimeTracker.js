import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../notifications/NotificationSystem';

// Mock WebSocket for real-time tracking
const createMockWebSocket = (shipmentId) => {
  const mockSocket = {
    readyState: WebSocket.OPEN,
    send: (data) => console.log('Mock send:', data),
    close: () => {},
    onmessage: null,
    onopen: null,
    onclose: null,
    onerror: null
  };

  // Simulate real-time location updates
  setTimeout(() => {
    const interval = setInterval(() => {
      if (mockSocket.onmessage) {
        const mockUpdate = {
          shipmentId,
          location: {
            lat: 40.7128 + (Math.random() - 0.5) * 0.01,
            lng: -74.0060 + (Math.random() - 0.5) * 0.01
          },
          status: 'in_transit',
          timestamp: new Date().toISOString(),
          estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        };
        
        mockSocket.onmessage({ data: JSON.stringify(mockUpdate) });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, 1000);

  return mockSocket;
};

export const RealTimeTracker = ({ shipmentId, onLocationUpdate }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const socketRef = useRef(null);
  const { info, error } = useNotifications();

  useEffect(() => {
    if (!shipmentId) return;

    // In a real app, use WebSocket URL like: ws://localhost:8000/ws/tracking/${shipmentId}/
    const socket = createMockWebSocket(shipmentId);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      info('Connected to real-time tracking');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastUpdate(data);
        if (onLocationUpdate) {
          onLocationUpdate(data);
        }
      } catch (err) {
        console.error('Error parsing tracking data:', err);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    socket.onerror = () => {
      setIsConnected(false);
      setConnectionStatus('error');
      error('Real-time tracking connection failed');
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [shipmentId, onLocationUpdate, info, error]);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢';
      case 'disconnected':
        return '🔴';
      case 'error':
        return '🟠';
      default:
        return '⚪';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Real-Time Tracking</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm">{getStatusIcon()}</span>
          <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {connectionStatus}
          </span>
        </div>
      </div>

      {lastUpdate && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Current Location</p>
              <p className="font-medium">
                {lastUpdate.location.lat.toFixed(4)}, {lastUpdate.location.lng.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                lastUpdate.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                lastUpdate.status === 'delivered' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {lastUpdate.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Last Update</p>
              <p className="font-medium">
                {new Date(lastUpdate.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ETA</p>
              <p className="font-medium">
                {new Date(lastUpdate.estimatedArrival).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {!lastUpdate && isConnected && (
        <div className="text-center py-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Waiting for location updates...</p>
        </div>
      )}
    </div>
  );
};

// Shipment Timeline Component
export const ShipmentTimeline = ({ events }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment Timeline</h3>
      
      <div className="flow-root">
        <ul className="-mb-8">
          {events.map((event, eventIdx) => (
            <li key={event.id}>
              <div className="relative pb-8">
                {eventIdx !== events.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      event.type === 'pickup' ? 'bg-blue-500' :
                      event.type === 'transit' ? 'bg-yellow-500' :
                      event.type === 'delivery' ? 'bg-green-500' :
                      'bg-gray-500'
                    }`}>
                      <span className="text-white text-xs font-bold">
                        {event.type === 'pickup' ? '📦' :
                         event.type === 'transit' ? '🚛' :
                         event.type === 'delivery' ? '✅' : '📋'}
                      </span>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">{event.description}</p>
                      {event.location && (
                        <p className="text-xs text-gray-400 mt-1">{event.location}</p>
                      )}
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <time dateTime={event.timestamp}>
                        {new Date(event.timestamp).toLocaleString()}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Mock map component (in a real app, use Google Maps, Leaflet, etc.)
export const TrackingMap = ({ location, route = [] }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Map</h3>
      
      <div className="relative bg-gray-100 rounded-lg h-64 flex items-center justify-center">
        {/* Mock map visualization */}
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-gray-500">Interactive Map</p>
          {location && (
            <div className="mt-2 text-sm">
              <p className="font-medium">Current Position:</p>
              <p className="text-gray-600">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            </div>
          )}
        </div>
        
        {/* Mock vehicle marker */}
        {location && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse">
              <span className="text-2xl">🚛</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        * In production: Integrate Google Maps, Leaflet, or Mapbox
      </div>
    </div>
  );
};

export default RealTimeTracker;
