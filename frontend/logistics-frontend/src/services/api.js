import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (username, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
      username,
      password,
    });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/users/me/');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats/');
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/orders/', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/orders/${id}/`);
    return response.data;
  },
  
  create: async (orderData) => {
    const response = await api.post('/orders/', orderData);
    return response.data;
  },
  
  update: async (id, orderData) => {
    const response = await api.patch(`/orders/${id}/`, orderData);
    return response.data;
  },
  
  confirm: async (id) => {
    const response = await api.post(`/orders/${id}/confirm/`);
    return response.data;
  },
  
  getDashboardStats: async () => {
    const response = await api.get('/orders/dashboard_stats/');
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/products/', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/products/${id}/`);
    return response.data;
  },
  
  create: async (productData) => {
    const response = await api.post('/products/', productData);
    return response.data;
  },
  
  update: async (id, productData) => {
    const response = await api.patch(`/products/${id}/`, productData);
    return response.data;
  },
  
  getLowStock: async () => {
    const response = await api.get('/products/low_stock/');
    return response.data;
  },
};

// Customers API
export const customersAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/customers/', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/customers/${id}/`);
    return response.data;
  },
  
  create: async (customerData) => {
    const response = await api.post('/customers/', customerData);
    return response.data;
  },
  
  update: async (id, customerData) => {
    const response = await api.patch(`/customers/${id}/`, customerData);
    return response.data;
  },
};

// Warehouses API
export const warehousesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/warehouses/', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/warehouses/${id}/`);
    return response.data;
  },
};

// Vehicles API
export const vehiclesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/vehicles/', { params });
    return response.data;
  },
  
  getAvailable: async () => {
    const response = await api.get('/vehicles/available/');
    return response.data;
  },
};

// Shipments API
export const shipmentsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/shipments/', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/shipments/${id}/`);
    return response.data;
  },
  
  create: async (shipmentData) => {
    const response = await api.post('/shipments/', shipmentData);
    return response.data;
  },
  
  updateStatus: async (id, status) => {
    const response = await api.post(`/shipments/${id}/update_status/`, { status });
    return response.data;
  },
};

// Stock Items API
export const stockAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/stock-items/', { params });
    return response.data;
  },
  
  getByWarehouse: async (warehouseId) => {
    const response = await api.get(`/stock-items/by_warehouse/?warehouse_id=${warehouseId}`);
    return response.data;
  },
};

// Suppliers API
export const suppliersAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/suppliers/', { params });
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get('/categories/');
    return response.data;
  },
};

export default api;
