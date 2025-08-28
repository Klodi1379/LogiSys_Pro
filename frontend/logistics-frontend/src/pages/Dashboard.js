import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e5e7eb', 
            borderTop: '4px solid #2563eb', 
            borderRadius: '50%',
            margin: '0 auto 16px'
          }}></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        backgroundColor: '#fef2f2', 
        border: '1px solid #fecaca', 
        color: '#dc2626', 
        padding: '16px', 
        borderRadius: '6px' 
      }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#111827', 
          marginBottom: '8px' 
        }}>
          Dashboard
        </h1>
        <p style={{ color: '#6b7280' }}>
          Welcome back! Here's what's happening with your logistics operations today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" style={{ marginBottom: '32px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <h3 style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            marginBottom: '8px' 
          }}>
            Total Orders
          </h3>
          <p style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#111827' 
          }}>
            {stats?.total_orders || 0}
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <h3 style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            marginBottom: '8px' 
          }}>
            Pending Orders
          </h3>
          <p style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#f59e0b' 
          }}>
            {stats?.pending_orders || 0}
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <h3 style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            marginBottom: '8px' 
          }}>
            Active Shipments
          </h3>
          <p style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#10b981' 
          }}>
            {stats?.active_shipments || 0}
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <h3 style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            marginBottom: '8px' 
          }}>
            Total Products
          </h3>
          <p style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#8b5cf6' 
          }}>
            {stats?.total_products || 0}
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <h3 style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            marginBottom: '8px' 
          }}>
            Low Stock Items
          </h3>
          <p style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#ef4444' 
          }}>
            {stats?.low_stock_products || 0}
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <h3 style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            marginBottom: '8px' 
          }}>
            Available Vehicles
          </h3>
          <p style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#6366f1' 
          }}>
            {stats?.available_vehicles || 0}
          </p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '500', 
            color: '#111827', 
            marginBottom: '16px' 
          }}>
            Recent Orders
          </h3>
          {stats?.recent_orders && stats.recent_orders.length > 0 ? (
            <div style={{ space: '12px' }}>
              {stats.recent_orders.slice(0, 5).map((order) => (
                <div key={order.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>
                      {order.order_number}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                      {order.customer_name}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>
                      ${order.total_amount}
                    </p>
                    <span style={{ 
                      fontSize: '12px', 
                      padding: '4px 8px', 
                      borderRadius: '12px',
                      backgroundColor: order.status === 'delivered' ? '#dcfce7' : 
                                     order.status === 'pending' ? '#fef3c7' : 
                                     '#dbeafe',
                      color: order.status === 'delivered' ? '#166534' : 
                             order.status === 'pending' ? '#92400e' : 
                             '#1e40af'
                    }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>No recent orders</p>
          )}
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '500', 
            color: '#111827', 
            marginBottom: '16px' 
          }}>
            Recent Shipments
          </h3>
          {stats?.recent_shipments && stats.recent_shipments.length > 0 ? (
            <div>
              {stats.recent_shipments.slice(0, 5).map((shipment) => (
                <div key={shipment.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>
                      {shipment.shipment_number}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                      {shipment.driver_name || 'Unassigned'}
                    </p>
                  </div>
                  <span style={{ 
                    fontSize: '12px', 
                    padding: '4px 8px', 
                    borderRadius: '12px',
                    backgroundColor: shipment.status === 'delivered' ? '#dcfce7' : 
                                   shipment.status === 'in_transit' ? '#dbeafe' : 
                                   '#fef3c7',
                    color: shipment.status === 'delivered' ? '#166534' : 
                           shipment.status === 'in_transit' ? '#1e40af' : 
                           '#92400e'
                  }}>
                    {shipment.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>No recent shipments</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
