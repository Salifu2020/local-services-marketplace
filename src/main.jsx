import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/mobile.css'
import { initSentry } from './sentry'
import { ErrorBoundaryWithRouter } from './components/ErrorBoundary'

// Initialize Sentry as early as possible in your application's lifecycle
initSentry();

// Register service worker for caching and offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundaryWithRouter>
      <App />
    </ErrorBoundaryWithRouter>
  </React.StrictMode>,
)

