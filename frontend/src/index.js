import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #0f0f23 100%)',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(26, 26, 58, 0.9)',
            backdropFilter: 'blur(12px)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
            }}>
              <span style={{ fontSize: '40px' }}>⚠️</span>
            </div>
            <h2 style={{ 
              color: '#f3f4f6', 
              marginBottom: '12px',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>Something went wrong</h2>
            <p style={{ 
              color: '#9ca3af', 
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              The application encountered an unexpected error.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #f97316)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
              }}
            >
              Reload Application
            </button>
            {this.state.error && (
              <p style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '20px',
                padding: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                wordBreak: 'break-all'
              }}>
                Error: {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Performance monitoring
reportWebVitals(console.log);

// Optional: Log application startup
console.log(`
🚀 =====================================
✨ Salesforce Switch Application Started
📡 Environment: ${process.env.NODE_ENV}
🎨 Theme: Premium Dark Edition
⚡ Status: Ready
=====================================
`);