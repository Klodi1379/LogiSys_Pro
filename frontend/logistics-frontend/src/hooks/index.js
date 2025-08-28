import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../components/notifications/NotificationSystem';

// Custom hook for API calls with loading and error states
export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { error: showError, success: showSuccess } = useNotifications();

  const execute = async (asyncFunction, successMessage = null, errorMessage = null) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      if (successMessage) {
        showSuccess(successMessage);
      }
      return result;
    } catch (err) {
      const message = err.response?.data?.message || err.message || errorMessage || 'Operation failed';
      setError(message);
      showError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, execute };
};

// Custom hook for local storage with automatic serialization
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue];
};

// Custom hook for real-time data updates
export const useRealTimeData = (fetchFunction, interval = 30000, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRealTime, setIsRealTime] = useState(false);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    try {
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('Real-time data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startRealTime = () => {
    setIsRealTime(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(fetchData, interval);
  };

  const stopRealTime = () => {
    setIsRealTime(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const refresh = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, dependencies);

  return {
    data,
    loading,
    error,
    refresh,
    isRealTime,
    startRealTime,
    stopRealTime
  };
};

// Custom hook for table data with sorting, filtering, and pagination
export const useTableData = (initialData = [], defaultPageSize = 10) => {
  const [data, setData] = useState(initialData);
  const [filteredData, setFilteredData] = useState(initialData);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [filters, setFilters] = useState({});

  // Update filtered data when data, filters, or search term changes
  useEffect(() => {
    let filtered = [...data];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value != null) {
        filtered = filtered.filter(item => {
          if (typeof value === 'string') {
            return String(item[key]).toLowerCase().includes(value.toLowerCase());
          }
          return item[key] === value;
        });
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when data changes
  }, [data, searchTerm, filters, sortConfig]);

  // Get paginated data
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSortConfig({ key: null, direction: 'asc' });
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
    data: paginatedData,
    allData: data,
    setData,
    filteredData,
    searchTerm,
    setSearchTerm,
    filters,
    handleFilter,
    clearFilters,
    sortConfig,
    handleSort,
    currentPage,
    setCurrentPage: goToPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems: filteredData.length,
    goToPage
  };
};

// Custom hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0
  });

  const startTiming = (label) => {
    if (performance.mark) {
      performance.mark(`${label}-start`);
    }
  };

  const endTiming = (label) => {
    if (performance.mark && performance.measure) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      
      const measure = performance.getEntriesByName(label)[0];
      return measure ? measure.duration : 0;
    }
    return 0;
  };

  const measureNetworkLatency = async (url = '/api/health') => {
    const start = performance.now();
    try {
      await fetch(url);
      const latency = performance.now() - start;
      setMetrics(prev => ({ ...prev, networkLatency: latency }));
      return latency;
    } catch (error) {
      console.error('Network latency measurement failed:', error);
      return -1;
    }
  };

  const measureMemoryUsage = () => {
    if (performance.memory) {
      const memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
      
      const usagePercent = (memory.used / memory.total) * 100;
      setMetrics(prev => ({ ...prev, memoryUsage: usagePercent }));
      return memory;
    }
    return null;
  };

  const getPageLoadTime = () => {
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      setMetrics(prev => ({ ...prev, loadTime }));
      return loadTime;
    }
    return 0;
  };

  useEffect(() => {
    // Measure initial page load time
    const timer = setTimeout(() => {
      getPageLoadTime();
      measureMemoryUsage();
    }, 100);

    // Set up periodic memory monitoring
    const memoryInterval = setInterval(measureMemoryUsage, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(memoryInterval);
    };
  }, []);

  return {
    metrics,
    startTiming,
    endTiming,
    measureNetworkLatency,
    measureMemoryUsage,
    getPageLoadTime
  };
};

// Custom hook for WebSocket connections
export const useWebSocket = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const { error: showError, success: showSuccess } = useNotifications();

  const connect = () => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        if (options.showNotifications) {
          showSuccess('Connected to real-time updates');
        }
        if (options.onOpen) options.onOpen();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (options.onMessage) options.onMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (options.showNotifications && error) {
          showError('Connection lost. Attempting to reconnect...');
        }
        if (options.onClose) options.onClose();
        
        // Auto-reconnect
        if (options.autoReconnect !== false) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, options.reconnectInterval || 5000);
        }
      };

      ws.onerror = (err) => {
        setError('WebSocket connection error');
        if (options.showNotifications) {
          showError('Connection error occurred');
        }
        if (options.onError) options.onError(err);
      };

      setSocket(ws);
    } catch (err) {
      setError('Failed to create WebSocket connection');
      if (options.showNotifications) {
        showError('Failed to establish connection');
      }
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  };

  const sendMessage = (data) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(data));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [url]);

  return {
    socket,
    isConnected,
    error,
    lastMessage,
    connect,
    disconnect,
    sendMessage
  };
};

// Custom hook for form validation
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (fieldName = null) => {
    const newErrors = {};
    const fieldsToValidate = fieldName ? [fieldName] : Object.keys(validationRules);

    fieldsToValidate.forEach(field => {
      const rules = validationRules[field];
      const value = values[field];

      if (rules) {
        if (rules.required && (!value || value.toString().trim() === '')) {
          newErrors[field] = `${field} is required`;
        } else if (rules.minLength && value && value.length < rules.minLength) {
          newErrors[field] = `${field} must be at least ${rules.minLength} characters`;
        } else if (rules.maxLength && value && value.length > rules.maxLength) {
          newErrors[field] = `${field} must not exceed ${rules.maxLength} characters`;
        } else if (rules.pattern && value && !rules.pattern.test(value)) {
          newErrors[field] = rules.patternMessage || `${field} format is invalid`;
        } else if (rules.custom && value) {
          const customError = rules.custom(value, values);
          if (customError) {
            newErrors[field] = customError;
          }
        }
      }
    });

    if (fieldName) {
      setErrors(prev => ({ ...prev, [fieldName]: newErrors[fieldName] }));
    } else {
      setErrors(newErrors);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validate(name);
  };

  const handleSubmit = async (onSubmit) => {
    setIsSubmitting(true);
    setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    
    if (validate()) {
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validate
  };
};
