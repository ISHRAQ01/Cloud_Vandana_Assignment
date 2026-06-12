// Web Vitals performance monitoring
// Measures real-world user experience metrics

const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ 
      getCLS,    // Cumulative Layout Shift
      getFID,    // First Input Delay
      getFCP,    // First Contentful Paint
      getLCP,    // Largest Contentful Paint
      getTTFB    // Time to First Byte
    }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

// Helper function to log metrics to console in development
export const logWebVitals = (metric) => {
  // Only log in development mode
  if (process.env.NODE_ENV !== 'development') return;
  
  const metricName = metric.name.toUpperCase();
  const metricValue = Math.round(metric.value);
  
  console.log(`%c📊 ${metricName}`, 'color: #8b5cf6; font-weight: bold', `: ${metricValue}ms`);
  
  // Color code based on performance
  const getColor = (name, value) => {
    if (name === 'CLS') {
      if (value < 0.1) return '#22c55e';   // Good - Green
      if (value < 0.25) return '#f59e0b';  // Needs improvement - Orange
      return '#ef4444';                    // Poor - Red
    } else if (name === 'FID') {
      if (value < 100) return '#22c55e';   // Good - Green
      if (value < 300) return '#f59e0b';   // Needs improvement - Orange
      return '#ef4444';                    // Poor - Red
    } else {
      if (value < 2500) return '#22c55e';   // Good - Green
      if (value < 4000) return '#f59e0b';   // Needs improvement - Orange
      return '#ef4444';                     // Poor - Red
    }
  };
  
  const color = getColor(metric.name, metric.value);
  const status = metric.value < 2500 ? '✅ Good' : metric.value < 4000 ? '⚠️ Needs Improvement' : '❌ Poor';
  console.log(`%c   └─ Status: ${status}`, `color: ${color}`);
  
  // Log to analytics if in production
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics endpoint (customize as needed)
    // fetch('/api/analytics/web-vitals', { method: 'POST', body: JSON.stringify(metric) });
  }
};

// Track custom performance marks
export const trackPerformance = (markName, startMark, endMark) => {
  if (process.env.NODE_ENV === 'development') {
    performance.mark(markName);
    if (startMark && endMark) {
      performance.measure(markName, startMark, endMark);
      const measure = performance.getEntriesByName(markName)[0];
      if (measure) {
        console.log(`%c⏱️ ${markName}: ${Math.round(measure.duration)}ms`, 'color: #8b5cf6');
      }
    }
  }
};

// Track page load performance
export const trackPageLoad = () => {
  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('load', () => {
      const perfData = performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log(`%c🚀 Page Load Time: ${pageLoadTime}ms`, 'color: #22c55e; font-weight: bold');
    });
  }
};

// Track API call performance
export const trackApiCall = (endpoint, startTime) => {
  if (process.env.NODE_ENV === 'development') {
    const duration = Date.now() - startTime;
    const color = duration < 500 ? '#22c55e' : duration < 1000 ? '#f59e0b' : '#ef4444';
    console.log(`%c🌐 API Call: ${endpoint} - ${duration}ms`, `color: ${color}`);
  }
};

// Initialize performance tracking
export const initPerformanceTracking = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('%c🔍 Performance Monitoring Active', 'color: #8b5cf6; font-weight: bold');
    trackPageLoad();
  }
};

export default reportWebVitals;