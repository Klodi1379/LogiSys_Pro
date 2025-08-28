// Performance monitoring and optimization utilities

// Debounce function for optimizing API calls and user input
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle function for limiting function execution frequency
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization utility for expensive calculations
export const memoize = (fn, getKey = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  return (...args) => {
    const key = getKey(...args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Performance monitoring class
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.isEnabled = true;
  }

  // Start timing a operation
  startTiming(label) {
    if (!this.isEnabled) return;
    
    if (performance.mark) {
      performance.mark(`${label}-start`);
    }
    
    this.metrics.set(label, {
      startTime: performance.now(),
      label
    });
  }

  // End timing and record duration
  endTiming(label) {
    if (!this.isEnabled || !this.metrics.has(label)) return 0;
    
    const startTime = this.metrics.get(label).startTime;
    const duration = performance.now() - startTime;
    
    if (performance.mark && performance.measure) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
    }
    
    this.metrics.set(label, {
      ...this.metrics.get(label),
      duration,
      endTime: performance.now()
    });

    // Notify observers
    this.notifyObservers(label, duration);
    
    return duration;
  }

  // Get metrics for a specific operation
  getMetric(label) {
    return this.metrics.get(label);
  }

  // Get all metrics
  getAllMetrics() {
    const results = {};
    this.metrics.forEach((value, key) => {
      if (value.duration !== undefined) {
        results[key] = {
          duration: value.duration,
          startTime: value.startTime,
          endTime: value.endTime
        };
      }
    });
    return results;
  }

  // Add observer for performance events
  addObserver(callback) {
    this.observers.push(callback);
  }

  // Notify all observers
  notifyObservers(label, duration) {
    this.observers.forEach(callback => {
      try {
        callback(label, duration);
      } catch (error) {
        console.error('Performance observer error:', error);
      }
    });
  }

  // Clear all metrics
  clear() {
    this.metrics.clear();
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }

  // Enable/disable monitoring
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Measure React component render time
  measureRender(componentName, renderFunction) {
    if (!this.isEnabled) return renderFunction();
    
    this.startTiming(`render-${componentName}`);
    const result = renderFunction();
    this.endTiming(`render-${componentName}`);
    
    return result;
  }

  // Measure API call duration
  async measureApiCall(endpoint, apiCall) {
    if (!this.isEnabled) return await apiCall();
    
    this.startTiming(`api-${endpoint}`);
    try {
      const result = await apiCall();
      this.endTiming(`api-${endpoint}`);
      return result;
    } catch (error) {
      this.endTiming(`api-${endpoint}`);
      throw error;
    }
  }

  // Get Core Web Vitals
  getCoreWebVitals() {
    return new Promise((resolve) => {
      if (!window.performance || !window.PerformanceObserver) {
        resolve({});
        return;
      }

      const vitals = {};

      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          vitals.fid = entry.processingStart - entry.startTime;
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        vitals.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // Time to First Byte (TTFB)
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        vitals.ttfb = navigation.responseStart - navigation.requestStart;
      }

      setTimeout(() => resolve(vitals), 1000);
    });
  }
}

// Create global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Bundle size analyzer utility
export class BundleAnalyzer {
  static analyzeChunks() {
    if (!window.performance || !window.performance.getEntriesByType) {
      return {};
    }

    const resources = window.performance.getEntriesByType('resource');
    const jsResources = resources.filter(resource => 
      resource.name.includes('.js') && !resource.name.includes('hot-update')
    );

    return jsResources.map(resource => ({
      name: resource.name.split('/').pop(),
      size: resource.transferSize || resource.decodedBodySize || 0,
      loadTime: resource.duration,
      url: resource.name
    })).sort((a, b) => b.size - a.size);
  }

  static getTotalBundleSize() {
    const chunks = this.analyzeChunks();
    return chunks.reduce((total, chunk) => total + chunk.size, 0);
  }
}

// Memory usage monitoring
export class MemoryMonitor {
  static getCurrentUsage() {
    if (!performance.memory) {
      return null;
    }

    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      usedMB: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalMB: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
      limitMB: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
      percentage: ((performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100).toFixed(2)
    };
  }

  static startMonitoring(interval = 5000, callback) {
    const monitor = setInterval(() => {
      const usage = this.getCurrentUsage();
      if (usage && callback) {
        callback(usage);
      }
    }, interval);

    return () => clearInterval(monitor);
  }

  static checkMemoryPressure(threshold = 80) {
    const usage = this.getCurrentUsage();
    if (!usage) return false;
    
    return parseFloat(usage.percentage) > threshold;
  }
}

// Image optimization utilities
export class ImageOptimizer {
  static async compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  static generateSrcSet(imageUrl, sizes = [480, 768, 1024, 1920]) {
    return sizes.map(size => `${imageUrl}?w=${size} ${size}w`).join(', ');
  }

  static lazyLoadImages(selector = 'img[data-lazy]') {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.lazy;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll(selector).forEach(img => {
        observer.observe(img);
      });
    }
  }
}

// Network optimization utilities
export class NetworkOptimizer {
  static checkConnectionSpeed() {
    if (!navigator.connection) {
      return { type: 'unknown', speed: 'unknown' };
    }

    const connection = navigator.connection;
    return {
      type: connection.effectiveType,
      speed: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  static shouldLoadHighQuality() {
    const connection = this.checkConnectionSpeed();
    return connection.type === '4g' && connection.speed > 5 && !connection.saveData;
  }

  static preloadResource(url, type = 'fetch') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    document.head.appendChild(link);
    
    return link;
  }

  static prefetchResource(url) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
    
    return link;
  }
}

// Local storage optimization
export class StorageOptimizer {
  static setWithExpiry(key, value, ttl) {
    const now = new Date();
    const item = {
      value: value,
      expiry: now.getTime() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  static getWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      const now = new Date();
      
      if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  static cleanup() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      this.getWithExpiry(key); // This will remove expired items
    });
  }

  static getStorageSize() {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    return {
      bytes: totalSize,
      kb: (totalSize / 1024).toFixed(2),
      mb: (totalSize / 1024 / 1024).toFixed(2)
    };
  }
}

// Error tracking and reporting
export class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 50;
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript',
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        reason: event.reason,
        timestamp: new Date().toISOString()
      });
    });
  }

  logError(errorInfo) {
    this.errors.unshift(errorInfo);
    
    // Keep only latest errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Send to monitoring service (implement as needed)
    if (window.reportError) {
      window.reportError(errorInfo);
    }

    console.error('Error logged:', errorInfo);
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }

  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      recent: this.errors.filter(error => 
        new Date() - new Date(error.timestamp) < 60000 // Last minute
      ).length
    };

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }
}

// Create global instances
export const errorTracker = new ErrorTracker();

// React performance utilities
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return function PerformanceMonitoredComponent(props) {
    React.useEffect(() => {
      performanceMonitor.startTiming(`component-mount-${componentName}`);
      return () => {
        performanceMonitor.endTiming(`component-mount-${componentName}`);
      };
    }, []);

    return React.createElement(WrappedComponent, props);
  };
};

// Utility for measuring component re-renders
export const useRenderCounter = (componentName) => {
  const renderCount = React.useRef(0);
  
  React.useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });
  
  return renderCount.current;
};

// Export all utilities as a single object for easy importing
export default {
  debounce,
  throttle,
  memoize,
  performanceMonitor,
  BundleAnalyzer,
  MemoryMonitor,
  ImageOptimizer,
  NetworkOptimizer,
  StorageOptimizer,
  errorTracker,
  withPerformanceMonitoring,
  useRenderCounter
};

// Add React import
import React from 'react';
