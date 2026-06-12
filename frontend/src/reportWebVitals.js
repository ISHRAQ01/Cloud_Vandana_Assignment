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
  console.log(`📊 Web Vitals - ${metric.name}: ${Math.round(metric.value)}ms`);
  
  // Color code based on performance
  const getColor = (name, value) => {
    if (name === 'CLS') {
      if (value < 0.1) return '#48bb78';  // Good - Green
      if (value < 0.25) return '#ed8936'; // Needs improvement - Orange
      return '#f56565';                   // Poor - Red
    } else {
      if (value < 2500) return '#48bb78';   // Good - Green
      if (value < 4000) return '#ed8936';   // Needs improvement - Orange
      return '#f56565';                     // Poor - Red
    }
  };
  
  const color = getColor(metric.name, metric.value);
  console.log(`%c   └─ Status: ${metric.value < 2500 ? '✅ Good' : metric.value < 4000 ? '⚠️ Needs Improvement' : '❌ Poor'}`, `color: ${color}`);
};

// Track custom performance marks
export const trackPerformance = (markName, startMark, endMark) => {
  if (process.env.NODE_ENV === 'development') {
    performance.mark(markName);
    if (startMark && endMark) {
      performance.measure(markName, startMark, endMark);
      const measure = performance.getEntriesByName(markName)[0];
      console.log(`⏱️ ${markName}: ${Math.round(measure.duration)}ms`);
    }
  }
};

export default reportWebVitals;