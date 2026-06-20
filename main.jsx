import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider as FirebaseProvider } from './lib/FirebaseAuthContext';
import { AuthProvider as WorkerProvider } from './contexts/WorkerAuthContext';
import './index.css';

// Find root element with error handling
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Failed to find the root element. Please ensure your index.html contains <div id="root"></div>'
  );
}

// Development performance tracking
if (import.meta.env.DEV) {
  performance.mark('react-mount-start');
}

// Create and render root
const root = ReactDOM.createRoot(rootElement);

// Wrap render in a function for better error handling
const renderApp = () => {
  root.render(
    <React.StrictMode>
      <FirebaseProvider>
        <WorkerProvider>
          <App />
        </WorkerProvider>
      </FirebaseProvider>
    </React.StrictMode>
  );
};

// Execute render with error boundary
try {
  renderApp();
} catch (error) {
  console.error('Failed to render application:', error);
  
  // Attempt to render fallback UI in production
  if (!import.meta.env.DEV) {
    root.render(
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#0a0a0c',
        color: '#f0ede8',
        fontFamily: 'system-ui, sans-serif',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '12px', color: '#c8102e' }}>
            ⚠️ Application Error
          </h1>
          <p style={{ color: '#a9a9a9', maxWidth: '400px' }}>
            The application failed to initialize. Please refresh the page or contact support if the issue persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              background: '#c8102e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}

// Development performance tracking
if (import.meta.env.DEV) {
  // Use requestAnimationFrame to ensure DOM is painted
  requestAnimationFrame(() => {
    performance.mark('react-mount-end');
    performance.measure('React Mount Time', 'react-mount-start', 'react-mount-end');
    
    // Log mount time in development
    const measure = performance.getEntriesByName('React Mount Time')[0];
    if (measure) {
      console.log(`✅ App mounted in ${measure.duration.toFixed(2)}ms`);
    }
    
    // Clean up performance entries after logging
    performance.clearMarks();
    performance.clearMeasures();
  });
}

// Optional: Log when app becomes interactive
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    console.log('🏎️ App is fully interactive');
    
    // Log environment information
    console.log(`📦 Environment: ${import.meta.env.DEV ? 'Development' : 'Production'}`);
    console.log(`🌐 Browser: ${navigator.userAgent}`);
    
    // Log memory usage if available
    if (performance.memory) {
      console.log(`💾 Memory: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)}MB used`);
    }
  });
} else {
  // Fallback for browsers without requestIdleCallback
  setTimeout(() => {
    console.log('🏎️ App is fully interactive');
  }, 100);
}

// Optional: Add service worker registration for PWA support
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('🔧 ServiceWorker registered successfully');
      })
      .catch(error => {
        console.warn('⚠️ ServiceWorker registration failed:', error);
      });
  });
}

// Handle uncaught errors in development
if (import.meta.env.DEV) {
  window.addEventListener('error', (event) => {
    console.error('🔥 Uncaught error:', event.error || event.message);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🔥 Unhandled Promise rejection:', event.reason);
  });
}

// Export for testing purposes
export { root, rootElement };